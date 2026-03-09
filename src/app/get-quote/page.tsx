// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
/* eslint-disable */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  ChevronRight,
  Tv2,
  Speaker,
  Cpu,
  Monitor,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { toast } from "react-toastify";

const audioLayouts = [
  { value: "2.0", label: "2.0", desc: "Stereo" },
  { value: "2.1", label: "2.1", desc: "Stereo + Sub" },
  { value: "5.1", label: "5.1", desc: "Standard Surround" },
  { value: "5.1.2", label: "5.1.2", desc: "Surround + 2H" },
  { value: "5.1.4", label: "5.1.4", desc: "Surround + 4H" },
  { value: "7.1", label: "7.1", desc: "Extended Surround" },
  { value: "7.1.2", label: "7.1.2", desc: "Extended + 2H Atmos" },
  { value: "7.1.4", label: "7.1.4", desc: "Extended + 4H Atmos" },
  { value: "9.1.2", label: "9.1.2", desc: "Wide + 2 Height" },
  { value: "9.1.4", label: "9.1.4", desc: "Wide + 4 Height" },
  { value: "11.1.4", label: "11.1.4", desc: "Reference Atmos" },
];

const screenSizes = [
  { value: "80", label: 'Up to 80"' },
  { value: "80-100", label: '80" - 100"' },
  { value: "100-120", label: '100" - 120"' },
  { value: "120-140", label: '120" - 140"' },
  { value: "140-160", label: '140" - 160"' },
  { value: "160+", label: '160"+ Reference' },
];

const processorBrands = ["McIntosh", "Trinnov"];
const avrBrands = ["Marantz", "Denon", "Anthem"];
const powerAmpBrands = ["Rotel", "Tonewinner"];
const speakerBrands = ["Sonus Faber", "Focal", "Klipsch", "Canton"];
const subwooferBrands = ["SVS"];
const projectorBrands = ["BenQ", "Sony"];

const labelCls =
  "block text-xs font-semibold tracking-wider text-gray-400 uppercase mb-2";
const inputCls =
  "bg-white border border-gray-200 text-gray-900 placeholder:text-gray-300 " +
  "focus:border-amber-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 " +
  "rounded-lg h-12 text-sm transition-colors shadow-sm";
