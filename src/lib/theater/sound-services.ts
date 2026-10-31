import type { ServiceLine } from "./types";
export const ACOUSTICS_CODE = "soundproofing-acoustics";
export const ACOUSTICS_DESCRIPTION = "Soundproofing - acoustics";
export const ACOUSTICS_DEFAULT_PAISE = 3_500_000;
export const isAcousticsAddon = (s: { serviceCode?: string }) =>
  s.serviceCode === ACOUSTICS_CODE;
export function acousticsAddon(): ServiceLine {
  return {
    id: crypto.randomUUID(),
    serviceCode: ACOUSTICS_CODE,
    category: "acoustics",
    description: ACOUSTICS_DESCRIPTION,
    quantity: 1,
    amountPaise: ACOUSTICS_DEFAULT_PAISE,
    gstRate: 0,
  };
}
