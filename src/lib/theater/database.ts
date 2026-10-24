import { createClient, type Client } from "@libsql/client";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import seed from "../../data/theater/products.json";
import type {
  Product,
  Price,
  SavedProject,
  SalesProject,
  QuoteSnapshot,
} from "./types";

let connection: Promise<Client> | undefined;
export function database(): Promise<Client> {
  if (!connection)
    connection = (async () => {
      let url = process.env.THEATER_DATABASE_URL;
      if (!url) {
        if (process.env.VERCEL)
          throw new Error(
            "Set THEATER_DATABASE_URL to a persistent libSQL database before using quotations on Vercel.",
          );
        const dir = path.join(process.cwd(), ".theater-data");
        await mkdir(dir, { recursive: true });
        url = `file:${path.join(dir, "studio.db").replaceAll("\\", "/")}`;
      }
      const db = createClient({
        url,
        authToken: process.env.THEATER_DATABASE_AUTH_TOKEN,
      });
      await db.batch(
        [
          "CREATE TABLE IF NOT EXISTS catalog_prices (product_id TEXT PRIMARY KEY, payload TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0)",
          "CREATE TABLE IF NOT EXISTS price_history (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, old_value TEXT NOT NULL, new_value TEXT NOT NULL, changed_at TEXT NOT NULL)",
          "CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, state TEXT NOT NULL, version INTEGER NOT NULL, updated_at TEXT NOT NULL)",
          "CREATE TABLE IF NOT EXISTS quotes (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, revision INTEGER NOT NULL, number TEXT NOT NULL UNIQUE, request_id TEXT NOT NULL UNIQUE, snapshot TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(project_id,revision))",
          "CREATE INDEX IF NOT EXISTS quotes_project ON quotes(project_id,revision)",
          ...seed.map((p) => ({
            sql: "INSERT OR IGNORE INTO catalog_prices(product_id,payload,revision) VALUES(?,?,0)",
            args: [p.id, JSON.stringify(p.price)],
          })),
        ],
        "write",
      );
      // Reimports can correct source extraction without overwriting a price the
      // team has explicitly saved. Increase revisions so open quotes detect it.
      const stored = await db.execute(
        "SELECT product_id,payload,revision FROM catalog_prices",
      );
      const current = new Map(
        stored.rows.map((r) => [String(r.product_id), r]),
      );
      const corrections = seed.flatMap((p) => {
        const row = current.get(p.id);
        if (!row) return [];
        const previous = JSON.parse(String(row.payload));
        if (previous.updatedAt) return [];
        const fields = [
          "amountPaise",
          "taxBasis",
          "gstRate",
          "unit",
          "packSize",
        ] as const;
        if (fields.every((k) => previous[k] === p.price[k])) return [];
        const revision = Number(row.revision) + 1;
        return [
          {
            sql: "UPDATE catalog_prices SET payload=?,revision=? WHERE product_id=? AND revision=?",
            args: [
              JSON.stringify({ ...p.price, revision }),
              revision,
              p.id,
              Number(row.revision),
            ],
          },
        ];
      });
      if (corrections.length) await db.batch(corrections, "write");
      return db;
    })().catch((error) => {
      connection = undefined;
      throw error;
    });
  return connection;
}
export async function catalog(): Promise<Product[]> {
  const db = await database();
  const prices = await db.execute(
    "SELECT product_id,payload,revision FROM catalog_prices",
  );
  const map = new Map(
    prices.rows.map((r) => [
      String(r.product_id),
      {
        ...JSON.parse(String(r.payload)),
        revision: Number(r.revision),
      } as Price,
    ]),
  );
  return (seed as Product[]).map((p) => ({
    ...p,
    price: map.get(p.id) ?? p.price,
  }));
}
export class Conflict extends Error {}
export async function updatePrices(
  changes: { productId: string; price: Price; expectedRevision: number }[],
) {
  const db = await database();
  const tx = await db.transaction("write");
  try {
    const now = new Date().toISOString();
    const result: { productId: string; price: Price }[] = [];
    for (const item of changes) {
      const old = await tx.execute({
        sql: "SELECT payload,revision FROM catalog_prices WHERE product_id=?",
        args: [item.productId],
      });
      const row = old.rows[0];
      if (!row) throw new Error("Unknown product");
      if (Number(row.revision) !== item.expectedRevision)
        throw new Conflict(
          "A price changed in another window. Reload prices and try again.",
        );
      const price = {
        ...item.price,
        revision: Number(row.revision) + 1,
        updatedAt: now,
      };
      await tx.execute({
        sql: "UPDATE catalog_prices SET payload=?,revision=? WHERE product_id=?",
        args: [JSON.stringify(price), price.revision, item.productId],
      });
      await tx.execute({
        sql: "INSERT INTO price_history VALUES(?,?,?,?,?)",
        args: [
          crypto.randomUUID(),
          item.productId,
          String(row.payload),
          JSON.stringify(price),
          now,
        ],
      });
      result.push({ productId: item.productId, price });
    }
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}
export async function saveProject(
  id: string,
  version: number,
  state: SalesProject,
): Promise<SavedProject> {
  const db = await database();
  const now = new Date().toISOString();
  const name =
    state.customer.project || state.customer.name || "Untitled cinema";
  const result =
    version === 0
      ? await db.execute({
          sql: "INSERT OR IGNORE INTO projects VALUES(?,?,?,?,?)",
          args: [id, name, JSON.stringify(state), 1, now],
        })
      : await db.execute({
          sql: "UPDATE projects SET name=?,state=?,version=version+1,updated_at=? WHERE id=? AND version=?",
          args: [name, JSON.stringify(state), now, id, version],
        });
  if (result.rowsAffected !== 1)
    throw new Conflict(
      "This project was updated in another window. Reopen its latest version before saving.",
    );
  return { id, name, state, version: version + 1, updatedAt: now };
}
export async function listProjects() {
  const db = await database();
  return (
    await db.execute(
      "SELECT id,name,version,updated_at FROM projects ORDER BY updated_at DESC LIMIT 100",
    )
  ).rows.map((r) => ({
    id: r.id,
    name: r.name,
    version: r.version,
    updatedAt: r.updated_at,
  }));
}
export async function getProject(id: string): Promise<SavedProject | null> {
  const db = await database();
  const r = (
    await db.execute({ sql: "SELECT * FROM projects WHERE id=?", args: [id] })
  ).rows[0];
  return r
    ? {
        id: String(r.id),
        name: String(r.name),
        version: Number(r.version),
        updatedAt: String(r.updated_at),
        state: JSON.parse(String(r.state)),
      }
    : null;
}
export async function saveQuote(
  requestId: string,
  projectId: string,
  build: (id: string, revision: number, number: string) => QuoteSnapshot,
): Promise<QuoteSnapshot> {
  const db = await database();
  const tx = await db.transaction("write");
  try {
    const existing = (
      await tx.execute({
        sql: "SELECT snapshot FROM quotes WHERE request_id=?",
        args: [requestId],
      })
    ).rows[0];
    if (existing) {
      await tx.commit();
      return JSON.parse(String(existing.snapshot));
    }
    const last = (
      await tx.execute({
        sql: "SELECT MAX(revision) AS revision FROM quotes WHERE project_id=?",
        args: [projectId],
      })
    ).rows[0];
    const revision = Number(last?.revision ?? 0) + 1;
    const id = crypto.randomUUID();
    const number = `EPIX-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}-R${revision}`;
    const snapshot = build(id, revision, number);
    await tx.execute({
      sql: "INSERT INTO quotes VALUES(?,?,?,?,?,?,?)",
      args: [
        id,
        projectId,
        revision,
        number,
        requestId,
        JSON.stringify(snapshot),
        snapshot.createdAt,
      ],
    });
    await tx.commit();
    return snapshot;
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}
export async function getQuote(id: string): Promise<QuoteSnapshot | null> {
  const db = await database();
  const r = (
    await db.execute({
      sql: "SELECT snapshot FROM quotes WHERE id=?",
      args: [id],
    })
  ).rows[0];
  return r ? JSON.parse(String(r.snapshot)) : null;
}
export async function listQuotes(projectId: string) {
  const db = await database();
  return (
    await db.execute({
      sql: "SELECT id,number,revision,created_at FROM quotes WHERE project_id=? ORDER BY revision DESC",
      args: [projectId],
    })
  ).rows.map((r) => ({
    id: String(r.id),
    number: String(r.number),
    revision: Number(r.revision),
    createdAt: String(r.created_at),
  }));
}
