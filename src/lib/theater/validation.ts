import { z } from "zod";
import { parseSavedDesign } from "../../components/theater-builder/design";
import type { SalesProject } from "./types";

const selection = z
  .object({
    productId: z.string().min(1).max(180),
    finish: z.string().max(100),
  })
  .strict();
const price = z
  .object({
    amountPaise: z.number().int().min(0).max(100_000_000_000).nullable(),
    taxBasis: z.enum(["inclusive", "exclusive", "unknown"]),
    gstRate: z.number().min(0).max(100).nullable(),
    unit: z.enum(["unit", "pair", "set", "unknown"]),
    packSize: z.number().int().min(1).max(100).nullable(),
    revision: z.number().int().min(0).optional(),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (
      (p.unit === "unit" && p.packSize !== 1) ||
      (p.unit === "pair" && p.packSize !== 2) ||
      (p.unit === "set" && p.packSize === null) ||
      (p.unit === "unknown" && p.packSize !== null)
    )
      ctx.addIssue({
        code: "custom",
        message: "Pack size must match the selling unit",
      });
    if (p.amountPaise === 0)
      ctx.addIssue({
        code: "custom",
        message: "Use an unpriced item rather than a zero product price",
      });
  });
export const priceChanges = z
  .object({
    changes: z
      .array(
        z.object({
          productId: z.string().min(1).max(180),
          expectedRevision: z.number().int().min(0),
          price,
        }),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (new Set(v.changes.map((c) => c.productId)).size !== v.changes.length)
      ctx.addIssue({ code: "custom", message: "Duplicate price updates" });
  });
export const projectInput = z
  .object({
    id: z.string().uuid(),
    version: z.number().int().min(0),
    state: z.unknown(),
  })
  .strict();
export const quoteInput = z
  .object({
    requestId: z.string().uuid(),
    projectId: z.string().uuid(),
    state: z.unknown(),
    priceRevisions: z.record(z.number().int().min(0)),
  })
  .strict();
const fields = z
  .object({
    design: z.unknown(),
    equipment: z
      .object({
        mode: z.enum(["components", "package"]),
        slots: z
          .object({
            projector: selection.optional(),
            front: selection.optional(),
            center: selection.optional(),
            surround: selection.optional(),
            rear: selection.optional(),
            height: selection.optional(),
            subwoofer: selection.optional(),
            receiver: selection.optional(),
            amplifier: selection.optional(),
            package: selection.optional(),
          })
          .strict(),
        extras: z
          .array(
            selection.extend({ quantity: z.number().int().min(1).max(100) }),
          )
          .max(50),
      })
      .strict(),
    customer: z
      .object({
        name: z.string().max(120),
        phone: z.string().max(40),
        email: z.string().max(160),
        project: z.string().max(160),
        address: z.string().max(500),
      })
      .strict(),
    services: z
      .array(
        z
          .object({
            id: z.string().max(80),
            rateId: z.string().uuid().optional(),
            category: z
              .enum([
                "installation",
                "display",
                "screen",
                "seating",
                "cabling",
                "acoustics",
                "other",
              ])
              .default("other"),
            description: z.string().min(1).max(200),
            quantity: z.number().min(0.01).max(1000),
            amountPaise: z.number().int().min(0).max(10_000_000_000),
            gstRate: z.number().min(0).max(100),
          })
          .strict(),
      )
      .max(50),
    discountPercent: z.number().min(0).max(100),
    validityDays: z.number().int().min(1).max(365),
    terms: z.string().max(4000),
    exclusions: z.string().max(4000),
    preview: z
      .string()
      .max(2_500_000)
      .refine(
        (s) =>
          s === "" || /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(s),
      )
      .optional(),
  })
  .strict();
export function parseProject(input: unknown): SalesProject {
  const state = fields.parse(input);
  const design = parseSavedDesign(
    JSON.stringify({ version: 1, design: state.design }),
  );
  return { ...state, design } as SalesProject;
}
