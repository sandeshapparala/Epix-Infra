"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  Download,
  FolderOpen,
  Plus,
  RefreshCw,
  Save,
  ShoppingBag,
  FileText,
  Trash2,
  X,
} from "lucide-react";
import {
  activeSlots,
  remainingRequirements,
  requirements,
} from "@/lib/theater/quote";
import { SLOT_LABELS, rupees, type Slot } from "@/lib/theater/types";
import type { TheaterSales } from "./useTheaterSales";
import { api } from "@/lib/theater/client";
import { ModelSignIn } from "./TheaterSession";
import CatalogDialog, { ProductImage, priceLabel } from "./CatalogDialog";
import styles from "./sales.module.css";
import MatchingSeriesDialog from "./MatchingSeriesDialog";
import QuotationPreview from "./QuotationPreview";
import { formatLength, type LengthUnit } from "@/lib/theater/measurements";

export function EquipmentSlot({
  studio,
  slot,
}: {
  studio: TheaterSales;
  slot: Exclude<Slot, "extra">;
}) {
  const s = studio.equipment.slots[slot];
  const p = studio.products.find((p) => p.id === s?.productId);
  const qty = remainingRequirements(studio.state, studio.products)[slot] || 1;
  if (!studio.member) return <ModelSignIn />;
  return (
    <div className={styles.equipmentRow}>
      <button
        aria-label={`Choose ${SLOT_LABELS[slot].toLowerCase()}`}
        onClick={() => studio.setSlot(slot)}
        disabled={!studio.products.length}
      >
        {p ? <ProductImage product={p} small /> : <ShoppingBag size={20} />}
        <span>
          <small>
            {SLOT_LABELS[slot]}
            {[
              "front",
              "center",
              "surround",
              "rear",
              "height",
              "subwoofer",
            ].includes(slot)
              ? ` · ${qty} speakers`
              : ""}
          </small>
          <strong>{p ? `${p.brand} ${p.model}` : "Choose a model"}</strong>
          {p && (
            <em>
              {priceLabel(p)}
              {s?.finish ? ` · ${s.finish}` : ""}
            </em>
          )}
        </span>
        <ChevronRight size={16} />
      </button>
      {p && (
        <button
          className={styles.removeEquipment}
          onClick={() => studio.remove(slot)}
          aria-label={`Remove ${SLOT_LABELS[slot]}`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
export function SoundEquipment({ studio }: { studio: TheaterSales }) {
  const [matching, setMatching] = useState(false);
  const front = studio.products.find(
    (p) => p.id === studio.equipment.slots.front?.productId,
  );
  const slots = activeSlots(studio.state, studio.products).filter(
    (s) => s !== "projector" && s !== "extra",
  ) as Exclude<Slot, "extra">[];
  if (!studio.member) return <ModelSignIn />;
  return (
    <section className={styles.equipmentSection}>
      <div className={styles.equipmentHeading}>
        <strong>Select your equipment</strong>
        <span>{studio.products.length} catalog entries</span>
      </div>
      <fieldset className={styles.mode}>
        <legend>Build your system</legend>
        <button
          aria-pressed={studio.equipment.mode === "components"}
          onClick={() =>
            studio.setEquipment((e) => ({ ...e, mode: "components" }))
          }
        >
          Individual components
        </button>
        <button
          aria-pressed={studio.equipment.mode === "package"}
          onClick={() =>
            studio.setEquipment((e) => ({ ...e, mode: "package" }))
          }
        >
          Packages & upgrades
        </button>
      </fieldset>
      {slots.map((s) => (
        <EquipmentSlot key={s} slot={s} studio={studio} />
      ))}
      {front && studio.equipment.mode === "components" && (
        <button className={styles.textButton} onClick={() => setMatching(true)}>
          Build a matching {front.brand} system
        </button>
      )}
      {matching && front && (
        <MatchingSeriesDialog
          studio={studio}
          front={front}
          onClose={() => setMatching(false)}
        />
      )}
      <button
        className={styles.textButton}
        disabled={!studio.products.length}
        onClick={() => studio.setSlot("extra")}
      >
        <Plus size={16} /> Add accessories or other equipment
      </button>
      <p className={styles.muted}>
        Speaker quantities follow your layout. Sets and pairs are billed once,
        with pack quantities calculated automatically.
      </p>
    </section>
  );
}

function ProjectsDialog({ studio }: { studio: TheaterSales }) {
  const [projects, setProjects] = useState<
      { id: string; name: string; version: number; updatedAt: string }[]
    >([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ projects: typeof projects }>("/api/theater/projects")
      .then((r) => setProjects(r.projects))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <Dialog.Root
      open
      onOpenChange={(o) => {
        if (!o) studio.setProjectsOpen(false);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.projectDialog}>
          <div className={styles.dialogHeader}>
            <div>
              <Dialog.Title>Saved cinema projects</Dialog.Title>
              <Dialog.Description>
                Open a room, equipment selection and customer quotation.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className={styles.iconButton}
              aria-label="Close projects"
            >
              <X />
            </Dialog.Close>
          </div>
          <div className={styles.projectList}>
            {loading ? (
              <p>Loading projects…</p>
            ) : error ? (
              <p role="alert">{error}</p>
            ) : projects.length ? (
              projects.map((p) => (
                <button
                  key={p.id}
                  disabled={studio.busy}
                  onClick={() => studio.openProject(p.id)}
                >
                  <FolderOpen />
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      Version {p.version} ·{" "}
                      {new Date(p.updatedAt).toLocaleDateString("en-IN")}
                    </small>
                  </span>
                  <ChevronRight />
                </button>
              ))
            ) : (
              <div className={styles.empty}>
                <FolderOpen />
                <p>Save your first project from the quotation panel.</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function QuotationDock({ studio }: { studio: TheaterSales }) {
  if (!studio.member) return null;
  const q = studio.calculation;
  return <section className={styles.quotationDock} aria-label="Live quotation">
    <details>
      <summary>
        <ShoppingBag size={18} />
        <span><strong>Quotation</strong><small>{q.complete ? "Estimated total" : "Known subtotal"}</small></span>
        <b>{rupees(q.totalPaise)}</b><ChevronRight className={styles.dockChevron} size={17} />
      </summary>
      <div className={styles.dockContent}>
        <p>{q.lines.length} line items{q.missing.length ? ` · ${q.missing.length} selections remaining` : ""}{q.pending ? ` · ${q.pending} prices need confirmation` : ""}</p>
        {studio.customer.name && <strong className={styles.dockCustomer}>{studio.customer.project || studio.customer.name}</strong>}
        <div className={styles.dockActions}>
          <button className={styles.secondary} onClick={() => studio.setProjectsOpen(true)}><FolderOpen size={16} /> Projects</button>
          <button className={styles.primary} onClick={() => studio.setReview(true)}>Review quotation <ArrowUpRight size={16} /></button>
        </div>
      </div>
    </details>
    {studio.catalogError && <div className={styles.dockError} role="alert">{studio.catalogError}<button onClick={studio.refresh}><RefreshCw size={14} /> Retry catalog</button></div>}
    <div className={styles.dockStatus} role="status">{studio.message}</div>
  </section>;
}

export default function SalesWorkspace({
  studio,
  capture,
  units,
}: {
  studio: TheaterSales;
  capture: () => string;
  units: LengthUnit;
}) {
  const q = studio.calculation;
  const [tab, setTab] = useState<"equipment" | "customer" | "scope">(
    "equipment",
  );
  const [pdfPreview, setPdfPreview] = useState<{
    id: string;
    number: string;
  } | null>(null);
  if (!studio.member) return null;
  return (
    <>
      {pdfPreview && (
        <QuotationPreview {...pdfPreview} onClose={() => setPdfPreview(null)} />
      )}
      {studio.slot && (
        <CatalogDialog
          key={studio.slot}
          slot={studio.slot}
          products={studio.products}
          state={studio.state}
          onApply={studio.select}
          onClose={() => studio.setSlot(null)}
        />
      )}
      {studio.projectsOpen && <ProjectsDialog studio={studio} />}
      <Dialog.Root open={studio.review} onOpenChange={studio.setReview}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content
            className={styles.review}
            aria-describedby="quote-description"
          >
            <header className={styles.dialogHeader}>
              <div>
                <span className={styles.eyebrow}>FROM ROOM TO REALITY</span>
                <Dialog.Title>Your cinema quotation</Dialog.Title>
                <Dialog.Description id="quote-description">
                  Review equipment, add project work and prepare a customer PDF.
                </Dialog.Description>
              </div>
              <Dialog.Close
                className={styles.iconButton}
                aria-label="Close quotation"
              >
                <X />
              </Dialog.Close>
            </header>
            <div className={styles.reviewLayout}>
              <div className={styles.reviewMain}>
                <nav
                  className={styles.reviewTabs}
                  aria-label="Quotation sections"
                >
                  {(
                    [
                      ["equipment", "Equipment"],
                      ["customer", "Customer"],
                      ["scope", "Scope & terms"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      aria-current={tab === key ? "page" : undefined}
                      onClick={() => setTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
                {tab === "equipment" && (
                  <>
                    <div className={styles.reviewHeading}>
                      <h3>Equipment schedule</h3>
                      <button
                        className={styles.textButton}
                        onClick={() => studio.setSlot("extra")}
                      >
                        <Plus size={15} /> Add equipment
                      </button>
                    </div>
                    {q.lines.length === 0 ? (
                      <div className={styles.empty}>
                        <ShoppingBag />
                        <h3>Start choosing your equipment</h3>
                        <p>
                          Select a projector in Screen and your system in Sound.
                        </p>
                      </div>
                    ) : (
                      <div className={styles.quoteLines}>
                        {q.lines.map((l) => {
                          const product = studio.products.find(
                            (p) =>
                              p.id === (l.productId ?? l.key.split("|")[0]),
                          );
                          return (
                            <article key={l.key}>
                              {product ? (
                                <ProductImage product={product} small />
                              ) : (
                                <div className={styles.workImage}>
                                  <FileText size={24} />
                                  <small>Project work</small>
                                </div>
                              )}
                              <div>
                                <strong>
                                  {l.model ? `${l.brand} ${l.model}` : l.label}
                                </strong>
                                <p>
                                  {l.label}
                                  {l.finish ? ` · ${l.finish}` : ""}
                                </p>
                                {product && (
                                  <details className={styles.lineDetails}>
                                    <summary>
                                      Model features & description
                                    </summary>
                                    <p>{product.description}</p>
                                  </details>
                                )}
                                <small>
                                  {l.quantity} {l.unit}
                                  {l.quantity !== 1 ? "s" : ""}
                                  {l.spare
                                    ? ` · ${l.spare} spare physical unit`
                                    : ""}{" "}
                                  ·{" "}
                                  {l.price.amountPaise === null
                                    ? "Price pending"
                                    : rupees(l.price.amountPaise) +
                                      " / " +
                                      l.unit}{" "}
                                  · {l.price.taxBasis} tax
                                </small>
                                {l.pending.length > 0 && (
                                  <span className={styles.badgeWarning}>
                                    Confirm {l.pending.join(", ")}
                                  </span>
                                )}
                              </div>
                              <strong>
                                {l.totalPaise === null
                                  ? "Pending"
                                  : rupees(l.totalPaise)}
                              </strong>
                            </article>
                          );
                        })}
                      </div>
                    )}
                    {studio.equipment.extras.length > 0 && (
                      <div className={styles.extras}>
                        <h4>Extra equipment quantities</h4>
                        {studio.equipment.extras.map((s, index) => (
                          <div key={index}>
                            <span>
                              {
                                studio.products.find(
                                  (p) => p.id === s.productId,
                                )?.model
                              }
                            </span>
                            <input
                              aria-label={`Quantity for extra item ${index + 1}`}
                              type="number"
                              min="1"
                              max="100"
                              value={s.quantity}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                if (Number.isInteger(n) && n > 0 && n <= 100)
                                  studio.setEquipment((eq) => ({
                                    ...eq,
                                    extras: eq.extras.map((x, i) =>
                                      i === index ? { ...x, quantity: n } : x,
                                    ),
                                  }));
                              }}
                            />
                            <button
                              className={styles.iconButton}
                              aria-label="Remove extra equipment"
                              onClick={() =>
                                studio.setEquipment((eq) => ({
                                  ...eq,
                                  extras: eq.extras.filter(
                                    (_, i) => i !== index,
                                  ),
                                }))
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.missing.length > 0 && (
                      <div className={styles.warning}>
                        <strong>Complete your selection</strong>
                        <p>{q.missing.join(" · ")}</p>
                      </div>
                    )}
                    {q.issues.length > 0 && (
                      <div className={styles.reviewIssues}>
                        <h4>Installation review</h4>
                        {q.issues.map((i, index) => (
                          <p
                            key={index}
                            className={
                              i.level === "error"
                                ? styles.error
                                : styles.warning
                            }
                          >
                            {i.text}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {tab === "customer" && (
                  <div className={styles.form}>
                    <h3>Prepared for</h3>
                    <div className={styles.formGrid}>
                      {(
                        [
                          ["name", "Customer name"],
                          ["project", "Project / cinema name"],
                          ["phone", "Phone"],
                          ["email", "Email"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key}>
                          {label}
                          {key === "name" ? " *" : ""}
                          <input
                            maxLength={key === "email" ? 160 : 120}
                            type={key === "email" ? "email" : "text"}
                            value={studio.customer[key]}
                            onChange={(e) =>
                              studio.setCustomer((c) => ({
                                ...c,
                                [key]: e.target.value,
                              }))
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <label>
                      Project address
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={studio.customer.address}
                        onChange={(e) =>
                          studio.setCustomer((c) => ({
                            ...c,
                            address: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <button
                      className={styles.textButton}
                      onClick={studio.newProject}
                    >
                      <Plus size={16} /> Start a new project using this room
                    </button>
                  </div>
                )}
                {tab === "scope" && (
                  <div className={styles.form}>
                    <h3>Installation and project work</h3>
                    <p className={styles.muted}>
                      Add screens, seating, cable runs, mounting, acoustics and
                      calibration using your project rates. Rates below exclude
                      GST.
                    </p>
                    <label>
                      Administrator-approved project work
                      <select
                        aria-label="Add approved project work"
                        value=""
                        onChange={(e) => {
                          const rate = studio.rates.find(
                            (r) => r.id === e.target.value,
                          );
                          if (rate)
                            studio.setServices((lines) => [
                              ...lines,
                              {
                                id: crypto.randomUUID(),
                                rateId: rate.id,
                                category: rate.category,
                                description: rate.description,
                                quantity: 1,
                                amountPaise: rate.amountPaise,
                                gstRate: rate.gstRate,
                              },
                            ]);
                        }}
                      >
                        <option value="">Choose a rate…</option>
                        {studio.rates
                          .filter((r) => r.active)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.description} · {rupees(r.amountPaise)} /{" "}
                              {r.unit}
                            </option>
                          ))}
                      </select>
                    </label>
                    {!studio.rates.some((r) => r.active) && (
                      <p className={styles.muted}>
                        Ask your admin to add screen, installation or other
                        project-work rates from Team & rates.
                      </p>
                    )}
                    {studio.services.map((s, i) => (
                      <div className={styles.serviceLine} key={s.id}>
                        <label>
                          Category
                          <select
                            disabled={studio.member?.role !== "admin"}
                            value={s.category}
                            onChange={(e) =>
                              studio.setServices((a) =>
                                a.map((x, n) =>
                                  n === i
                                    ? {
                                        ...x,
                                        category: e.target
                                          .value as typeof s.category,
                                      }
                                    : x,
                                ),
                              )
                            }
                          >
                            {[
                              "installation",
                              "display",
                              "screen",
                              "seating",
                              "cabling",
                              "acoustics",
                              "other",
                            ].map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Description
                          <input
                            value={s.description}
                            maxLength={200}
                            onChange={(e) =>
                              studio.setServices((a) =>
                                a.map((x, n) =>
                                  n === i
                                    ? { ...x, description: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          Qty
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={s.quantity}
                            onChange={(e) =>
                              studio.setServices((a) =>
                                a.map((x, n) =>
                                  n === i
                                    ? {
                                        ...x,
                                        quantity: Math.max(
                                          0.01,
                                          Number(e.target.value),
                                        ),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          Rate ₹
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={studio.member?.role !== "admin"}
                            value={s.amountPaise / 100}
                            onChange={(e) =>
                              studio.setServices((a) =>
                                a.map((x, n) =>
                                  n === i
                                    ? {
                                        ...x,
                                        amountPaise: Math.max(
                                          0,
                                          Math.round(
                                            Number(e.target.value) * 100,
                                          ),
                                        ),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          GST %
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={studio.member?.role !== "admin"}
                            value={s.gstRate}
                            onChange={(e) =>
                              studio.setServices((a) =>
                                a.map((x, n) =>
                                  n === i
                                    ? {
                                        ...x,
                                        gstRate: Math.max(
                                          0,
                                          Math.min(100, Number(e.target.value)),
                                        ),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </label>
                        <button
                          className={styles.iconButton}
                          aria-label="Remove project work"
                          onClick={() =>
                            studio.setServices((a) =>
                              a.filter((_, n) => n !== i),
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {studio.member?.role === "admin" && (
                      <button
                        className={styles.secondary}
                        onClick={() =>
                          studio.setServices((a) => [
                            ...a,
                            {
                              id: crypto.randomUUID(),
                              category: "installation",
                              description: "Installation & calibration",
                              quantity: 1,
                              amountPaise: 0,
                              gstRate: 18,
                            },
                          ])
                        }
                      >
                        <Plus size={16} /> Add project work
                      </button>
                    )}
                    <div className={styles.formGrid}>
                      <label>
                        Quotation valid for (days)
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={studio.validityDays}
                          onChange={(e) =>
                            studio.setValidity(
                              Math.max(
                                1,
                                Math.min(365, Number(e.target.value)),
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        Discount on pre-tax amount (%) · limit{" "}
                        {studio.maxDiscount}%
                        <input
                          type="number"
                          min="0"
                          max={studio.maxDiscount}
                          step="0.1"
                          value={studio.discountPercent}
                          onChange={(e) =>
                            studio.setDiscount(
                              Math.max(
                                0,
                                Math.min(
                                  studio.maxDiscount,
                                  Number(e.target.value),
                                ),
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                    <label>
                      Scope and payment terms
                      <textarea
                        rows={4}
                        maxLength={4000}
                        placeholder="Enter Epix-approved installation scope and payment terms"
                        value={studio.terms}
                        onChange={(e) => studio.setTerms(e.target.value)}
                      />
                    </label>
                    <label>
                      Exclusions
                      <textarea
                        rows={3}
                        maxLength={4000}
                        placeholder="Specify civil work, electrical work or other exclusions"
                        value={studio.exclusions}
                        onChange={(e) => studio.setExclusions(e.target.value)}
                      />
                    </label>
                  </div>
                )}
              </div>
              <aside className={styles.quoteSummary}>
                <span className={styles.eyebrow}>PROJECT SUMMARY</span>
                <h3>{studio.customer.project || "Your home cinema"}</h3>
                <p>
                  {formatLength(studio.state.design.width, units)} ×{" "}
                  {formatLength(studio.state.design.depth, units)} ·{" "}
                  {studio.state.design.audio}
                </p>
                <dl>
                  <div>
                    <dt>Known pre-tax subtotal</dt>
                    <dd>{rupees(q.subtotalPaise)}</dd>
                  </div>
                  <div>
                    <dt>Discount</dt>
                    <dd>−{rupees(q.discountPaise)}</dd>
                  </div>
                  <div>
                    <dt>GST</dt>
                    <dd>{rupees(q.taxPaise)}</dd>
                  </div>
                </dl>
                <div className={styles.grandTotal}>
                  <span>
                    {q.complete ? "Estimated total" : "Known subtotal"}
                  </span>
                  <strong>{rupees(q.totalPaise)}</strong>
                </div>
                <div className={styles.readiness}>
                  <strong>
                    {q.complete
                      ? "Ready for customer review"
                      : "Before you share"}
                  </strong>
                  <span>
                    {studio.customer.name.trim()
                      ? "Customer details added"
                      : "Add your customer’s name"}
                  </span>
                  <span>
                    {q.missing.length
                      ? `${q.missing.length} equipment selections to complete`
                      : "Equipment selection complete"}
                  </span>
                  <span>
                    {q.pending
                      ? `${q.pending} prices need confirmation`
                      : "Selected prices checked"}
                  </span>
                  <small>
                    {studio.project
                      ? `Project saved · version ${studio.project.version}`
                      : "Save this room as a client project"}
                  </small>
                </div>
                <p className={styles.summaryNote}>
                  {q.complete
                    ? "Equipment pricing is complete. Confirm installation details before ordering."
                    : "This estimate is incomplete. Unpriced items and missing equipment are excluded from the known subtotal."}
                </p>
                <button
                  disabled={studio.busy || !studio.products.length}
                  className={styles.secondary}
                  onClick={() => studio.save(capture())}
                >
                  <Save size={16} /> {studio.busy ? "Saving…" : "Save project"}
                </button>
                <button
                  disabled={
                    studio.busy ||
                    !studio.customer.name.trim() ||
                    !studio.products.length
                  }
                  className={styles.primary}
                  onClick={() => studio.generate(capture())}
                >
                  {studio.busy
                    ? "Preparing…"
                    : q.complete
                      ? "Generate quotation"
                      : "Generate budget estimate"}
                  <ArrowUpRight size={16} />
                </button>
                {!studio.customer.name.trim() && (
                  <button
                    className={styles.textButton}
                    onClick={() => setTab("customer")}
                  >
                    Add customer name to generate PDF
                  </button>
                )}
                {studio.quote && (
                  <button
                    className={styles.download}
                    onClick={() =>
                      setPdfPreview({
                        id: studio.quote!.id,
                        number: studio.quote!.number,
                      })
                    }
                  >
                    <FileText size={17} /> Preview & download PDF
                  </button>
                )}
                {studio.history.length > 0 && (
                  <details className={styles.quoteHistory}>
                    <summary>
                      Saved quotation revisions ({studio.history.length})
                    </summary>
                    {studio.history.map((q) => (
                      <button
                        key={q.id}
                        onClick={() =>
                          setPdfPreview({ id: q.id, number: q.number })
                        }
                      >
                        {q.number}
                        <small>
                          {new Date(q.createdAt).toLocaleDateString("en-IN")}
                        </small>
                      </button>
                    ))}
                  </details>
                )}
                <button className={styles.textButton} onClick={studio.refresh}>
                  <RefreshCw size={14} /> Refresh catalog prices
                </button>
                {studio.member?.role === "admin" && (
                  <Link
                    className={styles.textButton}
                    href="/home-theater-builder/pricing"
                    target="_blank"
                  >
                    Update catalog pricing ↗
                  </Link>
                )}
                <div className={styles.inlineStatus} role="status">
                  {studio.message}
                </div>
              </aside>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
