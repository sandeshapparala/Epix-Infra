import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import catalog from "../../data/theater/products.json";
import type { Product, QuoteLine } from "./types";

export function quotationProduct(
  line: QuoteLine,
  products: Product[],
): Product | undefined {
  const id = line.productId ?? line.key.split("|")[0];
  return products.find((p) => p.id === id);
}

export async function localQuotationImage(
  product: Product,
): Promise<Uint8Array | null> {
  // Old snapshots keep their original financial data. A reviewed image can be
  // added by product ID when that older snapshot predates the image library.
  const current = catalog.find((p) => p.id === product.id);
  const image = product.quoteImage ?? current?.quoteImage;
  if (
    !image ||
    !/^\/theater-catalog\/quotation\/[a-f0-9]{24}\.jpg$/.test(image)
  )
    return null;
  const root = resolve(process.cwd(), "public");
  const file = resolve(root, `.${image}`);
  if (!file.startsWith(root + sep)) return null;
  try {
    return await readFile(file);
  } catch {
    return null;
  }
}

export async function quotationLogo(): Promise<Uint8Array | null> {
  try {
    return await readFile(resolve(process.cwd(), "public/logo.png"));
  } catch {
    return null;
  }
}
