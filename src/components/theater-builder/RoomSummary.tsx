"use client";
import type { TheaterDesign } from "./design";
import { roomDimensions } from "@/lib/theater/dimensions";
import { formatLength } from "@/lib/theater/measurements";
import { ChevronDown } from "lucide-react";
import styles from "./sales.module.css";

export default function RoomSummary({
  design,
  preview,
}: {
  design: TheaterDesign;
  preview: string;
}) {
  return (
    <details className={styles.roomSummary}>
      <summary>
        <span>
          <strong>Room preview &amp; dimensions</strong>
          <small>
            {formatLength(design.width)} &times; {formatLength(design.depth)} &times;{" "}
            {formatLength(design.height)}
          </small>
        </span>
        <ChevronDown size={18} />
      </summary>
      {preview ? (
        <img
          src={preview}
          alt="Selected theatre layout with room width, depth, height and row gaps labelled in feet and inches"
          width={1200}
          height={759}
        />
      ) : (
        <p className={styles.muted}>
          The measured 3D image will appear when the room preview is ready.
        </p>
      )}
      <table>
        <caption>Selected dimensions · feet & inches</caption>
        <thead>
          <tr>
            <th scope="col">Dimension</th>
            <th scope="col">Feet & inches</th>
          </tr>
        </thead>
        <tbody>
          {roomDimensions(design).map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Minimum clear gap between recliner footprints: 1 ft 6 in. These
        dimensions are included in the quotation PDF.
      </p>
    </details>
  );
}
