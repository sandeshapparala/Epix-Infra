"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Save,
  Search,
  Upload,
  X,
} from "lucide-react";
import type { Price, Product } from "@/lib/theater/types";
import { rupees } from "@/lib/theater/types";
import { api } from "@/lib/theater/client";
import {
  filterPricingProducts,
  PRICING_TYPES,
  pricingCategoryLabel,
  pricingType,
} from "@/lib/theater/pricing-filters";
import { ProductImage } from "./CatalogDialog";
import styles from "./sales.module.css";

function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
type Change = { productId: string; expectedRevision: number; price: Price };
export default function PricingAdmin() {
  const [products, setProducts] = useState<Product[]>([]),
    [search, setSearch] = useState(""),
    [brand, setBrand] = useState(""),
    [type, setType] = useState(""),
    [category, setCategory] = useState(""),
    [pending, setPending] = useState(false),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Product | null>(null),
    [draft, setDraft] = useState<Price | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [imported, setImported] = useState<Change[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkTax, setBulkTax] = useState<Price["taxBasis"]>("inclusive"),
    [bulkGst, setBulkGst] = useState("18"),
    [bulkUnit, setBulkUnit] = useState<Price["unit"] | "">("");
  async function refresh() {
    setLoading(true);
    try {
      const r = await api<{ products: Product[] }>("/api/theater/catalog");
      setProducts(r.products);
      setSelected([]);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  const filtered = useMemo(
    () =>
      filterPricingProducts(products, {
        search,
        brand,
        type,
        category,
        pending,
      }),
    [products, search, brand, type, category, pending],
  );
  const categories = useMemo(
    () =>
      [
        ...new Set(
          products
            .filter((p) => !type || pricingType(p.category) === type)
            .map((p) => p.category),
        ),
      ].sort((a, b) =>
        pricingCategoryLabel(a).localeCompare(pricingCategoryLabel(b)),
      ),
    [products, type],
  );
  const activeFilters = !!(search || brand || type || category || pending);
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 30) - 1),
  );
  const visible = filtered.slice(currentPage * 30, currentPage * 30 + 30);
  useEffect(() => {
    setPage(0);
    // A new filtered view starts a fresh bulk selection; hidden rows cannot be edited accidentally.
    setSelected([]);
  }, [search, brand, type, category, pending]);
  function clearFilters() {
    setSearch("");
    setBrand("");
    setType("");
    setCategory("");
    setPending(false);
  }
  async function submit(changes: Change[]) {
    setBusy(true);
    try {
      await api("/api/theater/prices", {
        method: "PUT",
        body: JSON.stringify({
          changes: changes.map((c) => ({
            ...c,
            price: {
              amountPaise: c.price.amountPaise,
              taxBasis: c.price.taxBasis,
              gstRate: c.price.gstRate,
              unit: c.price.unit,
              packSize: c.price.packSize,
            },
          })),
        }),
      });
      await refresh();
      setEditing(null);
      setImported(null);
      setMessage(
        `${changes.length} prices updated. Previously issued quotations keep their original prices.`,
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function csvExport() {
    const header = [
      "product_id",
      "brand",
      "model",
      "amount_inr",
      "tax_basis",
      "gst_rate",
      "selling_unit",
      "pack_size",
      "revision",
    ];
    const rows = [
      header,
      ...filtered.map((p) => [
        p.id,
        p.brand,
        p.model,
        p.price.amountPaise === null ? "" : String(p.price.amountPaise / 100),
        p.price.taxBasis,
        p.price.gstRate === null ? "" : String(p.price.gstRate),
        p.price.unit,
        String(p.price.packSize ?? ""),
        String(p.price.revision),
      ]),
    ];
    const text = rows
      .map((row) =>
        row.map((c) => '"' + String(c).replaceAll('"', '""') + '"').join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "Epix-Catalog-Pricing.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function csvImport(file: File) {
    try {
      if (file.size > 500000)
        throw new Error("CSV must be smaller than 500 KB");
      const rows = csvRows((await file.text()).replace(/^\uFEFF/, ""));
      const header = rows.shift() ?? [];
      const columns = [
        "product_id",
        "amount_inr",
        "tax_basis",
        "gst_rate",
        "selling_unit",
        "revision",
      ].map((h) => header.indexOf(h));
      if (columns.some((i) => i < 0))
        throw new Error("Use the exported Epix pricing CSV format");
      const seen = new Set<string>();
      const changes: Change[] = [];
      for (const row of rows) {
        const [id, amount, tax, gst, unit, revision] = columns.map(
          (i) => row[i] ?? "",
        );
        const p = products.find((p) => p.id === id);
        if (!p) throw new Error(`Unknown product: ${id}`);
        if (seen.has(id)) throw new Error(`Duplicate product: ${id}`);
        seen.add(id);
        const price: Price = {
          amountPaise:
            amount.trim() === "" ? null : Math.round(Number(amount) * 100),
          taxBasis: tax as Price["taxBasis"],
          gstRate: gst.trim() === "" ? null : Number(gst),
          unit: unit as Price["unit"],
          packSize:
            unit === "pair"
              ? 2
              : unit === "unknown"
                ? null
                : unit === "set"
                  ? header.includes("pack_size")
                    ? Number(row[header.indexOf("pack_size")])
                    : (p.price.packSize ?? 1)
                  : 1,
          revision: Number(revision),
        };
        if (
          !["inclusive", "exclusive", "unknown"].includes(tax) ||
          !["unit", "pair", "set", "unknown"].includes(unit) ||
          (price.amountPaise !== null &&
            (!Number.isFinite(price.amountPaise) || price.amountPaise <= 0)) ||
          (price.gstRate !== null &&
            (!Number.isFinite(price.gstRate) ||
              price.gstRate < 0 ||
              price.gstRate > 100)) ||
          !Number.isInteger(price.revision)
        )
          throw new Error(`Invalid pricing fields for ${id}`);
        if (price.revision !== p.price.revision)
          throw new Error(
            `Stale revision for ${id}. Export a fresh CSV before importing.`,
          );
        if (
          ["amountPaise", "taxBasis", "gstRate", "unit", "packSize"].some(
            (k) => price[k as keyof Price] !== p.price[k as keyof Price],
          )
        )
          changes.push({
            productId: id,
            expectedRevision: price.revision,
            price,
          });
      }
      if (!changes.length) {
        setMessage("No changed prices found in this CSV.");
        return;
      }
      if (changes.length > 100)
        throw new Error("Import at most 100 changed products at a time");
      setImported(changes);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <main className={styles.pricingPage}>
      <header className={styles.pricingHeader}>
        <Link href="/home-theater-builder">
          <ArrowLeft size={17} /> Back to design studio
        </Link>
        <span>EPIX INFRA</span>
      </header>
      <div className={styles.pricingIntro}>
        <div>
          <p className={styles.eyebrow}>CATALOG ADMINISTRATION</p>
          <h1>Keep every quote current.</h1>
          <p>
            Update selling prices, tax treatment and billing units. All models
            are ordered for the project.
          </p>
        </div>
        <div className={styles.barActions}>
          <button onClick={csvExport} className={styles.secondary}>
            <Download size={16} /> Export CSV
          </button>
          <label className={styles.secondary}>
            <Upload size={16} /> Import CSV
            <input
              className={styles.hiddenInput}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                if (e.target.files?.[0]) void csvImport(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={refresh}
            className={styles.iconButton}
            aria-label="Refresh pricing"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      <section
        className={styles.pricingFilterPanel}
        aria-label="Filter pricing catalog"
      >
        <div className={styles.pricingFilters}>
          <label className={styles.search}>
            Search catalog
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Search pricing catalog"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Model, series, category or product ID"
            />
          </label>
          <label>
            Company / brand
            <select value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">All companies</option>
              {[...new Set(products.map((p) => p.brand))].sort().map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label>
            Equipment type
            <select
              value={type}
              onChange={(e) => {
                const nextType = e.target.value;
                setType(nextType);
                if (category && nextType && pricingType(category) !== nextType)
                  setCategory("");
              }}
            >
              <option value="">All types</option>
              {PRICING_TYPES.filter((t) =>
                products.some((p) => pricingType(p.category) === t.value),
              ).map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {pricingCategoryLabel(c)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.pricingFilterSummary}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={pending}
              onChange={(e) => setPending(e.target.checked)}
            />{" "}
            Needs price confirmation
          </label>
          <span role="status" aria-live="polite">
            {loading
              ? "Loading catalog…"
              : `${filtered.length} of ${products.length} models`}
          </span>
          <button
            className={styles.secondary}
            disabled={!activeFilters}
            onClick={clearFilters}
          >
            <X size={14} aria-hidden="true" /> Clear filters
          </button>
        </div>
        <p className={styles.pricingFilterHint}>
          Combine filters to narrow the catalog. CSV export includes matching
          models only. Changing filters clears bulk selection.
        </p>
      </section>
      <div className={styles.adminStatus} role="status">
        {message}
      </div>
      {selected.length > 0 && (
        <div className={styles.bulkPanel}>
          <strong>{selected.length} selected</strong>
          <label>
            Tax basis
            <select
              value={bulkTax}
              onChange={(e) => setBulkTax(e.target.value as Price["taxBasis"])}
            >
              <option value="inclusive">Includes GST</option>
              <option value="exclusive">GST extra</option>
              <option value="unknown">Unconfirmed</option>
            </select>
          </label>
          <label>
            GST %
            <input
              type="number"
              min="0"
              max="100"
              value={bulkGst}
              onChange={(e) => setBulkGst(e.target.value)}
            />
          </label>
          <label>
            Selling unit
            <select
              value={bulkUnit}
              onChange={(e) => setBulkUnit(e.target.value as typeof bulkUnit)}
            >
              <option value="">Keep existing</option>
              <option value="unit">Single unit</option>
              <option value="pair">Pair of two</option>
              <option value="set">Complete set</option>
            </select>
          </label>
          <button
            className={styles.primary}
            disabled={busy}
            onClick={() =>
              submit(
                products
                  .filter((p) => selected.includes(p.id))
                  .map((p) => ({
                    productId: p.id,
                    expectedRevision: p.price.revision,
                    price: {
                      ...p.price,
                      taxBasis: bulkTax,
                      gstRate: bulkGst.trim() === "" ? null : Number(bulkGst),
                      ...(bulkUnit
                        ? {
                            unit: bulkUnit,
                            packSize:
                              bulkUnit === "pair"
                                ? 2
                                : bulkUnit === "set" && p.price.unit === "set"
                                  ? p.price.packSize
                                  : 1,
                          }
                        : {}),
                    },
                  })),
              )
            }
          >
            Apply confirmed billing rules
          </button>
        </div>
      )}
      <div className={styles.pricingTable}>
        <table>
          <caption>Source prices and current selling prices</caption>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select this page"
                  checked={
                    visible.length > 0 &&
                    visible.every((p) => selected.includes(p.id))
                  }
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [
                            ...new Set([
                              ...selected,
                              ...visible.map((p) => p.id),
                            ]),
                          ].slice(0, 100)
                        : selected.filter(
                            (id) => !visible.some((p) => p.id === id),
                          ),
                    )
                  }
                />
              </th>
              <th>Product</th>
              <th>Current list price</th>
              <th>Tax</th>
              <th>Selling unit</th>
              <th>Source date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${p.model}`}
                    checked={selected.includes(p.id)}
                    disabled={
                      selected.length >= 100 && !selected.includes(p.id)
                    }
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked
                          ? [...s, p.id]
                          : s.filter((id) => id !== p.id),
                      )
                    }
                  />
                </td>
                <td>
                  <div className={styles.adminProduct}>
                    <ProductImage product={p} small />
                    <span>
                      <small>{p.brand}</small>
                      <strong>{p.model}</strong>
                      <small>{pricingCategoryLabel(p.category)}</small>
                      <em>{p.id}</em>
                    </span>
                  </div>
                </td>
                <td>
                  {p.price.amountPaise === null ? (
                    <span className={styles.badgeWarning}>
                      Price on request
                    </span>
                  ) : (
                    rupees(p.price.amountPaise)
                  )}
                </td>
                <td>
                  {p.price.taxBasis}
                  <br />
                  <small>
                    {p.price.gstRate === null
                      ? "GST to confirm"
                      : p.price.gstRate + "% GST"}
                  </small>
                </td>
                <td>{p.price.unit}</td>
                <td>
                  {p.source.effectiveDate}
                  <br />
                  <small>Page {p.source.page}</small>
                </td>
                <td>
                  <button
                    className={styles.secondary}
                    onClick={() => {
                      setEditing(p);
                      setDraft({ ...p.price });
                    }}
                  >
                    Edit price
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <div className={styles.empty} role="status">
            {loading
              ? "Loading catalog prices…"
              : "No models match these filters. Try another company or category, or clear the filters."}
            {!loading && activeFilters && (
              <button className={styles.secondary} onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
      <div className={styles.pagination}>
        <button
          disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage + 1} of{" "}
          {Math.max(1, Math.ceil(filtered.length / 30))}
        </span>
        <button
          disabled={(currentPage + 1) * 30 >= filtered.length}
          onClick={() => setPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
      <Dialog.Root
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.priceDialog}>
            <div className={styles.dialogHeader}>
              <div>
                <Dialog.Title>Update selling price</Dialog.Title>
                <Dialog.Description>
                  {editing?.brand} {editing?.model}
                </Dialog.Description>
              </div>
              <Dialog.Close
                className={styles.iconButton}
                aria-label="Close price editor"
              >
                <X />
              </Dialog.Close>
            </div>
            {draft && editing && (
              <form
                className={styles.form}
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit([
                    {
                      productId: editing.id,
                      expectedRevision: editing.price.revision,
                      price: draft,
                    },
                  ]);
                }}
              >
                <label>
                  Price per billing unit (₹)
                  <input
                    type="number"
                    min="0.01"
                    max="1000000000"
                    step="0.01"
                    value={
                      draft.amountPaise === null ? "" : draft.amountPaise / 100
                    }
                    placeholder="Leave empty for price on request"
                    onChange={(e) =>
                      setDraft((d) =>
                        d
                          ? {
                              ...d,
                              amountPaise:
                                e.target.value === ""
                                  ? null
                                  : Math.round(Number(e.target.value) * 100),
                            }
                          : d,
                      )
                    }
                  />
                </label>
                <div className={styles.formGrid}>
                  <label>
                    Tax basis
                    <select
                      value={draft.taxBasis}
                      onChange={(e) =>
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                taxBasis: e.target.value as Price["taxBasis"],
                              }
                            : d,
                        )
                      }
                    >
                      <option value="inclusive">Includes GST</option>
                      <option value="exclusive">GST extra</option>
                      <option value="unknown">Needs confirmation</option>
                    </select>
                  </label>
                  <label>
                    GST rate (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={draft.gstRate ?? ""}
                      placeholder="Unconfirmed"
                      onChange={(e) =>
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                gstRate:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              }
                            : d,
                        )
                      }
                    />
                  </label>
                </div>
                <label>
                  Selling unit
                  <select
                    value={draft.unit}
                    onChange={(e) => {
                      const unit = e.target.value as Price["unit"];
                      setDraft((d) =>
                        d
                          ? {
                              ...d,
                              unit,
                              packSize:
                                unit === "pair"
                                  ? 2
                                  : unit === "unknown"
                                    ? null
                                    : 1,
                            }
                          : d,
                      );
                    }}
                  >
                    <option value="unit">Single unit</option>
                    <option value="pair">Pair of two</option>
                    <option value="set">Complete set</option>
                    <option value="unknown">Needs confirmation</option>
                  </select>
                </label>
                {draft.unit === "set" && (
                  <label>
                    Physical units covered by one set
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={draft.packSize ?? 1}
                      onChange={(e) =>
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                packSize: Math.max(
                                  1,
                                  Math.min(
                                    100,
                                    Math.floor(Number(e.target.value)),
                                  ),
                                ),
                              }
                            : d,
                        )
                      }
                    />
                    <small>
                      For a whole theatre package use 1 system. For a
                      dual-subwoofer set use 2 subwoofers.
                    </small>
                  </label>
                )}
                <p className={styles.source}>
                  Source: {editing.source.file} · page {editing.source.page}.
                  Changes update future quotations; saved quotation snapshots
                  are preserved.
                </p>
                {editing.issues.map((i) => (
                  <p className={styles.warning} key={i}>
                    {i}
                  </p>
                ))}
                <button className={styles.primary} disabled={busy}>
                  <Save size={16} />
                  {busy ? "Saving…" : "Save price update"}
                </button>
                <p role="status">{message}</p>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={!!imported}
        onOpenChange={(o) => {
          if (!o) setImported(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.priceDialog}>
            <div className={styles.dialogHeader}>
              <div>
                <Dialog.Title>Review CSV pricing updates</Dialog.Title>
                <Dialog.Description>
                  {imported?.length} products will change together.
                </Dialog.Description>
              </div>
              <Dialog.Close
                className={styles.iconButton}
                aria-label="Close CSV preview"
              >
                <X />
              </Dialog.Close>
            </div>
            <div className={styles.importPreview}>
              {imported?.map((c) => (
                <p key={c.productId}>
                  <strong>
                    {products.find((p) => p.id === c.productId)?.model}
                  </strong>
                  <br />
                  {c.price.amountPaise === null
                    ? "Price pending"
                    : rupees(c.price.amountPaise)}{" "}
                  · {c.price.taxBasis} · {c.price.gstRate ?? "?"}% GST ·{" "}
                  {c.price.unit}
                </p>
              ))}
            </div>
            <button
              disabled={busy}
              className={styles.primary}
              onClick={() => {
                if (imported) void submit(imported);
              }}
            >
              Apply {imported?.length} updates
            </button>
            <p role="status">{message}</p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
