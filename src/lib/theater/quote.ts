import {
  screenSize,
  calculateDesign,
} from "../../components/theater-builder/design";
import {
  SLOT_LABELS,
  type Equipment,
  type Product,
  type Slot,
  type SalesProject,
  type QuoteCalculation,
  type QuoteLine,
  type ReviewIssue,
} from "./types";
import { visualDesign } from "./visual-design";
import { formatLength } from "./measurements";

export function requirements(audio: string): Partial<Record<Slot, number>> {
  return {
    front: 2,
    center: 1,
    surround: 2,
    rear: audio === "7.2.4" ? 2 : 0,
    height: audio === "7.2.4" ? 4 : audio === "5.1.2" ? 2 : 0,
    subwoofer: audio === "7.2.4" ? 2 : 1,
    receiver: 1,
    amplifier: 0,
    projector: 1,
    package: 1,
  };
}
export function remainingRequirements(
  state: Pick<SalesProject, "design" | "equipment">,
  products: Product[],
): Partial<Record<Slot, number>> {
  const req = requirements(state.design.audio);
  if (state.equipment.mode === "package") {
    const p = products.find(
      (p) => p.id === state.equipment.slots.package?.productId,
    );
    for (const [role, number] of Object.entries(p?.specs.packageContents ?? {}))
      req[role as Slot] = Math.max(0, (req[role as Slot] ?? 0) - (number ?? 0));
  }
  return req;
}
export function activeSlots(
  state: Pick<SalesProject, "design" | "equipment">,
  products: Product[] = [],
): Slot[] {
  const slots: Slot[] =
    state.design.display === "projector" ? ["projector"] : [];
  const packaged = state.equipment.mode === "package";
  if (packaged) slots.push("package");
  if (packaged && !state.equipment.slots.package) return [...slots, "receiver"];
  const req = remainingRequirements(state, products);
  return [
    ...slots,
    ...(
      [
        "front",
        "center",
        "surround",
        "rear",
        "height",
        "subwoofer",
        "receiver",
      ] as Slot[]
    ).filter((k) => req[k]),
    ...(!packaged || req.receiver ? ["amplifier" as Slot] : []),
  ];
}
export function compatibility(
  p: Product,
  slot: Slot,
  state: Pick<SalesProject, "design" | "equipment">,
): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  const d = state.design;
  const channels = d.audio === "7.2.4" ? 11 : d.audio === "5.1.2" ? 7 : 5;
  if (slot !== "extra" && !p.roles.includes(slot))
    issues.push({
      level: "error",
      text: `${p.model} is not catalogued for ${SLOT_LABELS[slot].toLowerCase()}.`,
      slot,
    });
  if (slot === "receiver") {
    if (p.specs.processedChannels === undefined)
      issues.push({
        level: "warning",
        text: `Confirm ${p.model}'s channel processing capacity.`,
        slot,
      });
    else if (p.specs.processedChannels < channels)
      issues.push({
        level: "error",
        text: `${p.model} processes ${p.specs.processedChannels} channels; ${d.audio} requires ${channels}.`,
        slot,
      });
    if (
      p.specs.amplifiedChannels !== undefined &&
      p.specs.amplifiedChannels < channels &&
      (p.specs.processedChannels ?? 0) >= channels
    )
      issues.push({
        level: "warning",
        text: `${p.model} needs ${channels - p.specs.amplifiedChannels} additional amplifier channels for ${d.audio}.`,
        slot,
      });
    if (d.audio !== "5.1" && p.specs.atmos === false)
      issues.push({
        level: "error",
        text: `Physical Atmos support is not established for ${p.model}.`,
        slot,
      });
  }
  if (slot === "projector") {
    if (p.specs.throwMin !== undefined && p.specs.throwMax !== undefined) {
      const w = screenSize(d.diagonal, d.aspect).width;
      if (w * p.specs.throwMin > d.depth - 0.22)
        issues.push({
          level: "error",
          text: `${p.model} needs at least ${formatLength(w * p.specs.throwMin)} (${(w * p.specs.throwMin).toFixed(2)} m) lens distance for this image width.`,
          slot,
        });
    } else
      issues.push({
        level: "warning",
        text: `${p.model}: lens throw specifications need verification.`,
        slot,
      });
    if (d.aspect === "2.4:1")
      issues.push({
        level: "warning",
        text: "Scope-screen fit uses image width; verify zoom, native image height and lens setup.",
        slot,
      });
  }
  if (slot === "package" && !p.specs.packageContents)
    issues.push({
      level: "error",
      text: "Package contents need confirmation before this can be quoted as a complete system.",
      slot,
    });
  if (
    slot === "package" &&
    p.specs.packageReceiverChannels &&
    p.specs.packageReceiverChannels < channels
  )
    issues.push({
      level: "error",
      text: `The included receiver in ${p.model} supports ${p.specs.packageReceiverChannels} amplified channels; this layout needs ${channels}. Choose a compatible package or individual components.`,
      slot,
    });
  if (slot === "height" && p.category === "height")
    issues.push({
      level: "warning",
      text: "This is a height/elevation module. The 3D view marks overhead channels; confirm mounting method and ceiling suitability.",
      slot,
    });
  if (["in-wall", "ceiling"].includes(p.category))
    issues.push({
      level: "warning",
      text: p.specs.mountingDepth
        ? `Allow at least ${Math.round(p.specs.mountingDepth * 1000)} mm mounting depth for ${p.model}; confirm wall or ceiling clearance on site.`
        : `Confirm the mounting depth and cutout clearance for ${p.model} on site.`,
      slot,
    });
  return issues;
}

