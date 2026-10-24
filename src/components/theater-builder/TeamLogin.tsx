"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/Images/logo_white.png";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useTheaterSession } from "./TheaterSession";
import { THEATER_HOME, theaterReturnTo } from "@/lib/theater/navigation";
import styles from "./workspace.module.css";
export default function TeamLogin() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const { member, refresh, loading, error } = useTheaterSession(),
    { user, signOut } = useAuth(),
    router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  useEffect(() => {
    setDestination(
      theaterReturnTo(new URL(window.location.href).searchParams.get("next")),
    );
  }, []);
  // Covers both a newly completed sign-in and an existing restored session.
  useEffect(() => {
    if (member && !loading && destination) router.replace(destination);
  }, [member, loading, destination, router]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await refresh();
    } catch (e) {
      setMessage(
        (e as Error).message.includes("auth/")
          ? "Sign-in failed. Check your email and password, or use Set / reset password."
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    if (!email.trim()) {
      setMessage("Enter your team email first.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "If this email has an account, a setup or reset link will be sent to it.",
      );
    } catch {
      setMessage(
        "The setup email could not be requested. Check the address and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={styles.login}>
      <section className={`${styles.card} ${styles.loginCard}`}>
        <Link href={THEATER_HOME} aria-label="Epix Infra room builder">
          <Image src={logo} width={150} height={64} alt="Epix Infra" priority />
        </Link>
        <p className={styles.eyebrow}>EPIX INFRA · TEAM WORKSPACE</p>
        <h1>Your next cinema starts here.</h1>
        <p>
          Employees manage their own clients and quotations. Admins manage the
          whole team, catalog prices and discount limits.
        </p>
        {member ? (
          <>
            <p>
              Signed in as <strong>{member.displayName}</strong> · {member.role}
            </p>
            <Link className={styles.primary} href={destination ?? THEATER_HOME}>
              Continue to your cinema
            </Link>
            <button onClick={() => void signOut()}>
              Use a different account
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <label>
              Team email
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className={styles.primary} disabled={busy} type="submit">
              {busy ? "Opening your workspace…" : "Sign in to your workspace"}
            </button>
            <button type="button" disabled={busy} onClick={() => void reset()}>
              Set / reset password
            </button>
            {user && (
              <button type="button" onClick={() => void signOut()}>
                Sign out of {user.email}
              </button>
            )}
          </form>
        )}
        <p role={message || error ? "alert" : "status"}>
          {message ||
            error ||
            (member ? "Access verified. Opening your workspace…" : "")}
        </p>
        <Link href="/home-theater-builder">
          Continue exploring the public room builder →
        </Link>
      </section>
    </main>
  );
}
