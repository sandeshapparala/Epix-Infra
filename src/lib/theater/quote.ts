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
import { audioLabel, speakerLayout, type CustomAudio } from "./speaker-layout";
import { appliedDiscount } from "./discounts";

export function requirements(
  audio: string | { audio: string; customAudio?: CustomAudio },
): Partial<Record<Slot, number>> {
  const layout = speakerLayout(audio);
  return {
    front: 2,
    center: 1,
    surround: 2,
    rear: layout.bed >= 7 ? 2 : 0,
    wide: layout.bed === 9 ? 2 : 0,
    height: layout.height,
    subwoofer: layout.subs,
    receiver: 1,
    amplifier: 0,
    projector: 1,
    tv: 1,
    package: 1,
  };
}
export function remainingRequirements(
  state: Pick<SalesProject, "design" | "equipment">,
  products: Product[],
): Partial<Record<Slot, number>> {
  const req = requirements(state.design);
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
    state.design.display === "projector" ? ["projector"] : ["tv"];
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
        "wide",
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
  const layout = speakerLayout(d),
    channels = layout.channels;
  if (
    slot !== "extra" &&
    !p.roles.includes(slot) &&
    !(slot === "wide" && p.roles.includes("front"))
  )
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
        text: `${p.model} processes ${p.specs.processedChannels} channels; ${audioLabel(d)} requires ${channels}.`,
        slot,
      });
    if (
      p.specs.amplifiedChannels !== undefined &&
      p.specs.amplifiedChannels < channels &&
      (p.specs.processedChannels ?? 0) >= channels
    )
      issues.push({
        level: "warning",
        text: `${p.model} needs ${channels - p.specs.amplifiedChannels} additional amplifier channels for ${audioLabel(d)}.`,
        slot,
      });
    if (layout.height > 0 && p.specs.atmos === false)
      issues.push({
        level: "error",
        text: `Physical Atmos support is not established for ${p.model}.`,
        slot,
      });
  }
  if (
    slot === "receiver" &&
    (layout.bed === 9 || layout.height === 6 || layout.subs > 2)
  )
    issues.push({
      level: "warning",
      slot,
      text: "Confirm the receiver's front-wide, overhead and subwoofer output assignments for this custom channel configuration; channel count alone does not establish format support.",
    });
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
  if (
    slot === "tv" &&
    p.specs.diagonalInches !== undefined &&
    (d.diagonal !== p.specs.diagonalInches || d.aspect !== "16:9")
  )
    issues.push({
      level: "error",
      slot,
      text: `${p.model} is a fixed ${p.specs.diagonalInches}-inch 16:9 display. Choose a different model to change its physical screen size.`,
    });
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
  if (price.unit === "unknown" || price.packSize === null)
    pending.push("Selling unit");
  const gross =
    price.amountPaise === null
      ? null
      : Math.round(price.amountPaise * line.quantity);
  const subtotal = gross;
  const discounted =
    subtotal === null ? 0 : Math.round((subtotal * discount) / 100);
  const net = subtotal === null ? null : subtotal - discounted;
  // Catalog and service prices are final inclusive amounts. No tax is added.
  const tax = 0;
  return {
    ...line,
    pending,
    subtotalPaise: subtotal,
    discountPaise: discounted,
    discountPercent: discount,
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
  // Legacy projects can still quote a custom display service instead of a catalog TV.
  if (
    state.design.display === "tv" &&
    !state.equipment.slots.tv &&
    state.services.some((s) => s.category === "display" && s.amountPaise > 0)
  ) {
    const i = missing.indexOf(SLOT_LABELS.tv);
    if (i >= 0) missing.splice(i, 1);
  }
  if (
    state.design.display === "tv" &&
    state.equipment.slots.tv &&
    state.services.some((s) => s.category === "display" && s.amountPaise > 0)
  )
    issues.push({
      level: "warning",
      slot: "tv",
      text: "A catalog display and a separate display scope line are both priced. Review the scope to avoid charging twice for the same display.",
    });
  if (
    state.design.display === "projector" &&
    !state.services.some((s) => s.category === "screen" && s.amountPaise > 0)
  )
    missing.push("Projection screen (add a Screen line under Scope)");
  const receiver = byId.get(state.equipment.slots.receiver?.productId ?? "");
  const amp = byId.get(state.equipment.slots.amplifier?.productId ?? "");
  const channels = speakerLayout(state.design).channels;
  if (
    activeSlots(state, products).includes("receiver") &&
    receiver &&
    (receiver.specs.amplifiedChannels ?? channels) < channels &&
    (receiver.specs.processedChannels ?? 0) >= channels
  ) {
    if (!amp) missing.push("Additional power amplifier");
    else if (
      amp.specs.powerAmpDirect === true &&
      amp.specs.externalAmpChannels !== undefined &&
      amp.specs.externalAmpChannels <
        channels - (receiver.specs.amplifiedChannels ?? 0)
    )
      issues.push({
        level: "error",
        slot: "amplifier",
        text: `${amp.model} provides ${amp.specs.externalAmpChannels} power-amplifier channels; ${receiver.model} needs ${channels - (receiver.specs.amplifiedChannels ?? 0)} external channels for ${audioLabel(state.design)}.`,
      });
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
        appliedDiscount(state, key, g.p.brand),
      ),
    );
  }
  for (const s of state.services)
    lines.push(
      pricedLine(
        {
          key: `service:${s.id}`,
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
            taxBasis: "inclusive",
            gstRate: 0,
            unit: "unit",
            packSize: 1,
            revision: 0,
          },
        },
        appliedDiscount(state, `service:${s.id}`, "Epix Infra"),
      ),
    );
  const pending = lines.filter((l) => l.pending.length).length;
  return {
    pricingMode: "inclusive",
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
export function applyTV(
  design: SalesProject["design"],
  product: Product,
): SalesProject["design"] {
  return {
    ...design,
    display: "tv",
    aspect: "16:9",
    ...(product.specs.diagonalInches
      ? { diagonal: product.specs.diagonalInches }
      : {}),
  };
}
export function designIssues(state: SalesProject) {
  return calculateDesign(state.design).warnings;
}