const selectTriggerCls =
  "bg-white border border-gray-200 text-gray-700 " +
  "focus:border-amber-400 focus:ring-0 focus:ring-offset-0 " +
  "rounded-lg h-12 text-sm shadow-sm [&>span]:text-gray-400";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-amber-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function BrandPills({
  title,
  icon: Icon,
  options,
  selected,
  onToggle,
  otherValue,
  onOtherChange,
}: {
  title: string;
  icon: React.ElementType;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
}) {
  const othersActive = selected.includes("Others");
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-amber-500" />
        <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
          {title}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((brand) => {
          const active = selected.includes(brand);
          return (
            <button
              key={brand}
              type="button"
              onClick={() => onToggle(brand)}
              className={`text-xs px-3.5 py-2 rounded-lg border font-medium transition-all duration-200 ${
                active
                  ? "bg-amber-400 border-amber-400 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600"
              }`}
            >
              {brand}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onToggle("Others")}
          className={`text-xs px-3.5 py-2 rounded-lg border font-medium transition-all duration-200 ${
            othersActive
              ? "bg-amber-400 border-amber-400 text-white shadow-sm"
              : "bg-white border-dashed border-gray-300 text-gray-400 hover:border-amber-300 hover:text-amber-600"
          }`}
        >
          Others
        </button>
      </div>
      {othersActive && onOtherChange !== undefined && (
        <Input
          value={otherValue || ""}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="Enter brand name…"
          className={inputCls}
        />
      )}
    </div>
  );
}

function SectionCard({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
          <span className="text-amber-500 text-xs font-bold">{number}</span>
        </div>
        <div>
          <h2 className="text-gray-800 text-base font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function GetQuotePage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    message: "",
    budget: "",
    timeline: "",
    audioLayout: "",
    screenSize: "",
    roomLength: "",
    roomWidth: "",
    roomHeight: "",
    processorBrands: [] as string[],
    avrBrands: [] as string[],
    powerAmpBrands: [] as string[],
    speakerBrands: [] as string[],
    subwooferBrands: [] as string[],
    projectorBrands: [] as string[],
    processorOther: "",
    avrOther: "",
    powerAmpOther: "",
    speakerOther: "",
    subwooferOther: "",
    projectorOther: "",
  });

  const set = (key: string, val: unknown) =>
    setForm((p) => ({ ...p, [key]: val }));

  const toggleBrand = (
    key:
      | "processorBrands"
      | "avrBrands"
      | "powerAmpBrands"
      | "speakerBrands"
      | "subwooferBrands"
      | "projectorBrands",
    val: string,
  ) =>
    setForm((p) => ({
      ...p,
      [key]: p[key].includes(val)
        ? p[key].filter((b) => b !== val)
        : [...p[key], val],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        location: form.location,
        service: "home-theater",
        message: form.message,
        budget: form.budget,
        timeline: form.timeline,
        audioLayout: form.audioLayout,
        screenSize: form.screenSize,
        processorBrands: form.processorBrands,
        avrBrands: form.avrBrands,
        powerAmpBrands: form.powerAmpBrands,
        speakerBrands: form.speakerBrands,
        subwooferBrands: form.subwooferBrands,
        projectorBrands: form.projectorBrands,
        ...(form.processorOther && { processorOther: form.processorOther }),
        ...(form.avrOther && { avrOther: form.avrOther }),
        ...(form.powerAmpOther && { powerAmpOther: form.powerAmpOther }),
        ...(form.speakerOther && { speakerOther: form.speakerOther }),
        ...(form.subwooferOther && { subwooferOther: form.subwooferOther }),
        ...(form.projectorOther && { projectorOther: form.projectorOther }),
        createdAt: Timestamp.now(),
      };
      if (form.roomLength || form.roomWidth || form.roomHeight) {
        payload.roomDimensions = {
          length: form.roomLength,
          width: form.roomWidth,
          height: form.roomHeight,
        };
      }
      await addDoc(collection(db, "contact"), payload);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit. Please try again.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-7">
            <CheckCircle2 className="text-amber-500" size={36} />
          </div>
          <h2 className="text-gray-900 text-3xl font-semibold mb-3">
            Request Received!
          </h2>
          <p className="text-gray-500 text-base leading-relaxed mb-8">
            Our team will review your home theater requirements and contact you
            within 24 hours with a tailored proposal.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-8 py-3.5 rounded-xl transition-colors"
          >
            <ArrowLeft size={15} /> Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-amber-500 transition-colors group"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <Link href="/">
            <Image
              src="/logo.png"
              alt="EPix Infra"
              width={100}
              height={34}
              className="object-contain"
            />
          </Link>
          <a
            href="tel:+917386440344"
            className="hidden sm:flex items-center gap-2 text-gray-500 hover:text-amber-500 transition-colors"
          >
            <Phone size={14} />
            <span className="text-sm font-medium">Call Us</span>
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 xl:gap-16 items-start">
          {/* ── FORM ── */}
          <div>
            {/* Heading */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-600 text-xs font-semibold tracking-wider uppercase px-3.5 py-1.5 rounded-full mb-4">
                <Tv2 size={12} /> Home Theater Quote
              </div>
              <h1 className="text-gray-900 text-3xl lg:text-4xl font-semibold tracking-tight leading-tight mb-3">
                Design Your Perfect
                <br />
                <span className="text-amber-500">Home Cinema</span>
              </h1>
              <p className="text-gray-500 text-base">
                Fill in your details and preferences — we will build a custom
                proposal just for you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1 – Contact */}
              <SectionCard number="1" title="Your Contact Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Full Name" required>
                    <Input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="John Doe"
                      required
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Email Address" required>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="john@example.com"
                      required
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Phone Number" required>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+91 73864 40344"
                      required
                      className={inputCls}
                    />
                  </Field>
                  <Field label="City / Location">
                    <Input
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                      placeholder="Nellore, Andhra Pradesh..."
                      className={inputCls}
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* 2 – Audio layout */}
              <SectionCard
                number="2"
                title="Audio Channel Layout"
                subtitle="Pick your preferred surround configuration"
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                  {audioLayouts.map((l) => {
                    const active = form.audioLayout === l.value;
                    return (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => set("audioLayout", l.value)}
                        className={`flex flex-col items-center justify-center gap-1 py-4 px-2 rounded-xl border text-center transition-all duration-200 ${
                          active
                            ? "bg-amber-50 border-amber-300 shadow-sm"
                            : "bg-gray-50 border-gray-200 hover:border-amber-200 hover:bg-amber-50/50"
                        }`}
                      >
                        <span
                          className={`text-base font-bold tabular-nums leading-none ${active ? "text-amber-500" : "text-gray-600"}`}
                        >
                          {l.label}
                        </span>
                        <span
                          className={`text-[0.6rem] leading-tight ${active ? "text-amber-400" : "text-gray-400"}`}
                        >
                          {l.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              {/* 3 – Screen + Room */}
              <SectionCard number="3" title="Screen & Room">
                <div className="space-y-6">
                  <div>
                    <label className={labelCls}>Screen / Projection Size</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {screenSizes.map((s) => {
                        const active = form.screenSize === s.value;
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => set("screenSize", s.value)}
                            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                              active
                                ? "bg-amber-50 border-amber-300 text-amber-600 shadow-sm"
                                : "bg-gray-50 border-gray-200 text-gray-500 hover:border-amber-200 hover:text-amber-500"
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>
                      Room Dimensions
                      <span className="text-gray-300 normal-case tracking-normal font-normal ml-1.5">
                        — in feet (optional)
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {(["Length", "Width", "Height"] as const).map((dim) => (
                        <Field key={dim} label={dim}>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder={dim + " ft"}
                            value={
                              form[
                                ("room" + dim) as keyof typeof form
                              ] as string
                            }
                            onChange={(e) => set("room" + dim, e.target.value)}
                            className={inputCls}
                          />
                        </Field>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* 4 – Brands */}
              <SectionCard
                number="4"
                title="Preferred Brands"
                subtitle="Optional — select any you have in mind"
              >
                <div className="space-y-5">
                  <BrandPills
                    title="Processors"
                    icon={Cpu}
                    options={processorBrands}
                    selected={form.processorBrands}
                    onToggle={(v) => toggleBrand("processorBrands", v)}
                    otherValue={form.processorOther}
                    onOtherChange={(v) => set("processorOther", v)}
                  />
                  <div className="h-px bg-gray-100" />
                  <BrandPills
                    title="AV Receivers (AVR)"
                    icon={Tv2}
                    options={avrBrands}
                    selected={form.avrBrands}
                    onToggle={(v) => toggleBrand("avrBrands", v)}
                    otherValue={form.avrOther}
                    onOtherChange={(v) => set("avrOther", v)}
                  />
                  <div className="h-px bg-gray-100" />
                  <BrandPills
                    title="Power Amplifiers"
                    icon={Cpu}
                    options={powerAmpBrands}
                    selected={form.powerAmpBrands}
                    onToggle={(v) => toggleBrand("powerAmpBrands", v)}
                    otherValue={form.powerAmpOther}
                    onOtherChange={(v) => set("powerAmpOther", v)}
                  />
                  <div className="h-px bg-gray-100" />
                  <BrandPills
                    title="Speakers"
                    icon={Speaker}
                    options={speakerBrands}
                    selected={form.speakerBrands}
                    onToggle={(v) => toggleBrand("speakerBrands", v)}
                    otherValue={form.speakerOther}
                    onOtherChange={(v) => set("speakerOther", v)}
                  />
                  <div className="h-px bg-gray-100" />
                  <BrandPills
                    title="Subwoofers"
                    icon={Speaker}
                    options={subwooferBrands}
                    selected={form.subwooferBrands}
                    onToggle={(v) => toggleBrand("subwooferBrands", v)}
                    otherValue={form.subwooferOther}
                    onOtherChange={(v) => set("subwooferOther", v)}
                  />
                  <div className="h-px bg-gray-100" />
                  <BrandPills
                    title="Projectors"
                    icon={Monitor}
                    options={projectorBrands}
                    selected={form.projectorBrands}
                    onToggle={(v) => toggleBrand("projectorBrands", v)}
                    otherValue={form.projectorOther}
                    onOtherChange={(v) => set("projectorOther", v)}
                  />
                </div>
              </SectionCard>

              {/* 5 – Budget + Timeline + Message */}
              <SectionCard number="5" title="Project Details">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Approximate Budget">
                      <Select
                        value={form.budget}
                        onValueChange={(v) => set("budget", v)}
                      >
                        <SelectTrigger className={selectTriggerCls}>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "Under Rs 5 Lakhs",
                            "Rs 5 to 10 Lakhs",
                            "Rs 10 to 20 Lakhs",
                            "Rs 20 to 50 Lakhs",
                            "Rs 50 Lakhs to 1 Cr",
                            "Above Rs 1 Cr",
                            "Not decided yet",
                          ].map((b) => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Expected Timeline">
                      <Select
                        value={form.timeline}
                        onValueChange={(v) => set("timeline", v)}
                      >
                        <SelectTrigger className={selectTriggerCls}>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "ASAP / Urgent",
                            "Within 1 month",
                            "1 to 3 months",
                            "3 to 6 months",
                            "6+ months",
                            "Flexible",
                          ].map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Describe Your Vision" required>
                    <Textarea
                      value={form.message}
                      onChange={(e) => set("message", e.target.value)}
                      required
                      placeholder="Tell us about the room, your movie habits, any specific gear you have in mind..."
                      className={`${inputCls} min-h-[140px] resize-none h-auto py-4`}
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* Submit */}
              <div className="flex items-center justify-between py-2">
                <p className="text-gray-400 text-xs">
                  We respond within{" "}
                  <span className="text-gray-600 font-medium">24 hours</span>
                </p>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !form.name ||
                    !form.phone ||
                    !form.email ||
                    !form.message
                  }
                  className="group flex items-center gap-2.5 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-9 py-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Quote Request{" "}
                      <ChevronRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="lg:sticky lg:top-24 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h3 className="text-gray-800 font-semibold text-sm">
                Why EPix Infra?
              </h3>
              {[
                {
                  emoji: "⚡",
                  title: "Response in 24 hrs",
                  desc: "Our team reviews every request same day.",
                },
                {
                  emoji: "🎯",
                  title: "No obligation, free quote",
                  desc: "Detailed proposal with zero pressure.",
                },
                {
                  emoji: "🔊",
                  title: "Certified Atmos partner",
                  desc: "Dolby-certified home theater experts.",
                },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">{emoji}</span>
                  <div>
                    <p className="text-gray-800 text-sm font-medium">{title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="text-gray-800 font-semibold text-sm">
                What Happens Next
              </h3>
              {[
                {
                  n: "01",
                  title: "We review your request",
                  sub: "Within 24 hours",
                },
                {
                  n: "02",
                  title: "Discovery call",
                  sub: "Align scope and vision",
                },
                {
                  n: "03",
                  title: "Detailed proposal",
                  sub: "Line-item quote + timeline",
                },
                {
                  n: "04",
                  title: "Project kickoff",
                  sub: "Design to Build to Handover",
                },
              ].map(({ n, title, sub }) => (
                <div key={n} className="flex items-start gap-4">
                  <span className="text-amber-400 font-bold text-xs tabular-nums min-w-[1.5rem] mt-0.5">
                    {n}
                  </span>
                  <div>
                    <p className="text-gray-700 text-sm">{title}</p>
                    <p className="text-gray-400 text-xs">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6 space-y-3">
              <h3 className="text-gray-800 font-semibold text-sm">
                Prefer to talk?
              </h3>
              <a
                href="tel:+917386440344"
                className="flex items-center gap-3 text-gray-600 hover:text-amber-600 transition-colors"
              >
                <Phone
                  size={14}
                  className="text-amber-400 flex-shrink-0 mt-0.5"
                />
                <span className="text-sm">+91 73864 40344</span>
              </a>
              <a
                href="mailto:hello@epixinfra.com"
                className="flex items-center gap-3 text-gray-600 hover:text-amber-600 transition-colors"
              >
                <Mail
                  size={14}
                  className="text-amber-400 flex-shrink-0 mt-0.5"
                />
                <span className="text-sm">hello@epixinfra.com</span>
              </a>
              <div className="flex items-start gap-3 text-gray-500">
                <MapPin
                  size={14}
                  className="text-amber-400 flex-shrink-0 mt-0.5"
                />
                <span className="text-sm leading-relaxed">
                  D.No. 27-4-455, Goudhostel Center,
                  <br />
                  Balaji Nagar, Nellore – 524002
                  <br />
                  Andhra Pradesh, India
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
