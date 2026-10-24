"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, FileText, X } from "lucide-react";
import { quotePdfBlob } from "@/lib/theater/client";
import QuotationPages from "./QuotationPages";
import styles from "./sales.module.css";

export default function QuotationPreview({
  id,
  number,
  onClose,
}: {
  id: string;
  number: string;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(""),
    [error, setError] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  useEffect(() => {
    let active = true,
      objectUrl = "";
    setUrl("");
    setError("");
    setBlob(null);
    quotePdfBlob(id)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setBlob(blob);
        setUrl(objectUrl);
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={`${styles.overlay} ${styles.pdfOverlay}`} />
        <Dialog.Content
          className={styles.pdfDialog}
          aria-describedby="pdf-preview-description"
        >
          <header className={styles.dialogHeader}>
            <div>
              <span className={styles.eyebrow}>CUSTOMER DOCUMENT</span>
              <Dialog.Title>Preview your quotation</Dialog.Title>
              <Dialog.Description id="pdf-preview-description">
                {number} · Saved prices, model photos and project details.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className={styles.iconButton}
              aria-label="Close PDF preview"
            >
              <X />
            </Dialog.Close>
          </header>
          <div className={styles.pdfBody}>
            {error ? (
              <div className={styles.empty} role="alert">
                <FileText />
                <h3>Preview could not be prepared</h3>
                <p>{error}</p>
                <button onClick={onClose}>Return to quotation</button>
              </div>
            ) : blob ? (
              <QuotationPages blob={blob} />
            ) : (
              <div className={styles.empty} role="status">
                <FileText />
                <h3>Preparing your illustrated quotation…</h3>
                <p>Loading the saved revision and its product images.</p>
              </div>
            )}
          </div>
          <footer className={styles.pdfFooter}>
            <p>
              Review the model schedule and project terms before sharing with
              your client.
            </p>
            {url && (
              <a
                href={url}
                download={`${number}.pdf`}
                className={styles.primary}
              >
                <Download size={16} /> Download PDF
              </a>
            )}
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
