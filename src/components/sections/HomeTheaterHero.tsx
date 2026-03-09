"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";

/* ─────────────────────────────────────────────
   Slide data – all focused on Home Theater
───────────────────────────────────────────── */
interface Slide {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  accent: string;
}

const slides: Slide[] = [
  {
    image: "/Images/theater/homecinema.png",
    eyebrow: "Home Cinema by EPix",
    title: "Cinema Without\nCompromise,\nAt Home",
    subtitle:
      "End-to-end home theater design and installation — engineered from screen to seat, room to remote.",
    cta: "Design My Theater",
    ctaLink: "/get-quote",
    accent: "text-amber-400",
  },
  {
    image: "/Images/theater/projection.png",
    eyebrow: "4K Laser Projection",
    title: "See Every Frame\nExactly as\nDirected",
    subtitle:
      'Calibrated 4K and 8K laser projectors delivering 100–160" images with true-to-studio colour accuracy.',
    cta: "Explore Display Systems",
    ctaLink: "/get-quote",
    accent: "text-sky-400",
  },
  {
    image: "/Images/theater/dolbyatmos.png",
    eyebrow: "Dolby Atmos Certified",
    title: "Sound That Moves\nAbove, Around\nAnd Through You",
    subtitle:
      "Authorised Dolby Atmos installations — up to 9.2.4 channels positioned for precise three-dimensional audio.",
    cta: "Hear the Difference",
    ctaLink: "/get-quote",
    accent: "text-violet-400",
  },
  {
    image: "/Images/theater/comfortseating.png",
    eyebrow: "Luxury Seating & Design",
    title: "A Room Built for\nHours of Pure\nIndulgence",
    subtitle:
      "Custom motorised recliners, tiered layouts, and ambient lighting designed around your body and your taste.",
    cta: "View Room Designs",
    ctaLink: "/get-quote",
    accent: "text-rose-400",
  },
  {
    image: "/Images/theater/automation.png",
    eyebrow: "Smart Home Integration",
    title: "One Scene.\nEvery System.\nInstantly",
    subtitle:
      "Crestron and Savant automation ties your screen, sound, lighting, blinds and climate into a single tap.",
    cta: "Discover Automation",
    ctaLink: "/get-quote",
    accent: "text-emerald-400",
  },
];

/* ─────────────────────────────────────────────
   Auto-play interval (ms)
───────────────────────────────────────────── */
const INTERVAL = 6000;

/* ─────────────────────────────────────────────
   Motion variants
───────────────────────────────────────────── */
const eyebrowVariants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
  exit: { opacity: 0, x: 32, transition: { duration: 0.4 } },
};

const titleVariants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.1 },
  },
  exit: { opacity: 0, y: -32, transition: { duration: 0.4 } },
};

const subtitleVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut", delay: 0.25 },
  },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const ctaVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.4 },
  },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

