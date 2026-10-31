"use client";
import { useState } from "react";
import { FileText } from "lucide-react";
import type { QuoteLine } from "@/lib/theater/types";
import { rupees } from "@/lib/theater/types";
import { lineDiscountLimit } from "@/lib/theater/discounts";
import {
  isAcousticsAddon,
  acousticsAddon,
  ACOUSTICS_DESCRIPTION,
  ACOUSTICS_DEFAULT_PAISE,
} from "@/lib/theater/sound-services";
import type { TheaterSales } from "./useTheaterSales";
import { ProductImage } from "./CatalogDialog";
import styles from "./sales.module.css";
export function SoundAddOn({ studio }: { studio: TheaterSales }) {
  const selected = studio.services.some(isAcousticsAddon);
  return (
    <section className={styles.soundAddOn} aria-label="Sound system add-ons">
      <label>
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) =>
            studio.setServices((lines) =>
              e.target.checked
                ? lines.some(isAcousticsAddon)
                  ? lines
                  : [...lines, acousticsAddon()]
                : lines.filter((s) => !isAcousticsAddon(s)),
            )
          }
        />
        <span>
          <strong>{ACOUSTICS_DESCRIPTION}</strong>
          <small>Starting at {rupees(ACOUSTICS_DEFAULT_PAISE)} per room</small>
        </span>
      </label>
      <p>Set the custom price and item discount in the quotation preview.</p>
    </section>
  );
}

export function QuoteDiscountToolbar({ studio }: { studio: TheaterSales }) {
  const [value, setValue] = useState(String(studio.discountPercent));
  return (
    <div className={styles.discountToolbar}>
      <div>
        <strong>Item discounts</strong>
        <p>
          Adjust each item below. Rotel is capped at 10%; your employee limit
          also applies.
        </p>
      </div>
      <label>
        Starting discount (%)
        <input
          type="number"
          min="0"
          max={studio.maxDiscount}
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <button
        className={styles.secondary}
        onClick={() => {
          const n = Math.max(
            0,
            Math.min(studio.maxDiscount, Number(value) || 0),
          );
          setValue(String(n));
          studio.setDiscount(n);
          studio.setLineDiscounts({});
        }}
      >
        Apply to all
      </button>
    </div>
  );
}
export default function QuoteLineEditor({
  line,
  studio,
}: {
  line: QuoteLine;
  studio: TheaterSales;
}) {
  const p = studio.products.find((p) => p.id === line.productId),
    limit = lineDiscountLimit(line.brand, studio.maxDiscount);
  const service = studio.services.find((s) => `service:${s.id}` === line.key);
  const customPrice = service && isAcousticsAddon(service);
  const title = line.model ? `${line.brand} ${line.model}` : line.label;
  return (
    <article>
      {p ? (
        <ProductImage product={p} small />
      ) : (
        <div className={styles.workImage}>
          <FileText size={24} />
          <small>Project work</small>
        </div>
      )}
      <div>
        <strong>{title}</strong>
        <p>
          {line.label}
          {line.finish ? ` · ${line.finish}` : ""}
        </p>
        {p && (
          <details className={styles.lineDetails}>
            <summary>Model features & description</summary>
            <p>{p.description}</p>
          </details>
        )}
        <small>
          {line.quantity} {line.unit}
          {line.quantity !== 1 ? "s" : ""} ·{" "}
          {line.price.amountPaise === null
            ? "Price pending"
            : rupees(line.price.amountPaise) + " / " + line.unit}
          {line.spare ? ` · ${line.spare} spare physical units` : ""}
        </small>
        {line.pending.length > 0 && (
          <span className={styles.badgeWarning}>
            Confirm {line.pending.join(", ")}
          </span>
        )}
      </div>
      <div className={styles.linePricing}>
        {customPrice && (
          <label>
            Custom price (₹)
            <input
              aria-label={`Price for ${title}`}
              type="number"
              min="0"
              max="100000000"
              step="0.01"
              value={service.amountPaise / 100}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 0)
                  studio.setServices((lines) =>
                    lines.map((s) =>
                      s.id === service.id
                        ? {
                            ...s,
                            amountPaise: Math.min(
                              10_000_000_000,
                              Math.round(n * 100),
                            ),
                          }
                        : s,
                    ),
                  );
              }}
            />
          </label>
        )}
        <label>
          Discount (%)
          <input
            aria-label={`Discount for ${title}`}
            type="number"
            min="0"
            max={limit}
            step="0.1"
            value={line.discountPercent ?? 0}
            onChange={(e) =>
              studio.setLineDiscount(
                line.key,
                Math.max(0, Math.min(limit, Number(e.target.value) || 0)),
              )
            }
          />
        </label>
        <small>
          Maximum {limit}% · save {rupees(line.discountPaise)}
        </small>
        <strong>
          {line.totalPaise === null ? "Pending" : rupees(line.totalPaise)}
        </strong>
      </div>
    </article>
  );
}
