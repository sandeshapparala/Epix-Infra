"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Box, Check, ChevronRight, Download, Expand, Film, FolderOpen, Layers3, Lightbulb, Maximize2, Minus, Plus, RotateCcw, Ruler, Save, SlidersHorizontal, Sofa, Speaker, TriangleAlert, Volume2 } from "lucide-react";
import logo from "@/Images/logo_white.png";
import { calculateDesign, constrainObjectMove, seatingPosition, type ObjectPosition, DEFAULT_DESIGN, NUMBER_LIMITS, parseSavedDesign, PRESETS, type CameraView, type TheaterDesign } from "./design";
import type { ViewportHandle } from "./TheaterViewport";
import styles from "./builder.module.css";

const Viewport = dynamic(() => import("./TheaterViewport"), { ssr: false, loading: () => <div className={styles.loading}><strong>Opening the design studio…</strong></div> });
const STORAGE_KEY = "epix-theater-design-v1";
const PANELS = [{ key: "room", label: "Room", icon: Ruler }, { key: "seating", label: "Seating", icon: Sofa }, { key: "screen", label: "Screen", icon: Film }, { key: "sound", label: "Sound", icon: Speaker }] as const;
type Panel = typeof PANELS[number]["key"];
type NumericKey = keyof typeof NUMBER_LIMITS;
function downloadFile(url: string, name: string) {
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
}