/* ═══════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════ */
export default function HomeTheaterHero() {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    setCurrent((index + slides.length) % slides.length);
    setProgress(0);
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  /* Auto-advance */
  useEffect(() => {
    intervalRef.current = setInterval(next, INTERVAL);
    return () => clearInterval(intervalRef.current!);
  }, [next]);

  /* Progress bar tick (updates every ~60 ms for smooth animation) */
  useEffect(() => {
    setProgress(0);
    const tick = INTERVAL / 100;
    progressRef.current = setInterval(
      () => setProgress((p) => Math.min(p + 1, 100)),
      tick,
    );
    return () => clearInterval(progressRef.current!);
  }, [current]);

  const slide = slides[current];

  return (
    <section
      id="hero"
      className="relative w-full h-screen min-h-[680px] overflow-hidden bg-black"
    >
      {/* ── Background images (cross-fade) ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <Image
            src={slide.image}
            alt={slide.eyebrow}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Cinematic gradient overlays ── */}
      {/* bottom vignette — strong enough for crisp text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent z-10" />
      {/* left edge vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent z-10" />
      {/* top bar for navbar contrast */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/50 to-transparent z-10" />

      {/* ── Thin amber top stripe ── */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent z-30" />

      {/* ══════════════════════════════════════
          MAIN CONTENT  (bottom-left, cinematic)
      ══════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-8 md:px-16 lg:px-24 pb-32 md:pb-24">
        <AnimatePresence mode="wait">
          <motion.div key={`text-${current}`} className="max-w-3xl">
            {/* Eyebrow */}
            <motion.div
              className="flex items-center gap-3 mb-5"
              variants={eyebrowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <span
                className={`block w-8 h-[1px] ${slide.accent.replace("text-", "bg-")} opacity-80`}
              />
              <span
                className={`${slide.accent} text-xs md:text-sm tracking-[0.3em] uppercase font-medium`}
              >
                {slide.eyebrow}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-white text-[2.75rem] sm:text-5xl md:text-[4.5rem] lg:text-[4.5rem] font-regular tracking-[-0.03em] leading-[1.06] whitespace-pre-line mb-6"
              style={{ textShadow: "0 4px 40px rgba(0,0,0,0.6)" }}
              variants={titleVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-white/80 text-sm md:text-base max-w-md leading-relaxed mb-8"
              variants={subtitleVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {slide.subtitle}
            </motion.p>

            {/* CTA */}
            <motion.div
              className="flex items-center gap-4"
              variants={ctaVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Link
                href={slide.ctaLink}
                className="group relative inline-flex items-center gap-3 bg-amber-400 hover:bg-amber-300 text-black text-[0.7rem] font-semibold tracking-[0.2em] uppercase px-8 py-4 transition-all duration-300 hover:gap-4"
              >
                {slide.cta}
                <ChevronRight
                  size={13}
                  strokeWidth={2.5}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </Link>

              <Link
                href="/get-quote"
                className="group flex items-center gap-2.5 text-white/75 hover:text-white text-sm font-medium tracking-wide transition-colors duration-300"
              >
                <span className="block w-5 h-[1px] bg-white/50 group-hover:w-7 group-hover:bg-white transition-all duration-300" />
                Get a Quote
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════
          SLIDE COUNTER + PROGRESS  (right side)
      ══════════════════════════════════════ */}
      <div className="absolute right-8 md:right-12 bottom-24 md:bottom-16 z-30 flex flex-col items-end gap-6">
        {/* Slide number */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-white text-2xl font-semibold tabular-nums">
            {String(current + 1).padStart(2, "0")}
          </span>
          <span className="text-white/40 text-sm tracking-wider">
            &nbsp;/&nbsp;{String(slides.length).padStart(2, "0")}
          </span>
        </div>

        {/* Vertical dot-strip nav */}
        <div className="flex flex-col gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`relative w-[3px] rounded-full transition-all duration-500 ${
                i === current
                  ? "h-10 bg-amber-400"
                  : "h-4 bg-white/50 hover:bg-white/80"
              }`}
            >
              {/* Fill animation for active */}
              {i === current && (
                <motion.span
                  className="absolute inset-x-0 top-0 bg-white/30 rounded-full"
                  style={{ height: `${100 - progress}%` }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Prev / Next arrows */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="w-9 h-9 border border-white/40 hover:border-amber-400 hover:text-amber-400 text-white/70 flex items-center justify-center transition-all duration-300"
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="w-9 h-9 border border-white/40 hover:border-amber-400 hover:text-amber-400 text-white/70 flex items-center justify-center transition-all duration-300"
          >
            <ChevronRight size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          BOTTOM PROGRESS BAR
      ══════════════════════════════════════ */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/10 z-30">
        <motion.div
          className="h-full bg-amber-400"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0 }}
        />
      </div>

      {/* ══════════════════════════════════════
          SCROLL HINT  (bottom-center)
      ══════════════════════════════════════ */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-30 hidden md:flex flex-col items-center gap-2">
        <span className="text-white/50 text-[0.65rem] tracking-[0.3em] uppercase font-medium">
          Scroll
        </span>
        <div className="relative w-[1px] h-7 bg-white/10 overflow-hidden">
          <motion.div
            className="absolute inset-x-0 top-0 h-full bg-white/70"
            animate={{ y: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        </div>
      </div>
    </section>
  );
}
