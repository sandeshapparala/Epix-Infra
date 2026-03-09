"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import logoWhite from "@/Images/logo_white.png";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

const navLinks = [
  { name: "Home", target: "hero" },
  { name: "About Us", target: "about" },
  { name: "Services", target: "services" },
  { name: "Portfolio", target: "portfolio", isExternal: true },
  { name: "Testimonials", target: "testimonials" },
];

/* ── Individual nav link with animated underline ── */
function NavLink({
  name,
  onClick,
  scrolled,
}: {
  name: string;
  onClick: () => void;
  scrolled: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative text-sm font-medium tracking-wide transition-colors duration-300 py-1 cursor-pointer ${
        scrolled
          ? "text-gray-700 hover:text-amber-600"
          : "text-white/90 hover:text-white"
      }`}
    >
      {name}
      <motion.span
        className="absolute bottom-0 left-0 h-[2px] bg-amber-400 rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: hovered ? "100%" : "0%" }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      />
    </button>
  );
}

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  /* ── Scroll detection ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Lock body scroll when mobile menu open ── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navigateToSection = (target: string) => {
    setMenuOpen(false);
    const currentPath = window.location.pathname;
    if (currentPath === "/") {
      const el = document.getElementById(target);
      if (el) {
        gsap.to(window, {
          duration: 0.65,
          scrollTo: { y: el, offsetY: 76 },
          ease: "power3.out",
        });
      }
    } else {
      router.push(`/#${target}`);
    }
  };

  return (
    <>
      {/* ══════════════════════════════════════
          MAIN NAV BAR
      ══════════════════════════════════════ */}
      <motion.nav
        className="fixed top-0 left-0 w-full z-50"
        animate={{
          backgroundColor: scrolled ? "rgba(255,255,255,1)" : "rgba(0,0,0,0)",
          boxShadow: scrolled
            ? "0 2px 20px rgba(0,0,0,0.10)"
            : "0 0 0 rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      >
        {/* subtle frosted backdrop only when transparent */}
        {!scrolled && <div className="absolute inset-0 backdrop-blur-[2px]" />}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">
            {/* ── Logo (crossfade white ↔ colour) ── */}
            <Link
              href="/"
              onClick={() => navigateToSection("hero")}
              className="flex-shrink-0 relative w-[130px] h-[44px]"
            >
              {/* Colour logo — visible when scrolled */}
              <Image
                src="/logo.png"
                alt="EPix Infra"
                fill
                className={`object-contain transition-opacity duration-400 ${
                  scrolled ? "opacity-100" : "opacity-0"
                }`}
                priority
              />
              {/* White logo — visible over dark hero */}
              <Image
                src={logoWhite}
                alt="EPix Infra"
                fill
                className={`object-contain transition-opacity duration-400 ${
                  scrolled ? "opacity-0" : "opacity-100"
                }`}
                priority
              />
            </Link>

            {/* ── Desktop nav links ── */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  name={link.name}
                  scrolled={scrolled}
                  onClick={() =>
                    link.isExternal
                      ? router.push("/projects")
                      : navigateToSection(link.target)
                  }
                />
              ))}
            </div>

            {/* ── Desktop right cluster ── */}
            <div className="hidden md:flex items-center gap-4">
              {/* Dolby pill */}
              <span
                className={`hidden lg:flex items-center gap-2 border rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide ${
                  scrolled
                    ? "border-gray-200 text-gray-500"
                    : "border-white/25 text-white/70"
                }`}
              >
                <motion.span
                  className="w-[5px] h-[5px] rounded-full bg-amber-400 flex-shrink-0"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.2,
                    ease: "easeInOut",
                  }}
                />
                Dolby Atmos
              </span>

              {/* CTA */}
              <Link
                href="/get-quote"
                className={`text-sm font-semibold tracking-wide px-5 py-2 rounded transition-all duration-300 ${
                  scrolled
                    ? "bg-amber-400 hover:bg-amber-500 text-black"
                    : "bg-white text-black hover:bg-amber-400"
                }`}
              >
                Get a Quote
              </Link>
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="md:hidden relative w-7 h-5 flex flex-col justify-between z-[60]"
            >
              <motion.span
                className={`block h-0.5 rounded-full ${
                  scrolled && !menuOpen ? "bg-gray-800" : "bg-white"
                }`}
                animate={menuOpen ? { rotate: 45, y: 9 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className={`block h-0.5 rounded-full ${
                  scrolled && !menuOpen ? "bg-gray-800" : "bg-white"
                }`}
                animate={menuOpen ? { opacity: 0, x: 8 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className={`block h-0.5 w-3/4 rounded-full ${
                  scrolled && !menuOpen ? "bg-gray-800" : "bg-white"
                }`}
                animate={
                  menuOpen
                    ? { rotate: -45, y: -9, width: "100%" }
                    : { rotate: 0, y: 0 }
                }
                transition={{ duration: 0.3 }}
              />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ══════════════════════════════════════
          FULL-SCREEN MOBILE MENU
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            className="fixed inset-0 z-50 bg-[#060606] flex flex-col overflow-hidden"
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* amber accent line */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

            {/* nav links — staggered */}
            <nav className="flex flex-col justify-center flex-1 px-9 gap-0 mt-16">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    delay: 0.1 + i * 0.065,
                    duration: 0.42,
                    ease: "easeOut",
                  }}
                  className="border-b border-white/10 last:border-0"
                >
                  <button
                    onClick={() =>
                      link.isExternal
                        ? (router.push("/projects"), setMenuOpen(false))
                        : navigateToSection(link.target)
                    }
                    className="group w-full flex items-center gap-5 py-5 text-left"
                  >
                    <span className="text-xs text-amber-400 font-semibold tabular-nums min-w-[1.5rem] text-right">
                      0{i + 1}
                    </span>
                    <span className="text-white group-hover:text-amber-400 text-3xl font-medium tracking-tight leading-none transition-colors duration-200">
                      {link.name}
                    </span>
                    <motion.span
                      className="ml-auto text-white/0 group-hover:text-amber-400/70 text-xs"
                      whileHover={{ x: 3 }}
                    >
                      →
                    </motion.span>
                  </button>
                </motion.div>
              ))}
            </nav>

            {/* bottom bar */}
            <motion.div
              className="px-9 pb-12 flex items-center justify-between"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.38 }}
            >
              <Link
                href="/get-quote"
                onClick={() => setMenuOpen(false)}
                className="bg-amber-400 hover:bg-amber-300 text-black text-[0.65rem] tracking-[0.22em] uppercase font-semibold px-7 py-3 transition-colors duration-300"
              >
                Get a Quote
              </Link>

              <span className="text-white/40 text-xs tracking-widest uppercase">
                Dolby Atmos Certified
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