function pricedLine(
  line: Omit<
    QuoteLine,
    | "subtotalPaise"
    | "discountPaise"
    | "netPaise"
    | "taxPaise"
    | "totalPaise"
    | "pending"
  >,
  discount: number,
): QuoteLine {
  const price = line.price;
  const pending: string[] = [];
  if (price.amountPaise === null) pending.push("Price");
  if (price.taxBasis === "unknown") pending.push("Tax inclusion");
  if (price.gstRate === null) pending.push("GST rate");
  if (price.unit === "unknown" || price.packSize === null)
    pending.push("Selling unit");
  const gross =
    price.amountPaise === null
      ? null
      : Math.round(price.amountPaise * line.quantity);
  const subtotal =
    gross === null || price.taxBasis === "unknown" || price.gstRate === null
      ? null
      : price.taxBasis === "inclusive"
        ? Math.round((gross * 100) / (100 + price.gstRate))
        : gross;
  const discounted =
    subtotal === null ? 0 : Math.round((subtotal * discount) / 100);
  const net = subtotal === null ? null : subtotal - discounted;
  // Reconcile inclusive prices to their exact quoted paise. Reapplying GST to
  // an already rounded taxable base can otherwise add a paise to a pair.
  const tax =
    net === null || price.gstRate === null
      ? null
      : price.taxBasis === "inclusive" && gross !== null
        ? Math.round((gross * (100 - discount)) / 100) - net
        : Math.round((net * price.gstRate) / 100);
  return {
    ...line,
    pending,
    subtotalPaise: subtotal,
    discountPaise: discounted,
    netPaise: net,
    taxPaise: tax,
    totalPaise:
      net === null || tax === null || pending.length ? null : net + tax,
  };
}