export default function TheaterBuilder() {
  const [design, setDesign] = useState<TheaterDesign>({ ...DEFAULT_DESIGN });
  const [reportImage, setReportImage] = useState("");
  const [selected, setSelected] = useState("");
  const [panel, setPanel] = useState<Panel>("room");
  const [view, setView] = useState<CameraView>("orbit");
  const [units, setUnits] = useState<"m" | "ft">("m");
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [preset, setPreset] = useState("Cinema");
  const [exportedFile, setExportedFile] = useState<{ url: string; name: string } | null>(null);
  const viewportRef = useRef<ViewportHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const calculated = calculateDesign(design);
  const measurement = (value: number) => units === "m" ? `${value.toFixed(2)} m` : `${(value / 0.3048).toFixed(1)} ft`;
  function moveObject(id: string, position: ObjectPosition) {
    setDesign(current => { const constrained = constrainObjectMove(current, id, position); return constrained ? { ...current, positions: { ...current.positions, [id]: constrained } } : current; });
    setPreset(""); setExportedFile(null); setNotice("");
  }
  const selectionPosition = selected.startsWith("row-") ? seatingPosition(design, Number(selected.slice(4))) : selected === "projector" ? calculated.projector : calculated.sound.speakers.find(s => s.id === selected)?.position;
  const selectedVisible = selected.startsWith("row-") ? Number(selected.slice(4)) < design.rows : selected === "projector" ? design.display === "projector" : Boolean(selectionPosition);
  function change<K extends keyof TheaterDesign>(key: K, value: TheaterDesign[K]) {
    setDesign(current => {
      const positions = { ...current.positions };
      if (["distance", "rowSpacing", "riser", "aisle", "aisleWidth"].includes(key)) for (const id of Object.keys(positions)) if (id.startsWith("row-")) delete positions[id];
      if (key === "rows") for (const id of Object.keys(positions)) if (id.startsWith("row-") && Number(id.slice(4)) >= Number(value)) delete positions[id];
      return ({ ...current, positions, [key]: value, ...(key === "display" && value === "tv" ? { aspect: "16:9" as const } : {}) }); }); setPreset(""); setNotice(""); setExportedFile(null);
  }
  function range(key: NumericKey, label: string, step = 0.05, format: (value: number) => string = measurement) {
    const [min, max] = NUMBER_LIMITS[key];
    return <div className={styles.field}>
      <div className={styles.fieldLabel}><label htmlFor={`theater-${key}`}>{label}</label><output htmlFor={`theater-${key}`}>{format(design[key])}</output></div>
      <div className={styles.rangeControl}><button aria-label={`Decrease ${label.toLowerCase()}`} disabled={design[key] <= min} onClick={() => change(key, Math.max(min, Number((design[key] - step).toFixed(3))))}><Minus size={13} /></button><input style={{ "--range-fill": `${(design[key] - min) / (max - min) * 100}%` } as CSSProperties} id={`theater-${key}`} type="range" min={min} max={max} step={step} value={design[key]} aria-valuetext={format(design[key])} onChange={event => change(key, Number(event.target.value))} /><button aria-label={`Increase ${label.toLowerCase()}`} disabled={design[key] >= max} onClick={() => change(key, Math.min(max, Number((design[key] + step).toFixed(3))))}><Plus size={13} /></button></div>
      <div className={styles.rangeEnds}><span>{format(min)}</span><span>{format(max)}</span></div>
    </div>;
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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, design })); setNotice("Design saved on this device."); }
    catch { setNotice("Your browser could not save this design. Download the plan instead."); }
  }
  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) { setNotice("No saved design yet. Choose Save on device to keep this plan on your device."); return; }
      setDesign(parseSavedDesign(saved)); setPreset(""); setNotice("Your saved design is restored.");
    } catch { setNotice("This saved design could not be restored. Your current layout is unchanged."); }
  }
  function exportPlan() {
    const plan = { version: 1, name: "Epix Infra — My home theatre", savedAt: new Date().toISOString(), units: "metres", design, specifications: calculated, assumptions: "Concept layout; generic projector inputs and seat-aware geometric speaker positions. Equipment and installation dimensions require an installer review." };
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
      <span className={styles.studioTitle}>Home theatre <strong>design studio</strong></span>
      <span className={styles.demoTag}>Interactive demo</span>
      <Link href="/" className={styles.backLink}><ArrowLeft size={15} /> Back to Epix</Link>
      <button className={styles.saveButton} onClick={save}><Save size={16} /> Save on device</button>
    </header>
    <div className={styles.intro}>
      <div><p className={styles.eyebrow}>YOUR SPACE. YOUR SCREEN. YOUR CINEMA.</p><h1>Make room for <em>cinema.</em></h1></div>
      <p>Shape your space. Find your perfect seat.<br />See the whole experience come together in 3D.</p>
    </div>
    <div className={styles.workspace}>
      <section className={styles.stageColumn} aria-label="Your theatre preview">
        <div className={styles.stage} ref={stageRef} data-lights={design.lights} data-invalid={calculated.warnings.length > 0}>
          <Viewport ref={viewportRef} design={design} view={view} onReady={setReady} onObjectMove={moveObject} onSelect={setSelected} />
          <div className={styles.stageHeading}><span className={styles.liveDot} /><strong>Your cinema, in perspective</strong><span>{design.width.toFixed(1)} × {design.depth.toFixed(1)} m</span></div>
          {calculated.warnings.length > 0 && <div className={styles.sceneWarning} role="status"><TriangleAlert size={14} />{calculated.warnings.length} layout {calculated.warnings.length === 1 ? "issue" : "issues"} — review below</div>}
          <div className={styles.sceneTag}>{view === "orbit" ? "3D cutaway" : view === "plan" ? "Overhead plan" : "Primary seat"}{design.coverage && <span> · Illustrative coverage</span>}</div>
          <div className={styles.viewerTools}>
            <div className={styles.toolGroup}>
              {toggle("dimensions", <Ruler size={18} />, "Dimensions")}
              {toggle("lights", <Lightbulb size={18} />, "Lights")}
              {toggle("coverage", <Volume2 size={18} />, "Coverage")}
            </div>
            <div className={styles.toolGroup}>
              {[{ value: "orbit", label: "3D view", icon: Box }, { value: "plan", label: "Top view", icon: Layers3 }, { value: "seat", label: "Seat view", icon: Sofa }].map(item => <button key={item.value} title={item.label} aria-label={item.label} aria-pressed={view === item.value} onClick={() => setView(item.value as CameraView)}><item.icon size={18} /><span>{item.label}</span></button>)}
            </div>
          </div>
          <div className={styles.zoomTools}><button aria-label="Zoom out" title="Zoom out" disabled={!ready} onClick={() => viewportRef.current?.zoom(-1)}><Minus size={18} /></button><button aria-label="Zoom in" title="Zoom in" disabled={!ready} onClick={() => viewportRef.current?.zoom(1)}><Plus size={18} /></button><button aria-label="Fullscreen preview" title="Fullscreen preview" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void stageRef.current?.requestFullscreen().catch(() => setNotice("Fullscreen is not available in this browser.")); }}><Expand size={17} /></button></div>
          <div className={styles.stageHelp}>{view === "orbit" ? "Drag seats / projector along track · Empty space to orbit" : view === "plan" ? "Drag seats / projector along track · Empty space to pan" : "The view from your first-row centre seat"}</div>
        </div>
        {selected && selectedVisible && selectionPosition && <div className={styles.objectInspector} aria-label="Selected object position">
          <strong>{selected.startsWith("row-") ? `Seating row ${Number(selected.slice(4)) + 1}` : selected === "projector" ? "Projector" : `${selected} speaker`}</strong>
          <span>Forward / backward · metres</span>
          {[{ name: "From front wall", axis: 2 }].map(({name, axis}) => <label key={axis}>{name}<input type="number" step="0.05" min={-10} max={25} value={Number((selectionPosition[axis] + (axis === 2 ? design.depth / 2 : 0)).toFixed(2))} onChange={event => {
            const value = Number(event.target.value); if (!Number.isFinite(value) || value < -10 || value > 25) return;
            const next: ObjectPosition = [selectionPosition[0], selectionPosition[1], selectionPosition[2] + design.depth / 2]; next[axis] = value; moveObject(selected, next);
          }} /></label>)}
          <button onClick={() => { setDesign(current => { const positions = { ...current.positions }; delete positions[selected]; return { ...current, positions }; }); setExportedFile(null); }}>Auto-place selected</button>
          <button onClick={() => { setDesign(current => ({ ...current, positions: {} })); setExportedFile(null); }}>Auto-place all</button>
        </div>}
        <div className={styles.metrics} aria-label="Calculated theatre specifications">
          <div><span>Seating capacity</span><strong>{calculated.totalSeats}<small> seats</small></strong></div>
          <div><span>Screen diagonal</span><strong>{design.diagonal}<small> inches</small></strong></div>
          <div><span>Viewing angle</span><strong>{calculated.angle.toFixed(1)}<small>°</small></strong></div>
          <div><span>Sound layout</span><strong>{design.audio}<small> channels</small></strong></div>
        </div>
        <div className={styles.layoutStatus} role="status">
          {calculated.warnings.length ? <><TriangleAlert size={19} /><div><strong>{calculated.warnings.length} layout {calculated.warnings.length === 1 ? "check" : "checks"} to review</strong>{calculated.warnings.map(warning => <p key={warning}>{warning}</p>)}</div></> : <><Check size={18} /><div><strong>Your layout passes the demo fit checks.</strong><p>Concept dimensions only. Epix’s team can refine the equipment, sightlines and installation.</p></div></>}
        </div>
      </section>
      <aside className={styles.sidebar} aria-label="Theatre configuration">
        <div className={styles.panelTitle}><SlidersHorizontal size={17} /><h2>Build your theatre</h2><span>{PANELS.findIndex(item => item.key === panel) + 1} / 4</span></div>
        <nav className={styles.tabs} aria-label="Configuration steps">{PANELS.map(item => <button key={item.key} aria-current={panel === item.key ? "step" : undefined} onClick={() => setPanel(item.key)}><item.icon size={18} /><span>{item.label}</span></button>)}</nav>
        <div className={styles.panelBody} key={panel}>
          {panel === "room" && <>
            <div className={styles.sectionLead}><h3>Start with your space.</h3><p>Set the dimensions of your room. The layout adjusts as you explore.</p></div>
            <div className={styles.unitRow}><span>Measurements</span><div className={styles.segmented}><button aria-pressed={units === "m"} onClick={() => setUnits("m")}>Metres</button><button aria-pressed={units === "ft"} onClick={() => setUnits("ft")}>Feet</button></div></div>
            {range("width", "Room width")}{range("depth", "Room depth")}{range("height", "Ceiling height")}
            <fieldset className={styles.finishField}><legend>Wall finish</legend><div>{[{ value: "graphite", name: "Graphite", color: "#373e47" }, { value: "walnut", name: "Walnut", color: "#73543e" }, { value: "midnight", name: "Midnight", color: "#244260" }].map(finish => <button key={finish.value} aria-pressed={design.finish === finish.value} onClick={() => change("finish", finish.value as TheaterDesign["finish"])}><span style={{ background: finish.color }}>{design.finish === finish.value && <Check size={16} />}</span>{finish.name}</button>)}</div></fieldset>
            <div className={styles.presetHeader}>Or start with a layout</div><div className={styles.presets}>{PRESETS.map(item => <button key={item.name} aria-pressed={preset === item.name} onClick={() => { setDesign({ ...DEFAULT_DESIGN, ...item.values }); setPreset(item.name); setNotice(""); }}><strong>{item.name}</strong><span>{item.description}</span>{preset === item.name ? <Check size={16} /> : <ChevronRight size={16} />}</button>)}</div>
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
            <div className={styles.infoNote}>Rows slide forward and backward only. Aisle settings determine their sideways position. Speakers and subwoofers are automatically placed. Seating sliders restore automatic row positions.</div>
          </>}
          {panel === "screen" && <>
            <div className={styles.sectionLead}><h3>A bigger picture.</h3><p>Choose your display and explore the view from your seat.</p></div>
            {choices("display", "Display type", [{ value: "projector", label: "Projector" }, { value: "tv", label: "Flat-panel TV" }])}
            {choices("aspect", "Screen aspect ratio", design.display === "tv" ? [{ value: "16:9", label: "16:9 widescreen" }] : [{ value: "16:9", label: "16:9" }, { value: "2.4:1", label: "2.4:1 cinema" }])}
            {range("diagonal", "Screen diagonal", 1, value => `${value}″`)}
            <div className={styles.resultCard}><span>Image dimensions</span><strong>{measurement(calculated.screen.width)} × {measurement(calculated.screen.height)}</strong><span>Horizontal viewing angle</span><strong>{calculated.angle.toFixed(1)}°</strong></div>
            {design.display === "projector" && <>
              <div className={styles.assumptionTitle}>Generic projector assumptions</div>
              <div className={styles.numberGrid}>{numeric("lumens", "Light output (lm)", 100)}{numeric("gain", "Screen gain", 0.1)}{numeric("throwMin", "Min. throw ratio", 0.05)}{numeric("throwMax", "Max. throw ratio", 0.05)}</div>
              <div className={styles.resultCard}><span>Lens-to-screen range</span><strong>{measurement(calculated.minThrow)} – {measurement(calculated.maxThrow)}</strong><span>Estimated screen brightness</span><strong>{calculated.nits.toFixed(0)} <small>nits</small></strong></div>
              <div className={styles.infoNote}>An idealized estimate using light output, screen area and gain. It does not predict HDR performance or room lighting.</div>
            </>}
          </>}
          {panel === "sound" && <>
            <div className={styles.sectionLead}><h3>Surrounded by possibility.</h3><p>Explore speaker layouts around your primary listening seat.</p></div>
            {choices("audio", "Speaker layout", [{ value: "5.1", label: "5.1" }, { value: "5.1.2", label: "5.1.2" }, { value: "7.2.4", label: "7.2.4" }])}
            <div className={styles.infoNote}>{design.audio === "7.2.4" ? "7 ear-level speakers · 2 subwoofers · 4 overhead speakers" : design.audio === "5.1.2" ? "5 ear-level speakers · 1 subwoofer · 2 overhead speakers" : "5 ear-level speakers · 1 subwoofer"}</div>
            {choices("front", "Front left & right speakers", [{ value: "tower", label: "Floorstanding" }, { value: "in-wall", label: "In-wall" }])}
            <button className={styles.coverageButton} aria-pressed={design.coverage} onClick={() => change("coverage", !design.coverage)}><Volume2 size={20} /><span><strong>{design.coverage ? "Hide" : "Show"} speaker coverage</strong><small>Explore the illustrative sound paths</small></span><ChevronRight size={16} /></button>
            <div className={styles.resultCard}><span>Equipment in the scene</span><strong>{calculated.speakerCount} speakers & subs</strong><span>Listening position</span><strong>First row · centre{design.positions?.["row-0"] ? " (moved)" : ""}</strong></div>
            <div className={styles.acousticSummary}><span className={styles.liveDot} /> Seat-aware placement · live</div>
            <div className={styles.speakerTable}><table><caption>Calculated speaker alignment</caption><thead><tr><th scope="col">Channel</th><th scope="col">Angle</th><th scope="col">Distance</th><th scope="col">Delay</th></tr></thead><tbody>{calculated.sound.speakers.filter(s => s.model !== "sub").map(s => <tr key={s.id}><th scope="row">{s.id}{s.constrained ? " *" : ""}</th><td>{Math.abs(s.azimuth).toFixed(0)}°</td><td>{measurement(s.distance)}</td><td>{s.delayMs.toFixed(1)} ms</td></tr>)}</tbody></table></div>
            <div className={styles.infoNote}>Angles are measured from the screen axis. * Room-limited position. Delay is the extra geometric delay relative to the farthest main speaker at 343 m/s; actual calibration needs measurements. Subwoofer phase, reflections and sound pressure are not simulated. <a href="https://www.dolby.com/about/support/guide/speaker-setup-guides/7.1.4-overhead-speaker-setup-guide" target="_blank" rel="noreferrer">Placement reference: Dolby</a></div>
          </>}
        </div>
        <div className={styles.panelFooter}>
          {panel !== "sound" ? <button className={styles.primaryButton} onClick={() => setPanel(PANELS[PANELS.findIndex(item => item.key === panel) + 1].key)}>Next: {PANELS[PANELS.findIndex(item => item.key === panel) + 1].label}<ArrowUpRight size={17} /></button> : <button className={styles.primaryButton} onClick={save}>Save on device<Save size={17} /></button>}
          <span>Explore freely. Your choices stay on this device.</span>
        </div>
      </aside>
    </div>
    <div className={styles.bottomBar}>
      <p><span className={styles.miniMark}>E</span>Thoughtfully planned. <strong>Beautifully experienced.</strong></p>
      <div><button onClick={load}><FolderOpen size={16} /> Load saved</button><button onClick={() => { setDesign({ ...DEFAULT_DESIGN }); setView("orbit"); viewportRef.current?.resetCamera(); setPreset("Cinema"); setNotice("The Cinema layout has been reset."); }}><RotateCcw size={15} /> Reset</button><button disabled={!ready} onClick={snapshot}><Maximize2 size={15} /> Save image</button><button disabled={!ready} onClick={() => { setReportImage(viewportRef.current?.capture() ?? ""); requestAnimationFrame(() => requestAnimationFrame(() => window.print())); }}><Download size={15} /> Print / save PDF</button></div>
    </div>
    <details className={styles.backup}><summary>Editable design backup</summary><p>JSON stores settings for software; it is not a customer report. Save on device lets you reopen this design here. Use Print / save PDF for a readable report.</p><button onClick={exportPlan}>Download backup (.json)</button></details>
    <section className={styles.printReport} aria-label="Printable design report">
      <h1>EPIX INFRA — Home theatre design</h1><p>Concept design · {new Date().toLocaleDateString("en-IN")}</p>
      {reportImage && <img src={reportImage} alt="Your theatre layout" />}
      <h2>Room and seating</h2><p>{measurement(design.width)} wide × {measurement(design.depth)} deep × {measurement(design.height)} high</p><p>{design.rows} rows · {design.seats} seats per row · {calculated.totalSeats} seats</p>
      <h2>Display and sound</h2><p>{design.display === "tv" ? "TV" : "Projector"} · {design.diagonal} inch screen · {design.aspect} · {calculated.angle.toFixed(1)}° viewing angle</p><p>Image: {measurement(calculated.screen.width)} × {measurement(calculated.screen.height)} · Sound: {design.audio}</p>
      <table><thead><tr><th>Channel</th><th>Distance to listener</th><th>Alignment delay</th></tr></thead><tbody>{calculated.sound.speakers.filter(s=>s.model!=="sub").map(s=><tr key={s.id}><td>{s.id}</td><td>{measurement(s.distance)}</td><td>{s.delayMs.toFixed(1)} ms</td></tr>)}</tbody></table>
      <h2>Layout review</h2>{calculated.warnings.length ? <ul>{calculated.warnings.map(w=><li key={w}>{w}</li>)}</ul> : <p>Passes the concept fit checks.</p>}
      <p>Illustrative equipment dimensions and geometric sound estimates. Final installation, clearances and calibration require an Epix site survey.</p>
    </section>
    <div className={styles.notice} aria-live="polite">{notice}{exportedFile && <a href={exportedFile.url} download={exportedFile.name}>Download file</a>}</div>
    <p className={styles.demoFootnote}>Concept demonstration · Layouts and equipment dimensions require an installer review. <Link href="/get-quote">Discuss your cinema with Epix <ArrowUpRight size={13} /></Link></p>
  </main>;
}
