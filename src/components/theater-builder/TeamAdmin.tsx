"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/theater/client";
import type { ServiceRate, TheaterMember } from "@/lib/theater/access";
import { rupees } from "@/lib/theater/types";
import WorkspaceNav from "./WorkspaceNav";
import { useTheaterSession } from "./TheaterSession";
import styles from "./workspace.module.css";

function MemberEditor({
  member,
  self,
  onSaved,
}: {
  member: TheaterMember;
  self: boolean;
  onSaved: (m: TheaterMember) => void;
}) {
  const [draft, setDraft] = useState(member),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ member: TheaterMember }>(
        `/api/theater/team/${member.uid}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            displayName: draft.displayName,
            role: draft.role,
            active: draft.active,
            maxDiscountPercent: draft.maxDiscountPercent,
            expectedRevision: member.revision,
          }),
        },
      );
      onSaved(r.member);
      setDraft(r.member);
      setMessage("Access settings saved.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function setup() {
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, member.email);
      setMessage("Setup / password reset email requested.");
    } catch {
      setMessage(
        "The setup email could not be sent. Check Firebase email/password sign-in configuration.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className={styles.memberForm} onSubmit={save}>
      <h3>
        {member.displayName} {self ? "(you)" : ""}
      </h3>
      <p className={styles.muted}>{member.email}</p>
      <div className={styles.row}>
        <label>
          Name
          <input
            required
            maxLength={100}
            value={draft.displayName}
            onChange={(e) =>
              setDraft((d) => ({ ...d, displayName: e.target.value }))
            }
          />
        </label>
        <label>
          Role
          <select
            aria-label={`Role for ${member.email}`}
            disabled={self}
            value={draft.role}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                role: e.target.value as TheaterMember["role"],
              }))
            }
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          Maximum discount (%)
          <input
            aria-label={`Maximum discount for ${member.email}`}
            type="number"
            min={0}
            max={100}
            step={0.1}
            disabled={draft.role === "admin"}
            value={draft.role === "admin" ? 100 : draft.maxDiscountPercent}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                maxDiscountPercent: Number(e.target.value),
              }))
            }
          />
        </label>
      </div>
      <label className={styles.row}>
        <input
          aria-label={`Active access for ${member.email}`}
          type="checkbox"
          disabled={self}
          checked={draft.active}
          onChange={(e) =>
            setDraft((d) => ({ ...d, active: e.target.checked }))
          }
        />{" "}
        Workspace access active
      </label>
      <p className={styles.muted}>
        {draft.role === "admin"
          ? "Admin: all team projects, quotations, prices, rates and access settings."
          : "Employee: own projects and quotations; discount from 0% up to this limit. Catalog and work rates are read-only."}
      </p>
      <div className={styles.row}>
        <button className={styles.primary} disabled={busy} type="submit">
          Save access settings
        </button>
        <button disabled={busy} type="button" onClick={() => void setup()}>
          Send setup email
        </button>
      </div>
      <p className={styles.status} role="status">
        {message}
      </p>
    </form>
  );
}
const blankRate = (): ServiceRate => ({
  id: crypto.randomUUID(),
  category: "installation",
  description: "",
  unit: "job",
  amountPaise: 0,
  gstRate: 18,
  active: true,
  revision: 0,
});
export default function TeamAdmin() {
  const { member: actor, refresh: refreshSession } = useTheaterSession();
  const [members, setMembers] = useState<TheaterMember[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [rates, setRates] = useState<ServiceRate[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [role, setRole] = useState<TheaterMember["role"]>("employee"),
    [discount, setDiscount] = useState(0);
  const [rate, setRate] = useState<ServiceRate | null>(null);
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [m, r] = await Promise.all([
        api<{ members: TheaterMember[]; nextCursor: string | null }>(
          "/api/theater/team",
        ),
        api<{ rates: ServiceRate[] }>("/api/theater/service-rates"),
      ]);
      setMembers(m.members);
      setCursor(m.nextCursor);
      setRates(r.rates);
      setMessage("");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ member: TheaterMember }>("/api/theater/team", {
        method: "POST",
        body: JSON.stringify({
          email,
          displayName: name,
          role,
          maxDiscountPercent: role === "admin" ? 100 : discount,
        }),
      });
      setMembers((m) => [r.member, ...m]);
      setEmail("");
      setName("");
      setMessage(
        "Account added. Use Send setup email so this person can choose their own password.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function more() {
    if (!cursor) return;
    setBusy(true);
    try {
      const r = await api<{
        members: TheaterMember[];
        nextCursor: string | null;
      }>(`/api/theater/team?cursor=${encodeURIComponent(cursor)}`);
      setMembers((m) => [...m, ...r.members]);
      setCursor(r.nextCursor);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveRate(e: FormEvent) {
    e.preventDefault();
    if (!rate) return;
    setBusy(true);
    try {
      const r = await api<{ rate: ServiceRate }>("/api/theater/service-rates", {
        method: "PUT",
        body: JSON.stringify(rate),
      });
      setRates((rows) => [r.rate, ...rows.filter((x) => x.id !== r.rate.id)]);
      setRate(null);
      setMessage("Approved project-work rate saved.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={styles.page}>
      <WorkspaceNav />
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>ADMIN WORKSPACE</p>
          <h1>A team with clear boundaries.</h1>
          <p>
            Two roles. Set each employee’s maximum discount and keep pricing
            under admin control.
          </p>
        </div>
        <button disabled={busy} onClick={() => void load()}>
          Refresh team & rates
        </button>
      </div>
      <section className={styles.section}>
        <h2>Add a team account</h2>
        <p className={styles.muted}>
          Uses an existing Firebase account when its email is already
          registered. New users set their own password from a setup email.
        </p>
        <form className={styles.memberForm} onSubmit={create}>
          <div className={styles.row}>
            <label>
              Full name
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                autoComplete="off"
                maxLength={160}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Account role
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as TheaterMember["role"])
                }
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Maximum employee discount (%)
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                disabled={role === "admin"}
                value={role === "admin" ? 100 : discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </label>
          </div>
          <button disabled={busy} className={styles.primary}>
            Add account
          </button>
        </form>
      </section>
      <p className={styles.status} role="status">
        {message}
      </p>
      <section className={styles.section}>
        <h2>Team access</h2>
        <div className={styles.grid}>
          {members.map((m) => (
            <MemberEditor
              key={`${m.uid}:${m.revision}`}
              member={m}
              self={actor?.uid === m.uid}
              onSaved={(next) => {
                setMembers((rows) =>
                  rows.map((x) => (x.uid === next.uid ? next : x)),
                );
                if (next.uid === actor?.uid) void refreshSession();
              }}
            />
          ))}
        </div>
        {cursor && (
          <button
            className={styles.loadMore}
            disabled={busy}
            onClick={() => void more()}
          >
            Load more team members
          </button>
        )}
      </section>
      <section className={styles.section}>
        <div className={styles.heading}>
          <div>
            <h2>Approved project-work rates</h2>
            <p className={styles.muted}>
              Employees can change quantities and select these rates, but cannot
              edit unit prices or GST. All rates exclude GST.
            </p>
          </div>
          <button onClick={() => setRate(blankRate())}>+ Add a rate</button>
        </div>
        {rate && (
          <form className={styles.memberForm} onSubmit={saveRate}>
            <div className={styles.row}>
              <label>
                Description
                <input
                  required
                  maxLength={200}
                  value={rate.description}
                  onChange={(e) =>
                    setRate({ ...rate, description: e.target.value })
                  }
                />
              </label>
              <label>
                Category
                <select
                  value={rate.category}
                  onChange={(e) =>
                    setRate({
                      ...rate,
                      category: e.target.value as ServiceRate["category"],
                    })
                  }
                >
                  {[
                    "installation",
                    "display",
                    "screen",
                    "seating",
                    "cabling",
                    "acoustics",
                    "other",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Unit
                <input
                  required
                  maxLength={30}
                  value={rate.unit}
                  onChange={(e) => setRate({ ...rate, unit: e.target.value })}
                />
              </label>
              <label>
                Rate (₹, before GST)
                <input
                  type="number"
                  required
                  min={0.01}
                  step={0.01}
                  value={rate.amountPaise / 100}
                  onChange={(e) =>
                    setRate({
                      ...rate,
                      amountPaise: Math.round(Number(e.target.value) * 100),
                    })
                  }
                />
              </label>
              <label>
                GST (%)
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  step={0.1}
                  value={rate.gstRate}
                  onChange={(e) =>
                    setRate({ ...rate, gstRate: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <label className={styles.row}>
              <input
                type="checkbox"
                checked={rate.active}
                onChange={(e) => setRate({ ...rate, active: e.target.checked })}
              />{" "}
              Available for employee quotations
            </label>
            <div className={styles.row}>
              <button className={styles.primary} disabled={busy}>
                Save approved rate
              </button>
              <button type="button" onClick={() => setRate(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Project work</th>
                <th>Unit rate</th>
                <th>GST</th>
                <th>Employee selection</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.description}
                    <small>{r.category}</small>
                  </td>
                  <td>
                    {rupees(r.amountPaise)} / {r.unit}
                  </td>
                  <td>{r.gstRate}%</td>
                  <td>{r.active ? "Enabled" : "Disabled"}</td>
                  <td>
                    <button onClick={() => setRate(r)}>Edit rate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rates.length && (
            <p className={styles.empty}>
              No approved rates yet. Add the company’s installation, screen,
              seating or cabling rates.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
