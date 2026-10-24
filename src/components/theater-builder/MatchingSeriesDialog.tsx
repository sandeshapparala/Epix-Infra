"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";
import { activeSlots, requirements } from "@/lib/theater/quote";
import { SLOT_LABELS, type Product, type Slot } from "@/lib/theater/types";
import type { TheaterSales } from "./useTheaterSales";
import { priceLabel } from "./CatalogDialog";
import styles from "./sales.module.css";

export default function MatchingSeriesDialog({
  studio,
  front,
  onClose,
}: {
  studio: TheaterSales;
  front: Product;
  onClose: () => void;
}) {
  const roles = activeSlots(studio.state, studio.products).filter((s) =>
    ["center", "surround", "rear", "height", "subwoofer"].includes(s),
  ) as Exclude<Slot, "extra">[];
  const choices = Object.fromEntries(
    roles.map((role) => [
      role,
      studio.products
        .filter(
          (p) =>
            p.brand === front.brand &&
            p.series === front.series &&
            p.roles.includes(role),
        )
        .sort(
          (a, b) =>
            (a.price.amountPaise ?? Infinity) -
            (b.price.amountPaise ?? Infinity),
        ),
    ]),
  );
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      roles.map((role) => [
        role,
        studio.equipment.slots[role]?.productId ?? choices[role]?.[0]?.id ?? "",
      ]),
    ),
  );
  return (
    <Dialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.priceDialog}>
          <header className={styles.dialogHeader}>
            <div>
              <Dialog.Title>Build a matching system</Dialog.Title>
              <Dialog.Description>
                {front.brand} · {front.series} · {studio.state.design.audio}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className={styles.iconButton}
              aria-label="Close matching series"
            >
              <X />
            </Dialog.Close>
          </header>
          <div className={styles.form}>
            <p className={styles.muted}>
              Review these choices before applying. Suggestions use the same
              brand and series, ordered by list price. Your existing selections
              are retained until you replace them.
            </p>
            {roles.map((role) => (
              <label key={role}>
                {SLOT_LABELS[role]} ·{" "}
                {requirements(studio.state.design.audio)[role]} speakers
                <select
                  value={draft[role]}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [role]: e.target.value }))
                  }
                >
                  <option value="">Keep unselected</option>
                  {studio.equipment.slots[role] &&
                    !choices[role].some(
                      (p) => p.id === studio.equipment.slots[role]?.productId,
                    ) && (
                      <option value={studio.equipment.slots[role]?.productId}>
                        Keep current model
                      </option>
                    )}
                  {choices[role].map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.model} · {priceLabel(p)}
                    </option>
                  ))}
                </select>
                {!choices[role].length && (
                  <small>
                    No matching series option in these lists. Choose another
                    brand from the main library.
                  </small>
                )}
              </label>
            ))}
            <button
              className={styles.primary}
              onClick={() => {
                studio.setEquipment((current) => {
                  const slots = { ...current.slots };
                  for (const role of roles) {
                    const p = studio.products.find((p) => p.id === draft[role]);
                    if (p)
                      slots[role] = {
                        productId: p.id,
                        finish:
                          slots[role]?.productId === p.id
                            ? slots[role]!.finish
                            : p.finishes.includes(
                                  studio.equipment.slots.front?.finish ?? "",
                                )
                              ? studio.equipment.slots.front!.finish
                              : (p.finishes[0] ?? ""),
                      };
                    else delete slots[role];
                  }
                  return { ...current, slots };
                });
                onClose();
                studio.setMessage(
                  "Matching system selections applied. Review the quotation for installation requirements.",
                );
              }}
            >
              <Check size={16} /> Apply matching system
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
