"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const Footer = dynamic(() => import("./Footer"));

export default function SiteFooter() {
  const pathname = usePathname();
  // The theatre workspace owns its viewport, including its staff pages.
  if (pathname === "/home-theater-builder" || pathname.startsWith("/home-theater-builder/")) return null;
  return <Footer />;
}
