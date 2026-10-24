"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTheaterSession } from "./TheaterSession";
import WorkspaceNav from "./WorkspaceNav";
import QuotationPreview from "./QuotationPreview";
import { api, downloadQuote } from "@/lib/theater/client";
import type { ProjectSummary } from "@/lib/theater/firestore-store";
import type { Attribution } from "@/lib/theater/access";
import { rupees } from "@/lib/theater/types";
import styles from "./workspace.module.css";
type QuoteRow = {
  id: string;
  number: string;
  projectId: string;
  revision: number;
  createdAt: string;
  ownerUid: string;
  createdBy: Attribution;
  customer: string;
  project: string;
  totalPaise: number;
  complete: boolean;
};
export default function TheaterDashboard() {
  const { member } = useTheaterSession();
  const [preview, setPreview] = useState<{ id: string; number: string } | null>(
    null,
  );
  const [projects, setProjects] = useState<ProjectSummary[]>([]),
    [quotes, setQuotes] = useState<QuoteRow[]>([]),
    [projectCursor, setProjectCursor] = useState<string | null>(null),
    [quoteCursor, setQuoteCursor] = useState<string | null>(null);
  const [tab, setTab] = useState<"projects" | "quotes">("projects"),
    [search, setSearch] = useState(""),
    [owner, setOwner] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [p, q] = await Promise.all([
        api<{ projects: ProjectSummary[]; nextCursor: string | null }>(
          "/api/theater/projects",
        ),
        api<{ quotes: QuoteRow[]; nextCursor: string | null }>(
          "/api/theater/quotes",
        ),
      ]);
      setProjects(p.projects);
      setProjectCursor(p.nextCursor);
      setQuotes(q.quotes);
      setQuoteCursor(q.nextCursor);
      setMessage("");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [member?.uid, member?.role]);
  useEffect(() => {
    void load();
  }, [load]);
  async function more() {
    setBusy(true);
    try {
      if (tab === "projects" && projectCursor) {
        const r = await api<{
          projects: ProjectSummary[];
          nextCursor: string | null;
        }>(`/api/theater/projects?cursor=${encodeURIComponent(projectCursor)}`);
        setProjects((p) => [...p, ...r.projects]);
        setProjectCursor(r.nextCursor);
      } else if (tab === "quotes" && quoteCursor) {
        const r = await api<{ quotes: QuoteRow[]; nextCursor: string | null }>(
          `/api/theater/quotes?cursor=${encodeURIComponent(quoteCursor)}`,
        );
        setQuotes((q) => [...q, ...r.quotes]);
        setQuoteCursor(r.nextCursor);
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const owners = useMemo(
    () =>
      Array.from(
        new Map(projects.map((p) => [p.ownerUid, p.createdBy])).entries(),
      ),
    [projects],
  );
  const filtered = projects.filter(
    (p) =>
      (member?.role === "admin" || p.ownerUid === member?.uid) &&
      (!owner || p.ownerUid === owner) &&
      `${p.name} ${p.createdBy?.name} ${p.createdBy?.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const filteredQuotes = quotes.filter(
    (q) =>
      (member?.role === "admin" || q.ownerUid === member?.uid) &&
      (!owner || q.ownerUid === owner) &&
      `${q.number} ${q.customer} ${q.project} ${q.createdBy?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  async function download(q: QuoteRow) {
    try {
      await downloadQuote(q.id, q.number);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <main className={styles.page}>
      {preview && (
        <QuotationPreview {...preview} onClose={() => setPreview(null)} />
      )}
      <WorkspaceNav />
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>YOUR CINEMA WORKSPACE</p>
          <h1>
            {member?.role === "admin"
              ? "Every project. One clear view."
              : `Welcome, ${member?.displayName.split(" ")[0]}.`}
          </h1>
          <p>
            {member?.role === "admin"
              ? "Review team projects, trace each quotation and manage access."
              : "Keep your client rooms, selected models and quotation revisions together."}
          </p>
        </div>
        <Link className={styles.primary} href="/home-theater-builder">
          + New cinema project
        </Link>
      </div>
      <div className={styles.stats}>
        <div className={styles.stat}>
          Loaded projects
          <strong>
            {projects.length}
            {projectCursor ? "+" : ""}
          </strong>
        </div>
        <div className={styles.stat}>
          Loaded quotations
          <strong>
            {quotes.length}
            {quoteCursor ? "+" : ""}
          </strong>
        </div>
        <div className={styles.stat}>
          {member?.role === "admin"
            ? "Workspace access"
            : "Your discount limit"}
          <strong>
            {member?.role === "admin"
              ? "Admin"
              : `${member?.maxDiscountPercent}%`}
          </strong>
        </div>
      </div>
      <div className={styles.tabs}>
        <button
          aria-pressed={tab === "projects"}
          onClick={() => setTab("projects")}
        >
          Projects
        </button>
        <button
          aria-pressed={tab === "quotes"}
          onClick={() => setTab("quotes")}
        >
          Quotations
        </button>
      </div>
      <div className={styles.toolbar}>
        <input
          aria-label="Search loaded projects and quotations"
          placeholder="Search loaded projects, clients or quotation numbers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {member?.role === "admin" && (
          <select
            aria-label="Filter loaded projects by creator"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            <option value="">All creators</option>
            {owners.map(([uid, person]) => (
              <option key={uid} value={uid}>
                {person?.name || person?.email || uid}
              </option>
            ))}
          </select>
        )}
        <button disabled={busy} onClick={() => void load()}>
          Refresh
        </button>
      </div>
      <p className={styles.status} role="status">
        {message || (busy ? "Loading workspace…" : "")}
      </p>
      {tab === "projects" ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Created by</th>
                <th>Last updated</th>
                <th>Version</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>
                    {p.createdBy?.name}
                    <small>{p.createdBy?.email}</small>
                  </td>
                  <td>
                    {new Date(p.updatedAt).toLocaleDateString("en-IN")}
                    <small>{p.updatedBy?.name}</small>
                  </td>
                  <td>{p.version}</td>
                  <td>
                    <Link
                      className={styles.primary}
                      href={`/home-theater-builder?project=${p.id}`}
                    >
                      Open project
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && !busy && (
            <p className={styles.empty}>
              No projects here yet. Create a room and save it from Review
              quotation.
            </p>
          )}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Quotation / client</th>
                <th>Prepared by</th>
                <th>Date</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <strong>{q.number}</strong>
                    <small>
                      {q.customer} · {q.project}
                    </small>
                    <small>
                      {q.complete ? "Quotation" : "Budget estimate"} · Revision{" "}
                      {q.revision}
                    </small>
                  </td>
                  <td>
                    {q.createdBy?.name}
                    <small>{q.createdBy?.email}</small>
                  </td>
                  <td>{new Date(q.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>{rupees(q.totalPaise)}</td>
                  <td>
                    <div className={styles.row}>
                      <button
                        onClick={() =>
                          setPreview({ id: q.id, number: q.number })
                        }
                      >
                        Preview PDF
                      </button>
                      <button onClick={() => void download(q)}>Download</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredQuotes.length && !busy && (
            <p className={styles.empty}>
              Your generated quotation revisions will appear here.
            </p>
          )}
        </div>
      )}
      {(tab === "projects" ? projectCursor : quoteCursor) && (
        <button
          className={styles.loadMore}
          disabled={busy}
          onClick={() => void more()}
        >
          Load more {tab}
        </button>
      )}
    </main>
  );
}
