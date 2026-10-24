"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import * as Tabs from "@radix-ui/react-tabs";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronDown, X, Box, Check, ChevronRight, Download, Expand, Film, FolderOpen, Layers3, Lightbulb, Maximize2, Minus, Plus, RotateCcw, Ruler, Save, SlidersHorizontal, Sofa, Speaker, TriangleAlert, Volume2 } from "lucide-react";
import logo from "@/Images/logo_white.png";
import { calculateDesign, constrainObjectMove, fitSeatingLayout, rowMotionBounds, MIN_ROW_SPACING, SEATING_CLEARANCE, seatingPosition, type ObjectPosition, DEFAULT_DESIGN, NUMBER_LIMITS, parseSavedDesign, PRESETS, type CameraView, type TheaterDesign } from "./design";
import type { ViewportHandle } from "./TheaterViewport";
import styles from "./builder.module.css";
import { visualDesign } from "@/lib/theater/visual-design";
import { useTheaterSales } from "./useTheaterSales";
import SalesWorkspace, { EquipmentSlot, QuotationDock, SoundEquipment } from "./SalesWorkspace";
import { formatLength, lengthStep, METRES_PER_INCH, type LengthUnit } from "@/lib/theater/measurements";
import LengthInput from "./LengthInput";

const Viewport = dynamic(() => import("./TheaterViewport"), { ssr: false, loading: () => <div className={styles.loading}><strong>Opening the design studio…</strong></div> });
const STORAGE_KEY = "epix-theater-design-v1";
const UNITS_KEY = "epix-theater-length-unit";
const LENGTH_KEYS = new Set<NumericKey>(["width", "depth", "height", "distance", "rowSpacing", "riser", "aisleWidth"]);
const PANELS = [{ key: "room", label: "Room", icon: Ruler }, { key: "seating", label: "Seating", icon: Sofa }, { key: "screen", label: "Screen", icon: Film }, { key: "sound", label: "Sound", icon: Speaker }] as const;
type Panel = typeof PANELS[number]["key"];
type NumericKey = keyof typeof NUMBER_LIMITS;
function downloadFile(url: string, name: string) {
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
}

