"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/theater/client";
import type { TheaterMember } from "@/lib/theater/access";
import styles from "./workspace.module.css";

type Session = {
  member: TheaterMember | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};
const Context = createContext<Session>({
  member: null,
  loading: true,
  error: "",
  refresh: async () => {},
});
export function TheaterSession({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [member, setMember] = useState<TheaterMember | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++generation.current;
    // Sign-in can finish before React delivers the new user to this render.
    // Read Firebase directly so a stale submit callback cannot clear the session.
    if (!auth.currentUser) {
      setMember(null);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await api<{ member: TheaterMember }>("/api/theater/me");
      if (id === generation.current) {
        setMember(r.member);
        setError("");
      }
    } catch (e) {
      if (id === generation.current) {
        setMember(null);
        setError((e as Error).message);
      }
    } finally {
      if (id === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!user) setMember(null);
    if (!authLoading) void refresh();
    return () => {
      generation.current++;
    };
  }, [user, authLoading, refresh]);
  useEffect(() => {
    const check = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [refresh]);
  return (
    <Context.Provider
      value={{
        member: member?.uid === user?.uid ? member : null,
        loading: loading || authLoading,
        error,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useTheaterSession = () => useContext(Context);
export function StaffOnly({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { member, loading, error } = useTheaterSession();
  if (loading && !member)
    return (
      <main className={styles.page}>
        <p role="status">Checking workspace access…</p>
      </main>
    );
  if (!member)
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1>Team workspace</h1>
          <p>
            {error ||
              "Sign in with your Epix team account to manage projects and quotations."}
          </p>
          <Link className={styles.primary} href="/home-theater-builder/login">
            Team sign in
          </Link>
          <Link href="/home-theater-builder">
            Continue with the room builder
          </Link>
        </section>
      </main>
    );
  if (admin && member.role !== "admin")
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1>Administrator access required</h1>
          <p>
            Your employee account can manage your projects and quotations.
            Pricing and team access are managed by an administrator.
          </p>
          <Link
            className={styles.primary}
            href="/home-theater-builder/dashboard"
          >
            My dashboard
          </Link>
        </section>
      </main>
    );
  return <>{children}</>;
}
export function ModelSignIn() {
  return (
    <div className={styles.locked}>
      <strong>Team model library</strong>
      <p>
        Explore the room freely. Sign in as an employee or admin to select
        models, see pricing and prepare quotations.
      </p>
      <Link href="/home-theater-builder/login">
        Sign in to select equipment →
      </Link>
    </div>
  );
}
