"use client";

import { useEffect, useRef, useState } from "react";
import { feetAndInches, METRES_PER_FOOT, METRES_PER_INCH, type LengthUnit } from "@/lib/theater/measurements";
import styles from "./builder.module.css";

export default function LengthInput({ value, unit, label, min, max, onChange }: {
  value: number;
  unit: LengthUnit;
  label: string;
  min: number;
  max: number;
  onChange: (metres: number) => void;
}) {
  const parts = feetAndInches(value);
  const dirty = useRef(false);
  const [draft, setDraft] = useState({ main: unit === "ft" ? String(parts.feet) : value.toFixed(2), inches: String(parts.inches) });
  useEffect(() => {
    const next = feetAndInches(value);
    dirty.current = false;
    setDraft({ main: unit === "ft" ? String(next.feet) : value.toFixed(2), inches: String(next.inches) });
  }, [value, unit]);

  function commit() {
    if (!dirty.current) return;
    dirty.current = false;
    const metres = unit === "ft" ? Number(draft.main) * METRES_PER_FOOT + Number(draft.inches) * METRES_PER_INCH : Number(draft.main);
    if (!draft.main.trim() || (unit === "ft" && !draft.inches.trim()) || !Number.isFinite(metres)) {
      setDraft({ main: unit === "ft" ? String(parts.feet) : value.toFixed(2), inches: String(parts.inches) });
      return;
    }
    const bounded = Math.max(min, Math.min(max, metres));
    onChange(Number(bounded.toFixed(6)));
    // Keep the committed prop as the source of truth. A physical fit check may
    // reject this edit or accept a different safe value; never display a draft
    // as if it had been applied to the room.
    setDraft({ main: unit === "ft" ? String(parts.feet) : value.toFixed(2), inches: String(parts.inches) });
  }

  return <span className={styles.lengthInput} role="group" aria-label={`${label} exact measurement`}>
    <input aria-label={`${label} ${unit === "ft" ? "feet" : "metres"}`} type="number" min={unit === "ft" ? 0 : min} max={unit === "ft" ? Math.ceil(max / METRES_PER_FOOT) : max} step={unit === "ft" ? 1 : 0.05} inputMode={unit === "ft" ? "numeric" : "decimal"} value={draft.main} onChange={event => { dirty.current = true; setDraft(current => ({ ...current, main: event.target.value })); }} onBlur={commit} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} />
    <span>{unit}</span>
    {unit === "ft" && <><input aria-label={`${label} inches`} type="number" min={0} max={11} step={1} inputMode="numeric" value={draft.inches} onChange={event => { dirty.current = true; setDraft(current => ({ ...current, inches: event.target.value })); }} onBlur={commit} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} /><span>in</span></>}
  </span>;
}
