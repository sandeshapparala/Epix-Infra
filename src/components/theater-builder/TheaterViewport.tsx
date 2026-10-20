"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { CameraView, TheaterDesign, ObjectPosition } from "./design";
import type { SceneHandle } from "./scene";
import styles from "./builder.module.css";

export type ViewportHandle = Pick<SceneHandle, "capture" | "zoom" | "resetCamera">;
const TheaterViewport = forwardRef<ViewportHandle, { design: TheaterDesign; view: CameraView; onReady: (ready: boolean) => void; onObjectMove: (id: string, position: ObjectPosition) => void; onSelect: (id: string) => void }>(function TheaterViewport({ design, view, onReady, onObjectMove, onSelect }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const latest = useRef({ design, view, onReady, onObjectMove, onSelect });
  latest.current = { design, view, onReady, onObjectMove, onSelect };
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useImperativeHandle(ref, () => ({ capture: () => sceneRef.current?.capture() ?? "", zoom: amount => sceneRef.current?.zoom(amount), resetCamera: () => sceneRef.current?.resetCamera() }), []);
  useEffect(() => {
    let active = true;
    setProgress(0); setError(""); setReady(false); latest.current.onReady(false);
    import("./scene").then(({ createTheaterScene }) => {
      if (!active || !canvasRef.current) return;
      const { handle, ready: sceneReady } = createTheaterScene(canvasRef.current, value => { if (active) setProgress(value); }, (id, position) => latest.current.onObjectMove(id, position), id => latest.current.onSelect(id));
      sceneRef.current = handle;
      handle.update(latest.current.design, latest.current.view);
      sceneReady.then(() => { if (active) { setReady(true); latest.current.onReady(true); } }).catch(() => {
        if (active) { setError("The 3D assets could not load. Check your connection and try again."); handle.dispose(); sceneRef.current = null; }
      });
    }).catch(() => { if (active) setError("The 3D view could not start. Enable hardware acceleration in your browser, then try again."); });
    return () => { active = false; sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [attempt]);
  useEffect(() => { sceneRef.current?.update(design, view); }, [design, view]);
  return <div className={styles.canvasWrap} data-testid="theater-viewport" data-scene-ready={ready}>
    <canvas ref={canvasRef} className={styles.canvas} aria-label="Interactive 3D home theatre. Drag to rotate and scroll to zoom. Camera buttons provide alternative views." />
    {!ready && <div className={styles.loading} role="status">
      <span className={styles.loadingMark}>E</span>
      <strong>{error || "Building your cinema"}</strong>
      {error ? <button className={styles.primaryButton} onClick={() => setAttempt(value => value + 1)}>Try again</button> : <><p>Loading seating, speakers and display · {progress}/7</p><div className={styles.progress}><span style={{ width: `${progress / 7 * 100}%` }} /></div></>}
    </div>}
  </div>;
});
export default TheaterViewport;
