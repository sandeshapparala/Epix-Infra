"use client";
import { useEffect, useRef, useState } from "react";
import type {
  PDFDocumentProxy,
  PDFDocumentLoadingTask,
  RenderTask,
} from "pdfjs-dist";
import styles from "./sales.module.css";

export default function QuotationPages({ blob }: { blob: Blob }) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null),
    [page, setPage] = useState(1),
    [zoom, setZoom] = useState(1),
    [rendering, setRendering] = useState(true),
    [error, setError] = useState(""),
    [text, setText] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true,
      task: PDFDocumentLoadingTask | undefined;
    setPdf(null);
    setPage(1);
    setError("");
    void (async () => {
      const [api, data] = await Promise.all([
        import("pdfjs-dist"),
        blob.arrayBuffer(),
      ]);
      if (!active) return;
      api.GlobalWorkerOptions.workerSrc = `/theater-pdf/pdf.worker.${api.version}.min.mjs`;
      task = api.getDocument({
        data: new Uint8Array(data),
        useSystemFonts: true,
      });
      const loaded = await task.promise;
      if (active) setPdf(loaded);
      else void task.destroy();
    })().catch(() => {
      if (active)
        setError(
          "The PDF could not be displayed. You can still download the saved document below.",
        );
    });
    return () => {
      active = false;
      void task?.destroy();
    };
  }, [blob]);
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let active = true,
      task: RenderTask | undefined;
    setRendering(true);
    setText("");
    setError("");
    void (async () => {
      const current = await pdf.getPage(page);
      if (!active || !canvas.current) return;
      const viewport = current.getViewport({ scale: 1.5 * zoom }),
        target = canvas.current,
        context = target.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      target.width = Math.ceil(viewport.width);
      target.height = Math.ceil(viewport.height);
      task = current.render({
        canvas: target,
        canvasContext: context,
        viewport,
      });
      const [, content] = await Promise.all([
        task.promise,
        current.getTextContent(),
      ]);
      if (active) {
        setText(
          content.items
            .flatMap((item) => ("str" in item ? [item.str] : []))
            .join(" "),
        );
        setRendering(false);
      }
    })().catch(() => {
      if (active) {
        setRendering(false);
        setError(
          "This page could not be rendered. Download the PDF to review it.",
        );
      }
    });
    return () => {
      active = false;
      task?.cancel();
    };
  }, [pdf, page, zoom]);
  return (
    <div className={styles.pdfReader}>
      <nav className={styles.pdfToolbar} aria-label="PDF pages">
        <button
          disabled={!pdf || page <= 1}
          onClick={() => setPage((n) => n - 1)}
        >
          ← Previous
        </button>
        <span>
          Page {page} of {pdf?.numPages ?? "…"}
        </span>
        <button
          disabled={!pdf || page >= pdf.numPages}
          onClick={() => setPage((n) => n + 1)}
        >
          Next →
        </button>
        <label>
          Zoom
          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          >
            <option value={1}>Fit width</option>
            <option value={1.25}>125%</option>
            <option value={1.5}>150%</option>
          </select>
        </label>
      </nav>
      {error && (
        <p className={styles.pdfNotice} role="alert">
          {error}
        </p>
      )}
      {!pdf && !error && (
        <p className={styles.pdfNotice} role="status">
          Loading quotation pages…
        </p>
      )}
      <div className={styles.pdfPageScroll} aria-busy={rendering}>
        <figure
          className={styles.pdfPageFigure}
          style={{ width: `${zoom * 100}%` }}
        >
          {pdf && (
            <canvas
              ref={canvas}
              role="img"
              aria-label={`Quotation page ${page} of ${pdf.numPages}`}
              style={{ opacity: rendering ? 0.4 : 1 }}
            />
          )}
        </figure>
        {text && (
          <details className={styles.pdfAccessibleText}>
            <summary>Read page {page} text</summary>
            <p>{text}</p>
          </details>
        )}
      </div>
    </div>
  );
}
