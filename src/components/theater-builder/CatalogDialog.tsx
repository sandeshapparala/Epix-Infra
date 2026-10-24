"use client";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  Search,
  SlidersHorizontal,
  Speaker,
  Video,
  X,
} from "lucide-react";
import { compatibility } from "@/lib/theater/quote";
import {
  SLOT_LABELS,
  rupees,
  type Product,
  type Slot,
  type SalesProject,
} from "@/lib/theater/types";
import styles from "./sales.module.css";

export function ProductImage({
  product,
  small = false,
}: {
  product: Product;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [product.image]);
  return (
    <div className={small ? styles.smallImage : styles.productImage}>
      {product.image && !failed ? (
        <Image
          src={product.image}
          alt={`${product.brand} ${product.model}`}
          width={520}
          height={420}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.representative}>
          {product.category === "projector" ? (
            <Video size={44} />
          ) : (
            <Speaker size={44} />
          )}
          <span>Product photo unavailable</span>
        </div>
      )}
    </div>
  );
}
export function priceLabel(p: Product) {
  return p.price.amountPaise === null
    ? "Price on request"
    : `${rupees(p.price.amountPaise)} / ${p.price.unit === "unknown" ? "unit to confirm" : p.price.unit}`;
}
const specNames: Record<string, string> = {
  lumens: "Light output",
  throwMin: "Minimum throw ratio",
  throwMax: "Maximum throw ratio",
  amplifiedChannels: "Amplified channels",
  processedChannels: "Processed channels",
  atmos: "Physical Atmos",
  impedanceOhms: "Nominal impedance",
  dimensions: "Dimensions (W × H × D)",
  mountingDepth: "Mounting depth",
  packageContents: "Included equipment",
  packageReceiverChannels: "Included receiver channels",
};
function specValue(key: string, value: unknown) {
  if (key === "packageContents" && value && typeof value === "object")
    return Object.entries(value)
      .map(([k, v]) => `${v} ${SLOT_LABELS[k as Slot] ?? k}`)
      .join(" · ");
  if (key === "dimensions" && Array.isArray(value))
    return value.map((v) => Math.round(Number(v) * 1000)).join(" × ") + " mm";
  if (key === "mountingDepth") return Math.round(Number(value) * 1000) + " mm";
  if (key === "lumens") return Number(value).toLocaleString("en-IN") + " lm";
  if (key === "impedanceOhms") return value + " Ω";
  if (typeof value === "boolean") return value ? "Yes" : "Not established";
  return String(value);
}
export default function CatalogDialog({
  slot,
  products,
  state,
  onApply,
  onClose,
}: {
  slot: Slot;
  products: Product[];
  state: SalesProject;
  onApply: (p: Product, finish: string) => string | void;
  onClose: () => void;
}) {
  const existing = slot === "extra" ? undefined : state.equipment.slots[slot];
  const [applyError, setApplyError] = useState("");
  const [search, setSearch] = useState(""),
    [brand, setBrand] = useState(""),
    [category, setCategory] = useState(""),
    [maxPrice, setMaxPrice] = useState(""),
    [sort, setSort] = useState("name"),
    [onlyCompatible, setOnlyCompatible] = useState(false);
  const [selected, setSelected] = useState(existing?.productId ?? ""),
    [finish, setFinish] = useState(existing?.finish ?? ""),
    [details, setDetails] = useState(""),
    [compare, setCompare] = useState<string[]>([]),
    [showCompare, setShowCompare] = useState(false);
  const [series, setSeries] = useState(""),
    [minChannels, setMinChannels] = useState(""),
    [minLumens, setMinLumens] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);
  const resultsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setVisibleCount(30);
    resultsRef.current?.scrollTo({ top: 0 });
  }, [
    deferredSearch,
    brand,
    series,
    category,
    maxPrice,
    sort,
    onlyCompatible,
    minChannels,
    minLumens,
  ]);
  const eligible = useMemo(
    () => products.filter((p) => slot === "extra" || p.roles.includes(slot)),
    [products, slot],
  );
  const filtered = useMemo(
    () =>
      eligible
        .filter(
          (p) =>
            (!deferredSearch ||
              `${p.brand} ${p.model} ${p.description}`
                .toLowerCase()
                .includes(deferredSearch.toLowerCase())) &&
            (!brand || p.brand === brand) &&
            (!series || p.series === series) &&
            (!minChannels ||
              (p.specs.processedChannels ?? 0) >= Number(minChannels)) &&
            (!minLumens || (p.specs.lumens ?? 0) >= Number(minLumens)) &&
            (!category || p.category === category) &&
            (!maxPrice ||
              (p.price.amountPaise !== null &&
                p.price.amountPaise <= Number(maxPrice) * 100)) &&
            (!onlyCompatible ||
              !compatibility(p, slot, state).some((i) => i.level === "error")),
        )
        .sort((a, b) =>
          sort === "price"
            ? (a.price.amountPaise ?? Infinity) -
              (b.price.amountPaise ?? Infinity)
            : `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`),
        ),
    [
      eligible,
      deferredSearch,
      brand,
      series,
      category,
      maxPrice,
      sort,
      onlyCompatible,
      minChannels,
      minLumens,
      slot,
      state,
    ],
  );
  const chosen = products.find((p) => p.id === selected);
  const detailed = products.find((p) => p.id === details);
  const compared = products.filter((p) => compare.includes(p.id));
  function pick(p: Product) {
    setSelected(p.id);
    setFinish(p.finishes[0] ?? "");
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.catalog}
          aria-describedby="catalog-description"
        >
          <header className={styles.dialogHeader}>
            <div>
              <span className={styles.eyebrow}>EPIX EQUIPMENT LIBRARY</span>
              <Dialog.Title>
                Choose {SLOT_LABELS[slot].toLowerCase()}
              </Dialog.Title>
              <Dialog.Description id="catalog-description">
                {eligible.length} options · Products are ordered for your
                project
              </Dialog.Description>
            </div>
            <Dialog.Close
              className={styles.iconButton}
              aria-label="Close product library"
            >
              <X />
            </Dialog.Close>
          </header>
          <div className={styles.catalogLayout}>
            <aside className={styles.filters} data-expanded={showFilters}>
              <button
                className={styles.mobileFilters}
                aria-expanded={showFilters}
                onClick={() => setShowFilters((v) => !v)}
              >
                <SlidersHorizontal size={16} />
                {showFilters ? "Close" : "Filters"}
              </button>
              <div className={styles.filterHeading}>
                <SlidersHorizontal size={16} />
                <strong>Refine your selection</strong>
              </div>
              <label className={styles.search}>
                <Search size={16} />
                <input
                  placeholder="Search model or feature"
                  aria-label="Search products"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <label>
                Brand
                <select
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    setSeries("");
                  }}
                >
                  <option value="">All brands</option>
                  {[...new Set(eligible.map((p) => p.brand))]
                    .sort()
                    .map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                </select>
              </label>
              <label>
                Series
                <select
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                >
                  <option value="">All series</option>
                  {[
                    ...new Set(
                      eligible
                        .filter((p) => !brand || p.brand === brand)
                        .map((p) => p.series),
                    ),
                  ]
                    .sort()
                    .map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                </select>
              </label>
              {slot === "receiver" && (
                <label>
                  Minimum processed channels
                  <select
                    value={minChannels}
                    onChange={(e) => setMinChannels(e.target.value)}
                  >
                    <option value="">Any channel count</option>
                    {[5, 7, 9, 11, 13, 15].map((n) => (
                      <option key={n} value={n}>
                        {n} channels or more
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {slot === "projector" && (
                <label>
                  Minimum light output (lm)
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={minLumens}
                    onChange={(e) => setMinLumens(e.target.value)}
                    placeholder="Any light output"
                  />
                </label>
              )}
              <label>
                Product type
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All types</option>
                  {[...new Set(eligible.map((p) => p.category))]
                    .sort()
                    .map((c) => (
                      <option key={c} value={c}>
                        {c.replaceAll("-", " ")}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Maximum list price (₹)
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={maxPrice}
                  placeholder="Any budget"
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </label>
              <label>
                Sort by
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="name">Brand & model</option>
                  <option value="price">List price: low to high</option>
                </select>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={onlyCompatible}
                  onChange={(e) => setOnlyCompatible(e.target.checked)}
                />
                Hide incompatible options
              </label>
              <p className={styles.muted}>
                List prices retain their source tax basis. Final quantities and
                tax are calculated in your quotation.
              </p>
              <button
                className={styles.textButton}
                onClick={() => {
                  setSearch("");
                  setBrand("");
                  setCategory("");
                  setSeries("");
                  setMinChannels("");
                  setMinLumens("");
                  setMaxPrice("");
                  setOnlyCompatible(false);
                }}
              >
                Clear filters
              </button>
            </aside>
            <div className={styles.catalogResults} ref={resultsRef}>
              {detailed ? (
                <div className={styles.details}>
                  <button
                    className={styles.textButton}
                    onClick={() => setDetails("")}
                  >
                    <ArrowLeft size={16} /> Back to results
                  </button>
                  <div className={styles.detailsTop}>
                    <ProductImage product={detailed} />
                    <div>
                      <span className={styles.eyebrow}>{detailed.brand}</span>
                      <h3>{detailed.model}</h3>
                      <strong>{priceLabel(detailed)}</strong>
                      <p>{detailed.category.replaceAll("-", " ")}</p>
                      <button
                        className={styles.primary}
                        onClick={() => {
                          pick(detailed);
                          setDetails("");
                        }}
                      >
                        Select this model
                      </button>
                    </div>
                  </div>
                  <h4>Features and specifications</h4>
                  <p className={styles.fullDescription}>
                    {detailed.description}
                  </p>
                  <div className={styles.specGrid}>
                    {Object.entries(detailed.specs)
                      .filter(([k]) => k !== "sourceUrl")
                      .map(([k, v]) => (
                        <div key={k}>
                          <span>
                            {specNames[k] ?? k.replace(/([A-Z])/g, " $1")}
                          </span>
                          <strong>{specValue(k, v)}</strong>
                        </div>
                      ))}
                  </div>
                  {detailed.specs.sourceUrl && (
                    <a
                      className={styles.textButton}
                      href={detailed.specs.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Manufacturer specifications ↗
                    </a>
                  )}
                  <p className={styles.source}>
                    Price source: {detailed.source.file} · page{" "}
                    {detailed.source.page} · effective{" "}
                    {detailed.source.effectiveDate}
                  </p>
                  {detailed.issues.map((i) => (
                    <p className={styles.warning} key={i}>
                      {i}
                    </p>
                  ))}
                </div>
              ) : showCompare ? (
                <div className={styles.details}>
                  <button
                    className={styles.textButton}
                    onClick={() => setShowCompare(false)}
                  >
                    <ArrowLeft size={16} /> Back to results
                  </button>
                  <h3>Compare selected models</h3>
                  <div className={styles.comparison}>
                    {compared.map((p) => (
                      <article key={p.id}>
                        <ProductImage product={p} />
                        <h4>
                          {p.brand} {p.model}
                        </h4>
                        <strong>{priceLabel(p)}</strong>
                        <p>{p.category}</p>
                        <p>
                          {p.price.taxBasis} tax ·{" "}
                          {p.price.gstRate === null
                            ? "GST to confirm"
                            : p.price.gstRate + "% GST"}
                        </p>
                        {Object.entries(p.specs)
                          .filter(([k]) => k !== "sourceUrl")
                          .map(([k, v]) => (
                            <p key={k}>
                              {specNames[k] ?? k.replace(/([A-Z])/g, " $1")}:{" "}
                              <strong>{specValue(k, v)}</strong>
                            </p>
                          ))}
                        <p className={styles.fullDescription}>
                          {p.description}
                        </p>
                        {compatibility(p, slot, state).map((i) => (
                          <p key={i.text} className={styles.warning}>
                            {i.text}
                          </p>
                        ))}
                        <button
                          className={styles.primary}
                          onClick={() => {
                            pick(p);
                            setShowCompare(false);
                          }}
                        >
                          Select model
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.resultsHeading}>
                    <span>{filtered.length} models</span>
                    <span>
                      {state.design.audio} · {state.design.diagonal}″ screen
                    </span>
                  </div>
                  <div className={styles.productGrid}>
                    {filtered.slice(0, visibleCount).map((p) => {
                      const errors = compatibility(p, slot, state);
                      const incompatible = errors.some(
                        (i) => i.level === "error",
                      );
                      return (
                        <article
                          className={styles.productCard}
                          data-selected={selected === p.id}
                          key={p.id}
                        >
                          <button
                            className={styles.imageButton}
                            onClick={() => setDetails(p.id)}
                            aria-label={`View ${p.brand} ${p.model} specifications`}
                          >
                            <ProductImage product={p} />
                          </button>
                          <div className={styles.cardBody}>
                            <span className={styles.brand}>
                              {p.brand}{" "}
                              <small>{p.category.replaceAll("-", " ")}</small>
                            </span>
                            <h3>{p.model}</h3>
                            <p className={styles.cardDescription}>
                              {p.description}
                            </p>
                            <strong className={styles.price}>
                              {priceLabel(p)}
                            </strong>
                            <small className={styles.tax}>
                              {p.price.taxBasis === "inclusive"
                                ? "Includes GST"
                                : p.price.taxBasis === "exclusive"
                                  ? "GST extra"
                                  : "Tax basis to confirm"}
                            </small>
                            {errors.length > 0 && (
                              <span
                                className={
                                  incompatible
                                    ? styles.badgeError
                                    : styles.badgeWarning
                                }
                              >
                                {incompatible
                                  ? "Layout mismatch"
                                  : "Check installation"}
                              </span>
                            )}
                            <div className={styles.cardActions}>
                              <button
                                className={
                                  selected === p.id
                                    ? styles.selected
                                    : styles.choose
                                }
                                onClick={() => pick(p)}
                              >
                                {selected === p.id ? (
                                  <>
                                    <Check size={15} /> Selected
                                  </>
                                ) : (
                                  "Select model"
                                )}
                              </button>
                              <button
                                className={styles.textButton}
                                onClick={() => setDetails(p.id)}
                              >
                                Details
                              </button>
                            </div>
                            <label className={styles.compareCheck}>
                              <input
                                type="checkbox"
                                checked={compare.includes(p.id)}
                                disabled={
                                  compare.length >= 3 && !compare.includes(p.id)
                                }
                                onChange={(e) =>
                                  setCompare((c) =>
                                    e.target.checked
                                      ? [...c, p.id]
                                      : c.filter((id) => id !== p.id),
                                  )
                                }
                              />{" "}
                              Compare
                            </label>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {filtered.length > visibleCount && (
                    <button
                      className={styles.secondary}
                      style={{ marginTop: 24 }}
                      onClick={() => setVisibleCount((n) => n + 30)}
                    >
                      Show more models ({filtered.length - visibleCount}{" "}
                      remaining)
                    </button>
                  )}
                  {filtered.length === 0 && (
                    <div className={styles.empty}>
                      <Search />
                      <h3>No models match these filters</h3>
                      <p>Try another brand or a wider price range.</p>
                      <button
                        onClick={() => {
                          setSearch("");
                          setBrand("");
                          setCategory("");
                          setSeries("");
                          setMinChannels("");
                          setMinLumens("");
                          setMaxPrice("");
                          setOnlyCompatible(false);
                        }}
                      >
                        Reset filters
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <footer className={styles.catalogFooter}>
            <div>
              {chosen ? (
                <>
                  <strong>
                    {chosen.brand} {chosen.model}
                  </strong>
                  <span>{priceLabel(chosen)}</span>
                </>
              ) : (
                <strong>Select a model to add to your cinema</strong>
              )}
            </div>
            {chosen && chosen.finishes.length > 0 && (
              <label>
                Finish
                <select
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                >
                  {chosen.finishes.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
            )}
            <div className={styles.footerActions}>
              {applyError && <p role="alert">{applyError}</p>}
              {compare.length > 0 && (
                <button
                  className={styles.secondary}
                  onClick={() => {
                    setDetails("");
                    setShowCompare(true);
                  }}
                >
                  Compare ({compare.length}/3)
                </button>
              )}
              <button
                className={styles.primary}
                disabled={!chosen}
                onClick={() => {
                  if (chosen) setApplyError(onApply(chosen, finish) ?? "");
                }}
              >
                Apply to design <Check size={16} />
              </button>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
