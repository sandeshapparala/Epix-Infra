"use client";
import { useId, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronRight, TriangleAlert, X } from "lucide-react";
import styles from "./builder.module.css";

export default function LayoutChecks({
  warnings,
  blockedChange,
}: {
  warnings: string[];
  blockedChange?: string;
}) {
  const [preview, setPreview] = useState(false);
  const [open, setOpen] = useState(false);
  const previewId = useId();
  const issues = [
    ...new Set([blockedChange, ...warnings].filter((s): s is string => !!s)),
  ];
  const title = issues.length
    ? `${issues.length} layout ${issues.length === 1 ? "check" : "checks"} to review`
    : "Layout fit checks passed";
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setPreview(false);
      }}
    >
      <div
        className={styles.layoutChecks}
        data-warning={issues.length > 0}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" && !open) setPreview(true);
        }}
        onPointerLeave={() => setPreview(false)}
      >
        <Dialog.Trigger asChild>
          <button
            className={styles.layoutChecksTrigger}
            aria-label={title}
            aria-describedby={preview ? previewId : undefined}
            onClick={() => setPreview(false)}
            onFocus={(event) => {
              if (event.currentTarget.matches(":focus-visible") && !open)
                setPreview(true);
            }}
            onBlur={() => setPreview(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setPreview(false);
                event.stopPropagation();
              }
            }}
          >
            {issues.length ? <TriangleAlert size={18} /> : <Check size={18} />}
            <span role="status">{title}</span>
            <small>Review details</small>
            <ChevronRight size={16} />
          </button>
        </Dialog.Trigger>
        {preview && !open && (
          <div
            id={previewId}
            role="tooltip"
            className={styles.layoutChecksPreview}
          >
            <strong>
              {issues.length ? "Before you continue" : "Room fit reviewed"}
            </strong>
            {issues.length ? (
              <ul>
                {issues.slice(0, 3).map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p>
                The room passes the concept fit checks. Final seating and
                equipment clearances need a site review.
              </p>
            )}
            <small>
              {issues.length > 3 ? `+${issues.length - 3} more checks. ` : ""}
              Click or press Enter for the full review.
            </small>
          </div>
        )}
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.layoutChecksOverlay} />
        <Dialog.Content
          className={styles.layoutChecksDialog}
          onCloseAutoFocus={() => setPreview(false)}
        >
          <header>
            <div>
              <Dialog.Title>Layout checks</Dialog.Title>
              <Dialog.Description>
                {issues.length
                  ? "Review these checks before sharing the design."
                  : "Your current room passes the concept fit checks."}
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Close layout checks">
              <X size={20} />
            </Dialog.Close>
          </header>
          <div className={styles.layoutChecksBody}>
            {blockedChange && (
              <p className={styles.layoutBlocked}>
                Your last change was stopped because it would not fit. The
                previous layout is still shown.
              </p>
            )}
            {issues.length ? (
              <ol>
                {issues.map((issue, index) => (
                  <li key={issue}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{issue}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p>
                Seating order, row gaps, room boundaries, screen fit and
                equipment clearances have been checked.
              </p>
            )}
            <p className={styles.layoutChecksNote}>
              Keep at least 1 ft 6 in of clear space between chair footprints.
              The preview uses representative recliners; final recline space and
              installation need the selected product specifications.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