export default function TheaterBuilder() {
  const [design, setDesign] = useState<TheaterDesign>(() => fitSeatingLayout(DEFAULT_DESIGN).design ?? { ...DEFAULT_DESIGN });
  const studio = useTheaterSales(design, setDesign);
  const selectedProjector = studio.products.find(p => p.id === studio.equipment.slots.projector?.productId);
  const [reportImage, setReportImage] = useState("");
  const [selected, setSelected] = useState("");
  const [panel, setPanel] = useState<Panel>("room");
  const [view, setView] = useState<CameraView>("orbit");
  const [units, setUnits] = useState<LengthUnit>("ft");
  useEffect(() => {
    try { if (localStorage.getItem(UNITS_KEY) === "m") setUnits("m"); } catch { /* Feet remain the default when storage is unavailable. */ }
  }, []);
  function selectUnits(value: LengthUnit) {
    setUnits(value);
    try { localStorage.setItem(UNITS_KEY, value); } catch { /* Measurement controls still work without device storage. */ }
  }
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [layoutError, setLayoutError] = useState("");
  const [preset, setPreset] = useState("Cinema");
  const [exportedFile, setExportedFile] = useState<{ url: string; name: string } | null>(null);
  const viewportRef = useRef<ViewportHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!toolsRef.current?.contains(event.target as Node)) toolsRef.current?.removeAttribute("open"); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && toolsRef.current?.open) { toolsRef.current.open = false; toolsRef.current.querySelector("summary")?.focus(); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, []);
  const configuredDesign = useMemo(() => visualDesign(design,studio.equipment,studio.products),[design,studio.equipment,studio.products]);
  const calculated = calculateDesign(configuredDesign);
  const measurement = (value: number) => formatLength(value, units);
  function moveObject(id: string, position: ObjectPosition) {
    setDesign(current => { const constrained = constrainObjectMove(visualDesign(current,studio.equipment,studio.products), id, position); return constrained ? { ...current, ...(id === "row-0" ? { distance: constrained[2] } : {}), positions: { ...current.positions, [id]: constrained } } : current; });
    setPreset(""); setExportedFile(null); setNotice("");
  }
  function applyLayout(candidate: TheaterDesign) {
    const fitted = fitSeatingLayout(visualDesign(candidate, studio.equipment, studio.products));
    if (!fitted.design) { setLayoutError(fitted.reason); setNotice(fitted.reason); return false; }
    setDesign({ ...candidate, positions: fitted.design.positions, rowSpacing: fitted.design.rowSpacing });
    setLayoutError(""); setNotice(""); setExportedFile(null); return true;
  }
  const selectionPosition = selected.startsWith("row-") ? seatingPosition(design, Number(selected.slice(4))) : selected === "projector" ? calculated.projector : calculated.sound.speakers.find(s => s.id === selected)?.position;
  const selectedVisible = selected.startsWith("row-") ? Number(selected.slice(4)) < design.rows : selected === "projector" ? design.display === "projector" : Boolean(selectionPosition);
  const throwFits = Math.max(0.22, calculated.minThrow) <= Math.min(design.depth - 0.22, calculated.maxThrow);
  const selectedBounds = selected.startsWith("row-") ? rowMotionBounds(configuredDesign, Number(selected.slice(4))) : {
    min: throwFits ? Math.max(0.22, calculated.minThrow) : 0.22,
    max: throwFits ? Math.min(design.depth - 0.22, calculated.maxThrow) : design.depth - 0.22,
    valid: throwFits, reason: "No valid lens throw range in this room. Movement is limited to the room; change the screen size or projector.",
  };
  function change<K extends keyof TheaterDesign>(key: K, value: TheaterDesign[K]) {
      const positions = { ...design.positions };
      if (key === "rowSpacing") for (const id of Object.keys(positions)) if (id.startsWith("row-") && id !== "row-0") delete positions[id];
      if (key === "rows") for (const id of Object.keys(positions)) if (id.startsWith("row-") && Number(id.slice(4)) >= Number(value)) delete positions[id];
      const candidate = { ...design, positions, ...(key === "rowSpacing" ? { distance: calculated.viewingDistance } : {}), [key]: value, ...(key === "display" && value === "tv" ? { aspect: "16:9" as const } : {}) };
      const geometric = ["width", "depth", "height", "seats", "rows", "rowSpacing", "riser", "aisle", "aisleWidth", "diagonal", "aspect", "display", "audio", "front", "throwMin", "throwMax"].includes(key);
      if (geometric) { if (!applyLayout(candidate)) return; }
      else { setDesign(candidate); setNotice(""); setExportedFile(null); }
      setPreset("");
  }
  function range(key: NumericKey, label: string, step = 0.05, format: (value: number) => string = measurement) {
    let [min, max]: [number, number] = [...NUMBER_LIMITS[key]];
    if (key === "distance") { const bounds = rowMotionBounds(configuredDesign, 0); min = bounds.min; max = bounds.max; }
    if (key === "rowSpacing") { min = MIN_ROW_SPACING; max = design.depth - 1.9; }
    const value = key === "distance" ? calculated.viewingDistance : key === "rowSpacing" ? seatingPosition(configuredDesign, 1)[2] - seatingPosition(configuredDesign, 0)[2] : design[key];
    const update = (next: number) => {
      if (key === "distance") {
        const row = seatingPosition(configuredDesign, 0);
        moveObject("row-0", [row[0], row[1], next]);
      } else change(key, next);
    };
    const isLength = LENGTH_KEYS.has(key);
    if (isLength) step = lengthStep(units);
    const imperial = isLength && units === "ft";
    const sliderMin = imperial ? Math.ceil((min - 1e-6) / METRES_PER_INCH) : min;
    const sliderMax = Math.max(sliderMin, imperial ? Math.floor((max + 1e-6) / METRES_PER_INCH) : max);
    const sliderValue = imperial ? Math.max(sliderMin, Math.min(sliderMax, Math.round(value / METRES_PER_INCH))) : value;
    return <div className={styles.field}>
      <div className={styles.fieldLabel}><label htmlFor={`theater-${key}`}>{label}</label>{isLength ? <LengthInput value={value} unit={units} label={label} min={min} max={max} onChange={update} /> : <output htmlFor={`theater-${key}`}>{format(value)}</output>}</div>
      <div className={styles.rangeControl}><button aria-label={`Decrease ${label.toLowerCase()}`} disabled={value <= min + 1e-6} onClick={() => update(Math.max(min, Number((value - step).toFixed(6))))}><Minus size={13} /></button><input disabled={sliderMax === sliderMin} style={{ "--range-fill": `${sliderMax === sliderMin ? 0 : (sliderValue - sliderMin) / (sliderMax - sliderMin) * 100}%` } as CSSProperties} id={`theater-${key}`} type="range" min={sliderMin} max={sliderMax} step={imperial ? 1 : step} value={sliderValue} aria-valuetext={format(value)} onChange={event => update(Number((Number(event.target.value) * (imperial ? METRES_PER_INCH : 1)).toFixed(6)))} /><button aria-label={`Increase ${label.toLowerCase()}`} disabled={value >= max - 1e-6} onClick={() => update(Math.min(max, Number((value + step).toFixed(6))))}><Plus size={13} /></button></div>
      <div className={styles.rangeEnds}><span>{format(min)}</span><span>{format(max)}</span></div>
      {key === "distance" && <p className={styles.infoNote}>Safe track for row 1. Other rows stay still; move a rear row back to make more space.</p>}
    </div>;
  }
  function selectWallColor(color: string) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;
    setDesign(current => current.finish === "custom" && current.wallColor === color ? current : { ...current, finish: "custom", wallColor: color });
    setPreset(""); setExportedFile(null); setNotice("");
  }
  function choices<T extends keyof TheaterDesign>(key: T, label: string, items: { value: TheaterDesign[T]; label: string }[]) {
    return <fieldset className={styles.choiceField}><legend>{label}</legend><div className={styles.segmented}>
      {items.map(item => <button key={String(item.value)} aria-pressed={design[key] === item.value} onClick={() => change(key, item.value)}>{item.label}</button>)}
    </div></fieldset>;
  }
  function numeric(key: NumericKey, label: string, step: number) {
    const [min, max] = NUMBER_LIMITS[key];
    return <label className={styles.numberField}>{label}<input type="number" min={min} max={max} step={step} value={design[key]} onChange={event => {
      const value = Number(event.target.value);
      if (Number.isFinite(value) && value >= min && value <= max) change(key, value);
    }} /></label>;
  }
  function save() {
    studio.saveDevice();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, design })); setNotice("Design saved on this device."); }
    catch { setNotice("Your browser could not save this design. Download the plan instead."); }
  }
  function load() {
    try {
      if (studio.loadDevice()) { setPreset(""); setNotice("Design and equipment restored."); return; }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) { setNotice("No saved design yet. Choose Save on device to keep this plan on your device."); return; }
      if (applyLayout(parseSavedDesign(saved))) { setPreset(""); setNotice("Your saved design is restored with safe seating clearances."); }
    } catch (error) { setNotice(`This saved design could not be restored. ${(error as Error).message}`); }
  }
  function exportPlan() {
    const plan = { version: 1, name: "Epix Infra — My home theatre", savedAt: new Date().toISOString(), units: "metres", displayUnits: units, design, specifications: calculated, assumptions: "Concept layout; generic projector inputs and seat-aware geometric speaker positions. Equipment and installation dimensions require an installer review." };
    const url = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(plan, null, 2))}`;
    setExportedFile({ url, name: "Epix-Home-Theatre-Plan.json" });
    downloadFile(url, "Epix-Home-Theatre-Plan.json");
    setNotice("Your plan and calculated specifications are ready.");
  }
  function snapshot() {
    try { const image = viewportRef.current?.capture(); if (image) { setExportedFile({ url: image, name: "Epix-Home-Theatre.png" }); downloadFile(image, "Epix-Home-Theatre.png"); setNotice("Your cinema preview is ready."); } }
    catch { setNotice("The image could not be exported. Try downloading the plan."); }
  }
  function toggle(key: "lights" | "dimensions" | "coverage", icon: ReactNode, label: string) {
    return <button aria-label={label} title={label} aria-pressed={design[key]} onClick={() => change(key, !design[key])}>{icon}<span>{label}</span></button>;
  }

  return <main className={styles.app}>
    <header className={styles.header}>
      <Link href="/" className={styles.logo}><Image src={logo} width={119} height={42} alt="Epix Infra" priority /></Link>
      <div className={styles.headerDivider} />
      <h1 className={styles.studioTitle}>Home theatre <strong>Design studio</strong></h1>

      <Link href="/" className={`${styles.backLink} ${styles.siteLink}`}><ArrowLeft size={15} /> Back to Epix</Link>
      <Link className={styles.backLink} title={studio.member?.displayName} href={studio.member ? "/home-theater-builder/dashboard" : "/home-theater-builder/login"}>{studio.member ? "Dashboard" : "Team sign in"}</Link>
      <details ref={toolsRef} className={styles.toolsMenu}>
        <summary aria-label="Design tools"><SlidersHorizontal size={16} /><span>Design tools</span><ChevronDown size={14} /></summary>
        <div className={styles.toolsContent} onClick={event => { if ((event.target as HTMLElement).closest("button")) toolsRef.current?.removeAttribute("open"); }}>
          <button onClick={load}><FolderOpen size={16} />Load saved design</button>
          <button disabled={!ready} onClick={snapshot}><Maximize2 size={16} />Save image</button>
          <button disabled={!ready} onClick={() => { setReportImage(viewportRef.current?.capture() ?? ""); requestAnimationFrame(() => requestAnimationFrame(() => window.print())); }}><Download size={16} />Print design report</button>
          <button onClick={exportPlan}><Download size={16} />Download editable backup (.json)</button>
          <button onClick={() => { if (!applyLayout({ ...DEFAULT_DESIGN })) return; setView("orbit"); viewportRef.current?.resetCamera(); setPreset("Cinema"); setNotice("The Cinema layout has been reset."); }}><RotateCcw size={16} />Reset layout</button>
        </div>
      </details>
      <button className={styles.saveButton} onClick={save}><Save size={16} /> Save on device</button>
    </header>
    <div className={styles.workspace}>
      <section className={styles.stageColumn} aria-label="Your theatre preview">
        <div className={styles.canvasToolbar} aria-label="Preview controls">
          <div className={styles.viewerTools}>
            <div className={styles.toolGroup}>
              {toggle("dimensions", <Ruler size={18} />, "Dimensions")}
              {toggle("lights", <Lightbulb size={18} />, "Lights")}
              {toggle("coverage", <Volume2 size={18} />, "Coverage")}
            </div>
            <div className={styles.toolGroup} aria-label="Camera views">
              {[{ value: "orbit", label: "3D view", icon: Box }, { value: "plan", label: "Top view", icon: Layers3 }, { value: "seat", label: "Seat view", icon: Sofa }].map(item => <button key={item.value} title={item.label} aria-label={item.label} aria-pressed={view === item.value} onClick={() => setView(item.value as CameraView)}><item.icon size={18} /><span>{item.label}</span></button>)}
            </div>
          </div>
          <label className={styles.mobileView}><span>View</span><select aria-label="Camera view" value={view} onChange={event => setView(event.target.value as CameraView)}><option value="orbit">3D view</option><option value="plan">Top view</option><option value="seat">Seat view</option></select></label>
          <div className={styles.zoomTools}><button aria-label="Zoom out" title="Zoom out" disabled={!ready} onClick={() => viewportRef.current?.zoom(-1)}><Minus size={18} /></button><button aria-label="Zoom in" title="Zoom in" disabled={!ready} onClick={() => viewportRef.current?.zoom(1)}><Plus size={18} /></button><button aria-label="Fullscreen preview" title="Fullscreen preview" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void stageRef.current?.requestFullscreen().catch(() => setNotice("Fullscreen is not available in this browser.")); }}><Expand size={17} /></button></div>
        </div>
        <div className={styles.stage} ref={stageRef} data-lights={design.lights} data-invalid={calculated.warnings.length > 0}>
          <Viewport ref={viewportRef} design={configuredDesign} view={view} units={units} onReady={setReady} onObjectMove={moveObject} onSelect={setSelected} />
          <div className={styles.stageHeading}><span className={styles.liveDot} /><strong>Your cinema, in perspective</strong><span>{measurement(design.width)} × {measurement(design.depth)}</span></div>
          {calculated.warnings.length > 0 && <div className={styles.sceneWarning} role="status"><TriangleAlert size={14} />{calculated.warnings.length} layout {calculated.warnings.length === 1 ? "issue" : "issues"} — review layout checks</div>}
          <div className={styles.sceneTag}>{view === "orbit" ? "3D cutaway" : view === "plan" ? "Overhead plan" : "Primary seat"}{design.coverage && <span> · Illustrative coverage</span>}</div>
          <div className={styles.stageHelp}>{view === "orbit" ? "Drag seats / projector along track · Empty space to orbit" : view === "plan" ? "Drag seats / projector along track · Empty space to pan" : "The view from your first-row centre seat"}</div>
        </div>
        <div className={styles.metrics} aria-label="Calculated theatre specifications">
          <div><span>Seating capacity</span><strong>{calculated.totalSeats}<small> seats</small></strong></div>
          <div><span>Screen diagonal</span><strong>{design.diagonal}<small> inches</small></strong></div>
          <div><span>Viewing angle</span><strong>{calculated.angle.toFixed(1)}<small>°</small></strong></div>
          <div><span>Sound layout</span><strong>{design.audio}<small> channels</small></strong></div>
        </div>
        <details className={styles.fitDetails}>
          <summary>{calculated.warnings.length ? <TriangleAlert size={16} /> : <Check size={16} />}<span>{calculated.warnings.length ? `${calculated.warnings.length} layout checks to review` : "Layout fit checks passed"}</span><ChevronDown size={14} /></summary>
          <div className={styles.layoutStatus} role="status">{calculated.warnings.length ? calculated.warnings.map(warning => <p key={warning}>{warning}</p>) : <p>Concept fit checks only. Epix’s team can refine the equipment, sightlines and installation.</p>}</div>
        </details>
      </section>
      <Tabs.Root value={panel} onValueChange={value => setPanel(value as Panel)} asChild><aside className={styles.sidebar} aria-label="Theatre configuration">
        <div className={styles.panelTitle}><SlidersHorizontal size={17} /><h2>Build your theatre</h2><span>{PANELS.findIndex(item => item.key === panel) + 1} / 4</span></div>
        <Tabs.List className={styles.tabs} aria-label="Configuration steps">{PANELS.map(item => <Tabs.Trigger key={item.key} value={item.key}><item.icon size={18} /><span>{item.label}</span></Tabs.Trigger>)}</Tabs.List>
        <Tabs.Content value={panel} className={styles.panelBody} key={panel}>
        {selected && selectedVisible && selectionPosition && <div className={styles.objectInspector} aria-label="Selected object position">
          <button className={styles.inspectorClose} aria-label="Deselect object" onClick={() => setSelected("")}><X size={16} /></button><strong>{selected.startsWith("row-") ? `Seating row ${Number(selected.slice(4)) + 1}` : selected === "projector" ? "Projector" : `${selected} speaker`}</strong>
          <span>Forward / backward · {units === "ft" ? "feet & inches" : "metres"}</span>
          <span>From front wall</span><LengthInput value={selectionPosition[2] + design.depth / 2} unit={units} label="From front wall" min={selectedBounds.min} max={Math.max(selectedBounds.min, selectedBounds.max)} onChange={value => moveObject(selected, [selectionPosition[0], selectionPosition[1], value])} />
          <span>{selectedBounds.valid ? `Safe track: ${measurement(selectedBounds.min)} – ${measurement(Math.max(selectedBounds.min, selectedBounds.max))}` : selectedBounds.reason}</span>
          <button onClick={() => { const automatic = calculateDesign({ ...configuredDesign, positions: {} }); moveObject(selected, [0, 0, selected === "projector" ? automatic.projector[2] + design.depth / 2 : design.distance + Number(selected.slice(4)) * design.rowSpacing]); }}>Auto-place selected</button>
          <button onClick={() => applyLayout({ ...design, positions: {} })}>Auto-place all</button>
        </div>}

          {layoutError && <div className={styles.constraintError} role="alert"><TriangleAlert size={17} /><div><strong>That change will not fit.</strong><p>{layoutError}</p></div><button aria-label="Dismiss layout message" onClick={() => setLayoutError("")}>×</button></div>}
          {panel === "room" && <>
            <div className={styles.sectionLead}><h3>Start with your space.</h3><p>Set the dimensions of your room. The layout adjusts as you explore.</p></div>
            <div className={styles.unitRow}><span>Measurements</span><div className={styles.segmented}><button aria-pressed={units === "ft"} onClick={() => selectUnits("ft")}>Feet & inches</button><button aria-pressed={units === "m"} onClick={() => selectUnits("m")}>Metres</button></div></div>
            {range("width", "Room width")}{range("depth", "Room depth")}{range("height", "Ceiling height")}
            <fieldset className={styles.finishField}><legend>Wall finish</legend><div>
              {[{ value: "graphite", name: "Graphite", color: "#373e47" }, { value: "walnut", name: "Walnut", color: "#73543e" }, { value: "midnight", name: "Midnight", color: "#244260" }].map(finish => <button key={finish.value} aria-pressed={design.finish === finish.value} onClick={() => change("finish", finish.value as TheaterDesign["finish"])}><span style={{ background: finish.color }}>{design.finish === finish.value && <Check size={16} />}</span>{finish.name}</button>)}
              <label className={styles.customFinish} data-selected={design.finish === "custom"}>
                <span style={{ background: design.finish === "custom" ? design.wallColor : "conic-gradient(#ed5757,#e7d84d,#64c66c,#5ec4d9,#8564d9,#ed5757)" }}>
                  <input type="color" aria-label="Custom room colour" value={design.wallColor ?? "#596978"} onClick={event => selectWallColor(event.currentTarget.value)} onInput={event => selectWallColor(event.currentTarget.value)} onChange={event => selectWallColor(event.currentTarget.value)} />
                  {design.finish === "custom" && <Check size={16} />}
                </span>Custom
              </label>
            </div>{design.finish === "custom" && <p className={styles.colorValue}>Your colour <strong>{design.wallColor?.toUpperCase()}</strong> · updates live</p>}</fieldset>
            <div className={styles.presetHeader}>Or start with a layout</div><div className={styles.presets}>{PRESETS.map(item => <button key={item.name} aria-pressed={preset === item.name} onClick={() => { if (applyLayout({ ...DEFAULT_DESIGN, ...item.values })) setPreset(item.name); }}><strong>{item.name}</strong><span>{item.description}</span>{preset === item.name ? <Check size={16} /> : <ChevronRight size={16} />}</button>)}</div>
          </>}
          {panel === "seating" && <>
            <div className={styles.sectionLead}><h3>The best seats in the house.</h3><p>Configure real recliner rows and leave room to settle in.</p></div>
            {range("seats", "Seats per row", 1, String)}{range("rows", "Rows of seats", 1, String)}
            {range("distance", "Screen to primary seat")}
            {design.rows > 1 && <>{range("rowSpacing", "Distance between rows")}{range("riser", "Riser height per row", 0.05)}</>}
            {choices("aisle", "Aisle position", [{ value: "left", label: "Left" }, { value: "both", label: "Both sides" }, { value: "right", label: "Right" }])}
            {range("aisleWidth", "Aisle width")}
            <div className={styles.resultCard}><span>Live seating feedback</span><strong>{calculated.angle.toFixed(1)}° viewing angle</strong><span>Clearance behind last row</span><strong>{measurement(design.depth - calculated.rearExtent)}</strong></div>
            <button className={styles.coverageButton} onClick={() => { setView("plan"); change("coverage", true); }}><Sofa size={20} /><span><strong>Position seats in the plan</strong><small>Slide seats forward and backward along the room</small></span><ChevronRight size={16} /></button>
            <div className={styles.infoNote}>Rows slide forward and backward only. Moving the first row adjusts only its side surround speakers. All ceiling speakers, front speakers, rear speakers, subwoofers, other rows and the projector stay in place. Aisle settings determine sideways position.</div>
            <div className={styles.infoNote}>Hard stops preserve row order, at least {measurement(SEATING_CLEARANCE.betweenRows)} between the demo recliner footprints and {measurement(SEATING_CLEARANCE.rear)} behind the last row. Screen and cabinet clearances can shorten each track. These defaults use the demo chair dimensions; final recline space needs the chosen seating specifications.</div>
          </>}
          {panel === "screen" && <>
            <div className={styles.sectionLead}><h3>A bigger picture.</h3><p>Choose your display and explore the view from your seat.</p></div>
            {choices("display", "Display type", [{ value: "projector", label: "Projector" }, { value: "tv", label: "Flat-panel TV" }])}
            {choices("aspect", "Screen aspect ratio", design.display === "tv" ? [{ value: "16:9", label: "16:9 widescreen" }] : [{ value: "16:9", label: "16:9" }, { value: "2.4:1", label: "2.4:1 cinema" }])}
            {range("diagonal", "Screen diagonal", 1, value => `${value}″`)}
            <div className={styles.resultCard}><span>Image dimensions</span><strong>{measurement(calculated.screen.width)} × {measurement(calculated.screen.height)}</strong><span>Horizontal viewing angle</span><strong>{calculated.angle.toFixed(1)}°</strong></div>
            {design.display === "projector" && <>
              <EquipmentSlot studio={studio} slot="projector" />
              <div className={styles.assumptionTitle}>{selectedProjector ? `${selectedProjector.brand} ${selectedProjector.model} · projection inputs` : "Generic projector assumptions"}</div>
              {selectedProjector?.specs.throwMin ? <><div className={styles.resultCard}><span>Manufacturer light output</span><strong>{selectedProjector.specs.lumens?.toLocaleString("en-IN")} lm</strong><span>Lens throw ratio</span><strong>{selectedProjector.specs.throwMin} – {selectedProjector.specs.throwMax}</strong></div>{numeric("gain", "Screen gain", 0.1)}</> : <div className={styles.numberGrid}>{numeric("lumens", "Light output (lm)", 100)}{numeric("gain", "Screen gain", 0.1)}{numeric("throwMin", "Min. throw ratio", 0.05)}{numeric("throwMax", "Max. throw ratio", 0.05)}</div>}
              <div className={styles.resultCard}><span>Lens-to-screen range</span><strong>{measurement(calculated.minThrow)} – {measurement(calculated.maxThrow)}</strong><span>Estimated screen brightness</span><strong>{calculated.nits.toFixed(0)} <small>nits</small></strong></div>
              <div className={styles.infoNote}>An idealized estimate using light output, screen area and gain. It does not predict HDR performance or room lighting.</div>
            </>}
          </>}
          {panel === "sound" && <>
            <div className={styles.sectionLead}><h3>Surrounded by possibility.</h3><p>Explore speaker layouts around your primary listening seat.</p></div>
            {choices("audio", "Speaker layout", [{ value: "5.1", label: "5.1" }, { value: "5.1.2", label: "5.1.2" }, { value: "7.2.4", label: "7.2.4" }])}
            <div className={styles.infoNote}>{design.audio === "7.2.4" ? "7 ear-level speakers · 2 subwoofers · 4 overhead speakers" : design.audio === "5.1.2" ? "5 ear-level speakers · 1 subwoofer · 2 overhead speakers" : "5 ear-level speakers · 1 subwoofer"}</div>
            <SoundEquipment studio={studio} />
            {choices("front", "Front left & right speakers", [{ value: "tower", label: "Floorstanding" }, { value: "in-wall", label: "In-wall" }])}
            <button className={styles.coverageButton} aria-pressed={design.coverage} onClick={() => change("coverage", !design.coverage)}><Volume2 size={20} /><span><strong>{design.coverage ? "Hide" : "Show"} speaker coverage</strong><small>Explore the illustrative sound paths</small></span><ChevronRight size={16} /></button>
            <div className={styles.resultCard}><span>Equipment in the scene</span><strong>{calculated.speakerCount} speakers & subs</strong><span>Listening position</span><strong>First row · centre{design.positions?.["row-0"] ? " (moved)" : ""}</strong></div>
            <div className={styles.acousticSummary}><span className={styles.liveDot} /> Seat-aware placement · live</div>
            <div className={styles.speakerTable}><table><caption>Calculated speaker alignment</caption><thead><tr><th scope="col">Channel</th><th scope="col">Angle</th><th scope="col">Distance</th><th scope="col">Delay</th></tr></thead><tbody>{calculated.sound.speakers.filter(s => s.model !== "sub").map(s => <tr key={s.id}><th scope="row">{s.id}{s.constrained ? " *" : ""}</th><td>{Math.abs(s.azimuth).toFixed(0)}°</td><td>{measurement(s.distance)}</td><td>{s.delayMs.toFixed(1)} ms</td></tr>)}</tbody></table></div>
            <div className={styles.infoNote}>Angles are measured from the screen axis. * Room-limited position. Delay is the extra geometric delay relative to the farthest main speaker at 343 m/s; actual calibration needs measurements. Subwoofer phase, reflections and sound pressure are not simulated. <a href="https://www.dolby.com/about/support/guide/speaker-setup-guides/7.1.4-overhead-speaker-setup-guide" target="_blank" rel="noreferrer">Placement reference: Dolby</a></div>
          </>}
        </Tabs.Content>
        <div className={styles.panelFooter}>
          {panel !== "sound" ? <button className={styles.primaryButton} onClick={() => setPanel(PANELS[PANELS.findIndex(item => item.key === panel) + 1].key)}>Next: {PANELS[PANELS.findIndex(item => item.key === panel) + 1].label}<ArrowUpRight size={17} /></button> : <button className={styles.primaryButton} onClick={save}>Save on device<Save size={17} /></button>}

        </div>
        <QuotationDock studio={studio} />
      </aside></Tabs.Root>
    </div>
    <SalesWorkspace studio={studio} units={units} capture={() => {
      viewportRef.current?.capture();const canvas=stageRef.current?.querySelector("canvas");if(!canvas||!ready)return "";
      try { const copy=document.createElement("canvas");copy.width=1000;copy.height=Math.round(canvas.height/canvas.width*1000);copy.getContext("2d")?.drawImage(canvas,0,0,copy.width,copy.height);return copy.toDataURL("image/jpeg",.82); } catch {return "";}
    }} />
    <section className={styles.printReport} aria-label="Printable design report">
      <h1>EPIX INFRA — Home theatre design</h1><p>Concept design · {new Date().toLocaleDateString("en-IN")}</p>
      {reportImage && <img src={reportImage} alt="Your theatre layout" />}
      <h2>Room and seating</h2><p>{measurement(design.width)} wide × {measurement(design.depth)} deep × {measurement(design.height)} high</p><p>{design.rows} rows · {design.seats} seats per row · {calculated.totalSeats} seats</p>
      <h2>Display and sound</h2><p>{design.display === "tv" ? "TV" : "Projector"} · {design.diagonal} inch screen · {design.aspect} · {calculated.angle.toFixed(1)}° viewing angle</p><p>Image: {measurement(calculated.screen.width)} × {measurement(calculated.screen.height)} · Sound: {design.audio}</p>
      <table><thead><tr><th>Channel</th><th>Distance to listener</th><th>Alignment delay</th></tr></thead><tbody>{calculated.sound.speakers.filter(s=>s.model!=="sub").map(s=><tr key={s.id}><td>{s.id}</td><td>{measurement(s.distance)}</td><td>{s.delayMs.toFixed(1)} ms</td></tr>)}</tbody></table>
      <h2>Layout review</h2>{calculated.warnings.length ? <ul>{calculated.warnings.map(w=><li key={w}>{w}</li>)}</ul> : <p>Passes the concept fit checks.</p>}
      <p>Illustrative equipment dimensions and geometric sound estimates. Final installation, clearances and calibration require an Epix site survey.</p>
    </section>
    <div className={styles.notice} aria-live="polite">{notice}{exportedFile && <a href={exportedFile.url} download={exportedFile.name}>Download file</a>}{notice && <button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={14} /></button>}</div>

  </main>;
}