export function calculateQuote(
  state: SalesProject,
  products: Product[],
): QuoteCalculation {
  const byId = new Map(products.map((p) => [p.id, p]));
  const req = remainingRequirements(state, products);
  const issues: ReviewIssue[] = [];
  const missing: string[] = [];
  for (const text of calculateDesign(
    visualDesign(state.design, state.equipment, products),
  ).warnings)
    issues.push({
      level: /outside|overlap|exceed|do not allow/i.test(text)
        ? "error"
        : "warning",
      text,
    });
  const groups = new Map<
    string,
    { p: Product; finish: string; required: number; labels: string[] }
  >();
  function add(
    id: string,
    finish: string,
    required: number,
    label: string,
    slot: Slot,
  ) {
    const p = byId.get(id);
    if (!p) {
      missing.push(`${label}: product no longer in catalog`);
      return;
    }
    if (p.finishes.length && !p.finishes.includes(finish))
      issues.push({
        level: "warning",
        text: `Choose a listed finish for ${p.model}.`,
        slot,
      });
    issues.push(...compatibility(p, slot, state));
    const key = id + "|" + finish;
    const group = groups.get(key);
    if (group) {
      group.required += required;
      group.labels.push(label);
    } else groups.set(key, { p, finish, required, labels: [label] });
  }
  for (const slot of activeSlots(state, products)) {
    const selection = state.equipment.slots[slot as keyof Equipment["slots"]];
    if (selection)
      add(
        selection.productId,
        selection.finish,
        req[slot] || 1,
        SLOT_LABELS[slot],
        slot,
      );
    else if (slot !== "amplifier") missing.push(SLOT_LABELS[slot]);
  }
  for (const x of state.equipment.extras)
    add(x.productId, x.finish, x.quantity, SLOT_LABELS.extra, "extra");
  if (
    state.design.display === "tv" &&
    !state.services.some((s) => s.category === "display" && s.amountPaise > 0)
  )
    missing.push("TV price (add a Display line under Scope)");
  if (
    state.design.display === "projector" &&
    !state.services.some((s) => s.category === "screen" && s.amountPaise > 0)
  )
    missing.push("Projection screen (add a Screen line under Scope)");
  const receiver = byId.get(state.equipment.slots.receiver?.productId ?? "");
  const amp = byId.get(state.equipment.slots.amplifier?.productId ?? "");
  const channels =
    state.design.audio === "7.2.4"
      ? 11
      : state.design.audio === "5.1.2"
        ? 7
        : 5;
  if (
    activeSlots(state, products).includes("receiver") &&
    receiver &&
    (receiver.specs.amplifiedChannels ?? channels) < channels &&
    (receiver.specs.processedChannels ?? 0) >= channels
  ) {
    if (!amp) missing.push("Additional power amplifier");
    else
      issues.push({
        level: "warning",
        text: `Verify ${amp.model}'s power-amp input and channel assignment with ${receiver.model}; a stereo or multiroom amplifier is not automatically a cinema power amplifier.`,
        slot: "amplifier",
      });
  }
  const lines: QuoteLine[] = [];
  for (const [key, g] of groups) {
    const size = g.p.price.packSize ?? 1;
    const quantity = Math.ceil(g.required / size);
    lines.push(
      pricedLine(
        {
          key,
          productId: g.p.id,
          label: g.labels.join(" + "),
          brand: g.p.brand,
          model: g.p.model,
          finish: g.finish,
          required: g.required,
          quantity,
          unit: g.p.price.unit,
          spare: quantity * size - g.required,
          price: g.p.price,
        },
        state.discountPercent,
      ),
    );
  }
  for (const s of state.services)
    lines.push(
      pricedLine(
        {
          key: s.id,
          label: s.description,
          model: "",
          brand: "Epix Infra",
          finish: "",
          required: s.quantity,
          quantity: s.quantity,
          unit: "unit",
          spare: 0,
          price: {
            amountPaise: s.amountPaise,
            taxBasis: "exclusive",
            gstRate: s.gstRate,
            unit: "unit",
            packSize: 1,
            revision: 0,
          },
        },
        state.discountPercent,
      ),
    );
  const pending = lines.filter((l) => l.pending.length).length;
  return {
    lines,
    issues,
    missing,
    subtotalPaise: lines.reduce(
      (a, l) => a + (l.totalPaise === null ? 0 : (l.subtotalPaise ?? 0)),
      0,
    ),
    discountPaise: lines.reduce(
      (a, l) => a + (l.totalPaise === null ? 0 : l.discountPaise),
      0,
    ),
    taxPaise: lines.reduce(
      (a, l) => a + (l.totalPaise === null ? 0 : (l.taxPaise ?? 0)),
      0,
    ),
    totalPaise: lines.reduce((a, l) => a + (l.totalPaise ?? 0), 0),
    pending,
    complete:
      pending === 0 &&
      missing.length === 0 &&
      !issues.some((x) => x.level === "error"),
  };
}
export function applyProjector(
  design: SalesProject["design"],
  product: Product,
): SalesProject["design"] {
  const positions = { ...design.positions };
  delete positions.projector;
  return {
    ...design,
    positions,
    ...(product.specs.lumens ? { lumens: product.specs.lumens } : {}),
    ...(product.specs.throwMin && product.specs.throwMax
      ? { throwMin: product.specs.throwMin, throwMax: product.specs.throwMax }
      : {}),
  };
}
export function designIssues(state: SalesProject) {
  return calculateDesign(state.design).warnings;
}
