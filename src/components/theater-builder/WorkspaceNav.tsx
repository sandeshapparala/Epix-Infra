"use client";
import Link from "next/link";
import Image from "next/image";
import logo from "@/Images/logo_white.png";
import { useAuth } from "@/context/AuthContext";
import { useTheaterSession } from "./TheaterSession";
import styles from "./workspace.module.css";
export default function WorkspaceNav() {
  const { member } = useTheaterSession(),
    { signOut } = useAuth();
  return (
    <header className={styles.nav}>
      <Link href="/home-theater-builder">
        <Image src={logo} alt="Epix Infra" width={119} height={42} />
      </Link>
      <nav aria-label="Team workspace">
        <Link href="/home-theater-builder">Room builder</Link>
        <Link href="/home-theater-builder/dashboard">
          Projects & quotations
        </Link>
        {member?.role === "admin" && (
          <>
            <Link href="/home-theater-builder/team">Team & rates</Link>
            <Link href="/home-theater-builder/pricing">Pricing</Link>
          </>
        )}
      </nav>
      <span>
        {member?.displayName}
        <small>{member?.role}</small>
      </span>
      <button onClick={() => void signOut()}>Sign out</button>
    </header>
  );
}
