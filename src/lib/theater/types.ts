import type { TheaterDesign } from "../../components/theater-builder/design";

export type Slot =
  | "projector"
  | "front"
  | "center"
  | "surround"
  | "rear"
  | "height"
  | "subwoofer"
  | "receiver"
  | "amplifier"
  | "package"
  | "extra";
export type Price = {
  amountPaise: number | null;
  taxBasis: "inclusive" | "exclusive" | "unknown";
  gstRate: number | null;
  unit: "unit" | "pair" | "set" | "unknown";
  packSize: number | null;
  revision: number;
  updatedAt?: string;
};
export type Product = {
  id: string;
  brand: string;
  model: string;
  category: string;
  roles: Slot[];
  series: string;
  description: string;
  image: string | null;
  quoteImage?: string;
  imageSource?: string;
  finishes: string[];
  price: Price;
  issues: string[];
  source: { file: string; page: number; effectiveDate: string; sha256: string };
  specs: {
    lumens?: number;
    throwMin?: number;
    throwMax?: number;
    amplifiedChannels?: number;
    processedChannels?: number;
    atmos?: boolean;
    impedanceOhms?: number;
    sourceUrl?: string;
    externalAmpChannels?: number;
    powerAmpDirect?: boolean;
    dimensions?: [number, number, number];
    mountingDepth?: number;
    packageContents?: Partial<Record<Slot, number>>;
    packageReceiverChannels?: number;
  };
};
export type Selection = { productId: string; finish: string };
export type Equipment = {
  mode: "components" | "package";
  slots: Partial<Record<Exclude<Slot, "extra">, Selection>>;
  extras: (Selection & { quantity: number })[];
};
export type Customer = {
  name: string;
  phone: string;
  email: string;
  project: string;
  address: string;
};
export type ServiceLine = {
  rateId?: string;
  id: string;
  category:
    | "installation"
    | "display"
    | "screen"
    | "seating"
    | "cabling"
    | "acoustics"
    | "other";
  description: string;
  quantity: number;
  amountPaise: number;
  gstRate: number;
};
export type SalesProject = {
  design: TheaterDesign;
  equipment: Equipment;
  customer: Customer;
  services: ServiceLine[];
  discountPercent: number;
  validityDays: number;
  terms: string;
  exclusions: string;
  preview?: string;
};
export type QuoteLine = {
  productId?: string;
  key: string;
  label: string;
  model: string;
  brand: string;
  finish: string;
  required: number;
  quantity: number;
  unit: string;
  spare: number;
  price: Price;
  subtotalPaise: number | null;
  discountPaise: number;
  netPaise: number | null;
  taxPaise: number | null;
  totalPaise: number | null;
  pending: string[];
};
export type ReviewIssue = {
  level: "error" | "warning";
  text: string;
  slot?: Slot;
};
export type QuoteCalculation = {
  lines: QuoteLine[];
  issues: ReviewIssue[];
  missing: string[];
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
  pending: number;
  complete: boolean;
};
export type SavedProject = {
  ownerUid?: string;
  createdBy?: import("./access").Attribution;
  updatedBy?: import("./access").Attribution;
  createdAt?: string;
  previewPath?: string;
  id: string;
  version: number;
  name: string;
  updatedAt: string;
  state: SalesProject;
};
export type QuoteSnapshot = {
  templateVersion?: number;
  company?: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    bank: {
      beneficiary: string;
      name: string;
      branch: string;
      account: string;
      ifsc: string;
    };
  };
  ownerUid?: string;
  createdBy?: import("./access").Attribution;
  previewPath?: string;
  id: string;
  number: string;
  revision: number;
  projectId: string;
  createdAt: string;
  validUntil: string;
  state: SalesProject;
  calculation: QuoteCalculation;
  products: Product[];
};
export type QuoteHistory = {
  id: string;
  number: string;
  revision: number;
  createdAt: string;
};
export const SLOT_LABELS: Record<Slot, string> = {
  projector: "Projector",
  front: "Front left & right",
  center: "Centre speaker",
  surround: "Side surrounds",
  rear: "Rear surrounds",
  height: "Height / Atmos",
  subwoofer: "Subwoofers",
  receiver: "AV receiver",
  amplifier: "Additional amplifier",
  package: "Theatre package",
  extra: "Accessories & other equipment",
};
export const EMPTY_EQUIPMENT: Equipment = {
  mode: "components",
  slots: {},
  extras: [],
};
export const EMPTY_CUSTOMER: Customer = {
  name: "",
  phone: "",
  email: "",
  project: "",
  address: "",
};
export const rupees = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
