// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
/* eslint-disable */
"use client";

import React, { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Home,
  Paintbrush,
  Building2,
  Lightbulb,
  Sofa,
  CheckCircle2,
  ChevronRight,
  Tv2,
  Speaker,
  Armchair,
  Cpu,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

interface ContactFormProps {
  onClose: () => void;
}

const audioLayouts = [
  { value: "2.0", label: "2.0   â€” Stereo" },
  { value: "2.1", label: "2.1   â€” Stereo + Subwoofer" },
  { value: "5.1", label: "5.1   â€” Standard Surround" },
  { value: "5.1.2", label: "5.1.2 â€” Surround + 2 Height" },
  { value: "5.1.4", label: "5.1.4 â€” Surround + 4 Height" },
  { value: "7.1", label: "7.1   â€” Extended Surround" },
  { value: "7.1.2", label: "7.1.2 â€” Extended + 2 Height (Atmos)" },
  { value: "7.1.4", label: "7.1.4 â€” Extended + 4 Height (Atmos)" },
  { value: "9.1.2", label: "9.1.2 â€” Wide + 2 Height" },
  { value: "9.1.4", label: "9.1.4 â€” Wide + 4 Height" },
  { value: "11.1.4", label: "11.1.4 â€” Reference Atmos" },
];

const speakerBrands = [
  "Bowers & Wilkins",
  "KEF",
  "Klipsch",
  "Focal",
  "Monitor Audio",
  "Wharfedale",
  "JBL",
  "Polk Audio",
  "Sonance",
  "GoldenEar",
];

const avBrands = [
  "Denon",
  "Yamaha",
  "Marantz",
  "Onkyo",
  "Arcam",
  "Pioneer",
  "Emotiva",
];

const projectorBrands = ["Epson", "BenQ", "Sony", "JVC", "Optoma"];

const services = [
  { value: "home-theater", label: "Home Theater", icon: Home },
  { value: "interior-work", label: "Interior Work", icon: Paintbrush },
  { value: "elevation-work", label: "Elevation Work", icon: Building2 },
  { value: "electrical-work", label: "Electrical Work", icon: Lightbulb },
  { value: "furniture-work", label: "Furniture Work", icon: Sofa },
];

/* â”€â”€ pill-style multi-select â”€â”€ */
function BrandPills({
  title,
  icon: Icon,
  options,
  selected,
  onToggle,
}: {
  title: string;
  icon: React.ElementType;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-amber-400" />
        <span className="text-xs font-semibold tracking-widest uppercase text-white/40">
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
              className={`text-xs px-3 py-1.5 rounded-sm border transition-all duration-200 ${
                active
                  ? "bg-amber-400 border-amber-400 text-black font-semibold"
                  : "border-white/15 text-white/50 hover:border-white/35 hover:text-white/80"
              }`}
            >
              {brand}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* â”€â”€ labelled input â”€â”€ */
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
    <div className="space-y-1.5">
      <label className="text-xs font-medium tracking-wide text-white/50 uppercase">
        {label}
        {required && <span className="text-amber-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-amber-400/60 focus:ring-0 rounded-sm h-11 text-sm";
const selectTriggerCls =
  "bg-white/[0.04] border-white/10 text-white focus:border-amber-400/60 rounded-sm h-11 text-sm [&>span]:text-white/60";

export default function ContactForm({ onClose }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    service: "",
    message: "",
    // home theater specific
    audioLayout: "",
    roomLength: "",
    roomWidth: "",
    roomHeight: "",
    screenSize: "",
    speakerBrands: [] as string[],
    avBrands: [] as string[],
    projectorBrands: [] as string[],
    // interior
    numberOfRooms: "",
  });

  const set = (key: string, val: unknown) =>
    setForm((p) => ({ ...p, [key]: val }));

  const toggleBrand = (
    key: "speakerBrands" | "avBrands" | "projectorBrands",
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
        service: form.service,
        message: form.message,
        createdAt: Timestamp.now(),
      };

      if (form.service === "home-theater") {
        payload.audioLayout = form.audioLayout;
        payload.screenSize = form.screenSize;
        payload.speakerBrands = form.speakerBrands;
        payload.avBrands = form.avBrands;
        payload.projectorBrands = form.projectorBrands;
        if (form.roomLength || form.roomWidth || form.roomHeight) {
          payload.roomDimensions = {
            length: form.roomLength,
            width: form.roomWidth,
            height: form.roomHeight,
          };
        }
      }

      if (form.service === "interior-work" && form.numberOfRooms) {
        payload.numberOfRooms = form.numberOfRooms;
      }

      await addDoc(collection(db, "contact"), payload);
      setSubmitted(true);
      toast.success("Quote request submitted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit. Please try again.");
    }
    setLoading(false);
  };

  /* â”€â”€ Success state â”€â”€ */
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
          <CheckCircle2 className="text-amber-400" size={32} />
        </div>
        <div>
          <p className="text-white text-xl font-semibold">Quote Request Sent</p>
          <p className="text-white/40 text-sm mt-1 max-w-xs">
            We&#39;ll review your requirements and get back to you within 24
            hours.
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-2 text-xs tracking-widest uppercase text-amber-400 hover:text-amber-300 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  const isHT = form.service === "home-theater";

  return (
    <div className="bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.07] px-7 py-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-5 h-[1px] bg-amber-400" />
          <span className="text-amber-400 text-[0.65rem] tracking-[0.3em] uppercase font-medium">
            EPix Infra
          </span>
        </div>
        <h2 className="text-2xl font-semibold text-white">Get a Quote</h2>
        <p className="text-white/35 text-sm mt-1">
          Tell us about your project and we&#39;ll build a tailored proposal.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-7 py-6 space-y-7">
        {/* â”€â”€ Contact details â”€â”€ */}
        <div>
          <p className="text-[0.6rem] tracking-[0.3em] uppercase text-white/25 font-medium mb-4">
            Contact Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <Input
                name="name"
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
                name="email"
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
                name="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Your City / Location" required>
              <Input
                name="location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Mumbai, Delhiâ€¦"
                required
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* â”€â”€ Service â”€â”€ */}
        <div>
          <p className="text-[0.6rem] tracking-[0.3em] uppercase text-white/25 font-medium mb-4">
            Service Required
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {services.map(({ value, label, icon: Icon }) => {
              const active = form.service === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("service", value)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-sm border text-left transition-all duration-200 ${
                    active
                      ? "bg-amber-400/10 border-amber-400/50 text-white"
                      : "border-white/10 text-white/45 hover:border-white/25 hover:text-white/70"
                  }`}
                >
                  <Icon
                    size={15}
                    className={active ? "text-amber-400" : "text-white/30"}
                  />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* â”€â”€ Home Theater section â”€â”€ */}
        <AnimatePresence>
          {isHT && (
            <motion.div
              key="ht-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-6">
                {/* section divider */}
                <div className="flex items-center gap-3">
                  <Tv2 size={13} className="text-amber-400" />
                  <p className="text-[0.6rem] tracking-[0.3em] uppercase text-white/25 font-medium">
                    Home Theater Specifications
                  </p>
                  <span className="flex-1 h-[1px] bg-white/[0.06]" />
                </div>

                {/* Audio layout + Screen size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Audio Channel Layout">
                    <Select
                      value={form.audioLayout}
                      onValueChange={(v) => set("audioLayout", v)}
                    >
                      <SelectTrigger className={selectTriggerCls}>
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111] border-white/10 text-white">
                        {audioLayouts.map((l) => (
                          <SelectItem
                            key={l.value}
                            value={l.value}
                            className="text-white/70 focus:bg-amber-400/10 focus:text-amber-400"
                          >
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Screen / Projection Size">
                    <Select
                      value={form.screenSize}
                      onValueChange={(v) => set("screenSize", v)}
                    >
                      <SelectTrigger className={selectTriggerCls}>
                        <SelectValue placeholder="Select screen size" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111] border-white/10 text-white">
                        {[
                          'Up to 80"',
                          '80" â€“ 100"',
                          '100" â€“ 120"',
                          '120" â€“ 140"',
                          '140" â€“ 160"',
                          '160"+ (Reference)',
                        ].map((s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            className="text-white/70 focus:bg-amber-400/10 focus:text-amber-400"
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {/* Room dimensions */}
                <div>
                  <p className="text-xs text-white/30 mb-3">
                    Room Dimensions{" "}
                    <span className="text-white/20">(feet â€” optional)</span>
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {(["Length", "Width", "Height"] as const).map((dim) => (
                      <Field key={dim} label={dim}>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder={dim}
                          value={
                            form[`room${dim}` as keyof typeof form] as string
                          }
                          onChange={(e) => set(`room${dim}`, e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                    ))}
                  </div>
                </div>

                {/* Brand preferences */}
                <div className="space-y-5 p-4 border border-white/[0.07] rounded-sm bg-white/[0.02]">
                  <p className="text-[0.6rem] tracking-[0.3em] uppercase text-white/25 font-medium">
                    Preferred Brands{" "}
                    <span className="text-white/20 normal-case tracking-normal">
                      (optional â€” select all that apply)
                    </span>
                  </p>
                  <BrandPills
                    title="Speakers"
                    icon={Speaker}
                    options={speakerBrands}
                    selected={form.speakerBrands}
                    onToggle={(v) => toggleBrand("speakerBrands", v)}
                  />
                  <BrandPills
                    title="AV Receivers & Amplifiers"
                    icon={Cpu}
                    options={avBrands}
                    selected={form.avBrands}
                    onToggle={(v) => toggleBrand("avBrands", v)}
                  />
                  <BrandPills
                    title="Projectors"
                    icon={Tv2}
                    options={projectorBrands}
                    selected={form.projectorBrands}
                    onToggle={(v) => toggleBrand("projectorBrands", v)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* â”€â”€ Interior: number of rooms â”€â”€ */}
        <AnimatePresence>
          {form.service === "interior-work" && (
            <motion.div
              key="interior-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden"
            >
              <Field label="Number of Rooms" required>
                <Input
                  type="number"
                  min="1"
                  value={form.numberOfRooms}
                  onChange={(e) => set("numberOfRooms", e.target.value)}
                  placeholder="e.g. 4"
                  className={inputCls}
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        {/* â”€â”€ Project details â”€â”€ */}
        <Field label="Project Details" required>
          <Textarea
            name="message"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            required
            placeholder="Describe your vision, budget range, timeline, or anything relevantâ€¦"
            className={`${inputCls} min-h-[110px] resize-none h-auto py-3`}
          />
        </Field>

        {/* â”€â”€ Actions â”€â”€ */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white/60 text-xs tracking-widest uppercase transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !form.service}
            className="group relative overflow-hidden bg-amber-400 hover:bg-amber-300 disabled:bg-white/10 disabled:text-white/20 text-black text-xs font-semibold tracking-[0.18em] uppercase px-8 py-3.5 transition-all duration-300 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Submittingâ€¦
              </>
            ) : (
              <>
                <span>Submit Request</span>
                <ChevronRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
