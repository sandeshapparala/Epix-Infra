import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { calculateDesign, constrainObjectMove, rowWidth, seatOffset, seatingPosition, type ObjectPosition, type CameraView, type TheaterDesign } from "./design";

const BASE = "/theater-demo/";
const MODEL_FILES = ["2-chair-row-draco.gltf", "3-chair-row-draco.gltf", "4-chair-row-draco.gltf", "5-chair-row-draco.gltf", "all-speakers-draco.gltf", "projector-no-mount-draco.gltf", "tv-draco.gltf"];
const FINISH = { graphite: { wall: "#363b42", panel: "#222830" }, walnut: { wall: "#614b3f", panel: "#3c2d25" }, midnight: { wall: "#243b54", panel: "#17283c" } };
export type SceneHandle = {
  update: (design: TheaterDesign, view: CameraView) => void;
  zoom: (amount: number) => void;
  resetCamera: () => void;
  capture: () => string;
  dispose: () => void;
};

export function createTheaterScene(canvas: HTMLCanvasElement, onProgress: (loaded: number) => void, onObjectMove: (id: string, position: ObjectPosition) => void, onSelect: (id: string) => void): { handle: SceneHandle; ready: Promise<void> } {
  let disposed = false;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e3e9ec");
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 80);
  const controls = new OrbitControls(camera, canvas);
  let dirty = true;
  controls.addEventListener("change", () => { dirty = true; });
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.minDistance = 1;
  controls.maxDistance = 26;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  const ambient = new THREE.HemisphereLight("#e4eeff", "#79746c", 2.2);
  scene.add(ambient);
  const key = new THREE.DirectionalLight("#fff0d6", 3.5);
  key.position.set(3, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -9; key.shadow.camera.right = 9;
  key.shadow.camera.top = 9; key.shadow.camera.bottom = -9;
  key.shadow.bias = -0.001;
  scene.add(key);
  const screenLight = new THREE.PointLight("#d3e5ff", 4, 12, 2);
  scene.add(screenLight);
  const content = new THREE.Group();
  scene.add(content);
  const models = new Map<string, THREE.Group>();
  const ownedGeometries = new Set<THREE.BufferGeometry>();
  const ownedMaterials = new Set<THREE.Material>();
  const ownedTextures = new Set<THREE.Texture>();
  const importedGeometries = new Set<THREE.BufferGeometry>();
  const importedMaterials = new Set<THREE.Material>();
  const importedTextures = new Set<THREE.Texture>();
  const draco = new DRACOLoader().setDecoderPath(`${BASE}draco/`).setWorkerLimit(2);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const carpet = new THREE.TextureLoader().load(`${BASE}carpet-bump-map.jpg`, () => { dirty = true; });
  carpet.wrapS = THREE.RepeatWrapping; carpet.wrapT = THREE.RepeatWrapping;
  importedTextures.add(carpet);
  let loaded = 0;
  let previousView: CameraView | undefined;

  let currentDesign: TheaterDesign | undefined;
  let currentView: CameraView = "orbit";
  let loadedModels = false;
  const draggable: { id: string; object: THREE.Object3D }[] = [];
  const raycaster = new THREE.Raycaster();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const dragPoint = new THREE.Vector3();
  const selection = new THREE.BoxHelper(new THREE.Object3D(), "#e9b56a");
  scene.add(selection); selection.visible = false;
  let selected = "";
  let drag: { pointer: number; id: string; start: THREE.Vector3; position: THREE.Vector3 } | undefined;
  function pointerRay(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
  }
  function pick() {
    const hit = raycaster.intersectObjects(draggable.map(item => item.object), true)[0];
    if (!hit) return undefined;
    return draggable.find(item => { let obj: THREE.Object3D | null = hit.object; while (obj) { if (obj === item.object) return true; obj = obj.parent; } return false; });
  }
  function pointerDown(event: PointerEvent) {
    if (currentView === "seat" || !currentDesign || event.button !== 0 || drag) return;
    pointerRay(event);
    const picked = pick(); if (!picked) return;
    dragPlane.constant = -picked.object.position.y;
    if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
    selected = picked.id; selection.setFromObject(picked.object); selection.visible = true; dirty = true;
    onSelect(selected);
    drag = { pointer: event.pointerId, id: selected, start: dragPoint.clone(), position: picked.object.position.clone() };
    controls.enabled = false; canvas.setPointerCapture(event.pointerId); canvas.style.cursor = "grabbing";
    event.preventDefault(); event.stopImmediatePropagation();
  }
  function pointerMove(event: PointerEvent) {
    if (!currentDesign || currentView === "seat") return;
    pointerRay(event);
    if (!drag) { canvas.style.cursor = pick() ? "grab" : ""; return; }
    if (drag.pointer !== event.pointerId) return;
    if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
      const x = Math.round((drag.position.x + dragPoint.x - drag.start.x) * 20) / 20;
      const z = Math.round((drag.position.z + dragPoint.z - drag.start.z + currentDesign.depth / 2) * 20) / 20;
      const position = constrainObjectMove(currentDesign, drag.id, [x, drag.position.y, z]);
      if (position) onObjectMove(drag.id, position);
    }
    event.preventDefault(); event.stopImmediatePropagation();
  }
  function pointerUp(event: PointerEvent) {
    if (!drag || drag.pointer !== event.pointerId) return;
    drag = undefined; controls.enabled = true; canvas.style.cursor = "grab";
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    event.stopImmediatePropagation();
  }
  canvas.addEventListener("pointerdown", pointerDown, true);
  canvas.addEventListener("pointermove", pointerMove, true);
  canvas.addEventListener("pointerup", pointerUp, true);
  canvas.addEventListener("pointercancel", pointerUp, true);

  // Stable pools: slider changes mutate transforms, never re-decode or clone models.
  const pool = new Map<string, THREE.Object3D>();
  const counts = new Map<string, number>();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const normalized = new Map<string, { source: THREE.Object3D; size: THREE.Vector3 }>();
  const unitBox = new THREE.BoxGeometry(1, 1, 1); ownedGeometries.add(unitBox);
  const unitCone = new THREE.ConeGeometry(0.3, 1, 20, 1, true); ownedGeometries.add(unitCone);
  function reuse<T extends THREE.Object3D>(kind: string, create: () => T): T {
    const index = counts.get(kind) ?? 0; counts.set(kind, index + 1);
    const key = `${kind}:${index}`;
    let object = pool.get(key) as T | undefined;
    if (!object) { object = create(); pool.set(key, object); content.add(object); }
    object.visible = true; return object;
  }
  function clearContent() {
    content.clear(); pool.clear(); normalized.clear(); materials.clear();
    ownedGeometries.forEach(g => g.dispose()); ownedGeometries.clear();
    ownedMaterials.forEach(m => m.dispose()); ownedMaterials.clear();
    ownedTextures.forEach(t => t.dispose()); ownedTextures.clear();
  }
  function material(color: string, roughness = 0.8) {
    const key = `${color}:${roughness}`;
    let m = materials.get(key);
    if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness }); materials.set(key, m); ownedMaterials.add(m); }
    return m;
  }
  function box(size: [number, number, number], position: [number, number, number], mat: THREE.Material) {
    const mesh = reuse("box", () => new THREE.Mesh(unitBox, mat));
    mesh.material = mat; mesh.scale.set(...size); mesh.position.set(...position);
    mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
  }
  function model(source: THREE.Object3D, width: number, position: [number, number, number], rotation = 0, height?: number, depth?: number) {
    let template = normalized.get(source.uuid);
    if (!template) {
      const clone = source.clone(true); clone.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(clone);
      const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
      clone.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
      clone.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
      template = { source: clone, size }; normalized.set(source.uuid, template);
    }
    const stable = template;
    const group = reuse(`model:${source.uuid}`, () => { const g = new THREE.Group(); g.add(stable.source.clone(true)); return g; });
    const size = stable.size;
    group.scale.set(width / size.x, height ? height / size.y : width / size.x, depth ? depth / size.z : width / size.x);
    group.position.set(...position); group.rotation.y = rotation; return group;
  }
  function label(text: string, position: [number, number, number]) {
    const sprite = reuse("label", () => {
      const c = document.createElement("canvas"); c.width = 512; c.height = 100;
      const texture = new THREE.CanvasTexture(c); ownedTextures.add(texture);
      const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false }); ownedMaterials.add(mat);
      return new THREE.Sprite(mat);
    });
    if (sprite.userData.text !== text) {
      const texture = sprite.material.map!;
      const c = texture.image as HTMLCanvasElement, ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, 512, 100); ctx.fillStyle = "#17394b";
      ctx.beginPath(); ctx.roundRect(4, 4, 504, 92, 20); ctx.fill();
      ctx.font = "500 42px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff"; ctx.fillText(text, 256, 52); texture.needsUpdate = true;
      sprite.userData.text = text;
    }
    sprite.position.set(...position); sprite.scale.set(1.22, 0.24, 1);
  }
  const lineMat = new THREE.LineBasicMaterial({ color: "#5cbbd2", depthTest: false }); ownedMaterials.add(lineMat);
  function ruler(from: [number, number, number], to: [number, number, number], text: string) {
    const line = reuse("ruler", () => {
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6), 3)); ownedGeometries.add(geometry);
      return new THREE.Line(geometry, lineMat);
    });
    const vertices = line.geometry.getAttribute("position"); vertices.setXYZ(0, ...from); vertices.setXYZ(1, ...to); vertices.needsUpdate = true;
    line.geometry.computeBoundingSphere(); line.renderOrder = 5;
    label(text, [(from[0]+to[0])/2, (from[1]+to[1])/2+0.15, (from[2]+to[2])/2]);
  }
  const screenCanvas = document.createElement("canvas"); screenCanvas.width = 1600; screenCanvas.height = 900;
  const ctx = screenCanvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 1600, 900);
  gradient.addColorStop(0, "#07172a"); gradient.addColorStop(0.6, "#19394e"); gradient.addColorStop(1, "#a5773e");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1600, 900);
  ctx.strokeStyle = "#e2b76c"; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(1220, 470, 280 + i * 50, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = "#f3cf8e"; ctx.font = "500 35px Arial"; ctx.fillText("THE EPIX EXPERIENCE", 110, 220);
  ctx.fillStyle = "#ffffff"; ctx.font = "700 170px Arial"; ctx.fillText("EPIX", 100, 445);
  ctx.font = "400 75px Arial"; ctx.fillText("PRIVATE CINEMA", 110, 560);
  ctx.fillStyle = "#ddd9d0"; ctx.font = "400 30px Arial"; ctx.fillText("THE BEST SEAT IS YOURS.", 110, 715);
  const screenMap = new THREE.CanvasTexture(screenCanvas); screenMap.colorSpace = THREE.SRGBColorSpace; ownedTextures.add(screenMap);
  const displayMaterial = new THREE.MeshBasicMaterial({ map: screenMap, toneMapped: false }); ownedMaterials.add(displayMaterial);
  const coneMaterial = new THREE.MeshBasicMaterial({ color: "#7cc8e9", transparent: true, opacity: 0.10, depthWrite: false, side: THREE.DoubleSide }); ownedMaterials.add(coneMaterial);
  function coverage(from: THREE.Vector3, to: THREE.Vector3) {
    const length = from.distanceTo(to);
    const cone = reuse("coverage", () => new THREE.Mesh(unitCone, coneMaterial));
    cone.scale.setScalar(length);
    cone.position.copy(from.clone().add(to).multiplyScalar(0.5));
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), from.clone().sub(to).normalize());
  }
  function applyCamera(d: TheaterDesign, view: CameraView, force: boolean) {
    const primary = seatingPosition(d, 0);
    const targetZ = primary[2];
    if (!force && view !== "seat") return;
    controls.enabled = !drag; controls.enableRotate = view === "orbit";
    controls.enablePan = view !== "seat"; controls.enableZoom = true;
    controls.maxPolarAngle = view === "orbit" ? Math.PI / 2 - 0.03 : Math.PI;
    camera.fov = view === "seat" ? 65 : 42;
    if (view === "plan") {
      camera.position.set(0, Math.max(d.width, d.depth) * 1.7, 0.01);
      controls.target.set(0, 0, 0);
    } else if (view === "seat") {
      camera.position.set(primary[0], primary[1] + 1.15, targetZ + 0.18);
      controls.target.set(0, 1.35, -d.depth / 2 + 0.18);
    } else {
      camera.position.set(d.width * 1.05, d.depth * 0.88, d.depth * 1.0);
      controls.target.set(0, 0.85, -0.3);
    }
    camera.updateProjectionMatrix(); controls.update();
  }
  let pending: { design: TheaterDesign; view: CameraView } | undefined;
  function update(design: TheaterDesign, view: CameraView) { currentDesign = design; currentView = view; pending = { design, view }; }
  function applyDesign(d: TheaterDesign, view: CameraView) {
    const started = performance.now();
    currentDesign = d; currentView = view;
    if (disposed || !loadedModels) return;
    counts.clear(); pool.forEach(object => { object.visible = false; });
    const { screen, viewingDistance, sound, projector } = calculateDesign(d);
    const colors = FINISH[d.finish];
    const frontZ = -d.depth / 2;
    const primaryZ = sound.listener[2];
    const offset = sound.listener[0];
    const floor = material("#7c7870");
    carpet.repeat.set(d.width * 3, d.depth * 3);
    floor.bumpMap = carpet; floor.bumpScale = 0.035;
    box([d.width + 0.18, 0.14, d.depth + 0.18], [0, -0.08, 0], floor);
    const wall = material(colors.wall);
    const panel = material(colors.panel);
    box([d.width, d.height, 0.12], [0, d.height / 2, frontZ - 0.06], wall);
    box([0.12, d.height, d.depth], [-d.width / 2 - 0.06, d.height / 2, 0], wall);
    // Right and rear walls are cut away to make the layout readable.
    box([0.08, 0.18, d.depth], [d.width / 2 + 0.04, 0.09, 0], panel);
    const strip = material("#ffcd7b"); strip.emissive.set("#ffc36a"); strip.emissiveIntensity = d.lights ? 1.8 : 0.55;
    for (let z = frontZ + 0.48; z < d.depth / 2; z += 0.85) {
      box([0.035, d.height - 0.24, 0.7], [-d.width / 2 + 0.025, d.height / 2, z], panel);
      box([0.025, d.height - 0.32, 0.022], [-d.width / 2 + 0.065, d.height / 2, z + 0.38], strip);
    }
    box([d.width - 0.2, 0.018, 0.025], [0, 0.18, frontZ + 0.095], strip);
    const screenY = 0.72 + screen.height / 2;
    const frame = material("#10141a", 0.45);
    if (d.display === "tv") {
      const tv = models.get("tv-draco.gltf")!;
      model(tv.getObjectByName("frame") ?? tv, screen.width + 0.08, [0, 0.68, frontZ + 0.10], 0, screen.height + 0.08, 0.08);
    } else box([screen.width + 0.12, screen.height + 0.12, 0.08], [0, screenY, frontZ + 0.12], frame);
    const display = box([screen.width, screen.height, 0.012], [0, screenY, frontZ + 0.16], displayMaterial);
    display.castShadow = false;
    const rowModel = models.get(`${d.seats}-chair-row-draco.gltf`)!;
    draggable.length = 0;
    for (let row = 0; row < d.rows; row++) {
      const rowPosition = seatingPosition(d, row);
      const [rowX, elevation, z] = rowPosition;
      if (row > 0) {
        box([Math.min(d.width - 0.18, rowWidth(d.seats) + 0.35), elevation, d.rowSpacing], [rowX, elevation / 2, z + 0.05], panel);
        box([rowWidth(d.seats) + 0.3, 0.016, 0.025], [rowX, elevation + 0.015, z - d.rowSpacing / 2 + 0.04], strip);
      }
      draggable.push({ id: `row-${row}`, object: model(rowModel, rowWidth(d.seats), rowPosition, Math.PI, 1.15, 1.4) });
    }
    const speakerPack = models.get("all-speakers-draco.gltf")!;
    const source = (name: string) => { const object = speakerPack.getObjectByName(name); if (!object) throw new Error(`The speaker asset is missing ${name}.`); return object; };
    const focus = new THREE.Vector3(...sound.listener);
    for (const placement of sound.speakers) {
      model(source(placement.model), placement.size[0], placement.position, placement.yaw, placement.size[1], placement.size[2]);
      if (d.coverage && placement.model !== "sub") {
        const origin = new THREE.Vector3(placement.position[0], placement.position[1] + placement.size[1] / 2, placement.position[2]);
        coverage(origin, focus);
      }
    }
    if (d.coverage) label("Primary listening seat", [sound.listener[0], sound.listener[1] + 0.35, sound.listener[2]]);
    if (d.display === "projector") {
      const z = projector[2];
      draggable.push({ id: "projector", object: model(models.get("projector-no-mount-draco.gltf")!, 0.45, projector, 0, 0.18, 0.44) });
      box([0.045, Math.max(0.02, d.height - projector[1] - 0.18), 0.045], [projector[0], (d.height + projector[1] + 0.18) / 2, z], frame);
      if (d.dimensions) ruler([0, d.height - 0.48, frontZ + 0.2], [0, d.height - 0.48, z], `Throw ${(projector[2] - frontZ).toFixed(2)} m`);
    }
    if (d.dimensions) {
      ruler([-d.width / 2, 0.2, d.depth / 2 + 0.2], [d.width / 2, 0.2, d.depth / 2 + 0.2], `${d.width.toFixed(2)} m wide`);
      ruler([d.width / 2 + 0.2, 0.2, frontZ], [d.width / 2 + 0.2, 0.2, d.depth / 2], `${d.depth.toFixed(2)} m deep`);
      ruler([offset, 0.28, frontZ + 0.18], [offset, 0.28, primaryZ], `Viewing ${viewingDistance.toFixed(2)} m`);
    }
    ambient.intensity = d.lights ? 2.2 : 0.36;
    key.intensity = d.lights ? 3.5 : 0.6;
    screenLight.position.set(0, screenY, frontZ + 0.65);
    screenLight.intensity = d.lights ? 4 : 9;
    scene.background = new THREE.Color(d.lights ? "#e3e9ec" : "#152332");
    applyCamera(d, view, previousView !== view);
    previousView = view;
    const selectedObject = draggable.find(item => item.id === selected);
    selection.visible = Boolean(selectedObject);
    if (selectedObject) {
      selection.setFromObject(selectedObject.object);
      const p = selectedObject.object.position;
      const limits = selected === "projector" ? [Math.max(frontZ + 0.22, frontZ + screen.width * d.throwMin), Math.min(d.depth / 2 - 0.22, frontZ + screen.width * d.throwMax)] : [frontZ + 0.7, d.depth / 2 - 0.7];
      if (limits[0] <= limits[1]) ruler([p.x, p.y + 0.03, limits[0]], [p.x, p.y + 0.03, limits[1]], selected === "projector" ? "Projector throw track" : "Forward / backward only");
    }
    dirty = true; renderer.shadowMap.needsUpdate = true;
    canvas.dataset.updateMs = (performance.now() - started).toFixed(2);
    canvas.dataset.pooledObjects = String(pool.size);
    canvas.dataset.geometries = String(ownedGeometries.size);
  }

  let animation = 0;
  const render = () => {
    if (disposed) return;
    if (pending && loadedModels) { const next = pending; pending = undefined; applyDesign(next.design, next.view); }
    controls.update();
    if (dirty && !document.hidden) { renderer.render(scene, camera); dirty = false; }
    animation = requestAnimationFrame(render);
  };
  const observer = new ResizeObserver(() => {
    if (disposed) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    dirty = true;
    if (currentDesign && currentView !== "orbit") applyCamera(currentDesign, currentView, true);
  });
  observer.observe(canvas);
  render();
  const ready = Promise.all(MODEL_FILES.map(async name => {
    const gltf = await loader.loadAsync(`${BASE}models/${name}`);
    gltf.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        importedGeometries.add(object.geometry);
        const mats = Array.isArray(object.material) ? object.material : [object.material];
        mats.forEach(mat => { importedMaterials.add(mat); Object.values(mat).forEach(value => { if (value instanceof THREE.Texture) importedTextures.add(value); }); });
      }
    });
    models.set(name, gltf.scene); if (!disposed) onProgress(++loaded);
  })).then(() => {
    if (disposed) { releaseImports(); return; }
    loadedModels = true;
    if (currentDesign) update(currentDesign, currentView);
  });
  function releaseImports() {
    importedGeometries.forEach(g => g.dispose()); importedMaterials.forEach(m => m.dispose()); importedTextures.forEach(t => t.dispose());
    importedGeometries.clear(); importedMaterials.clear(); importedTextures.clear(); models.clear();
  }
  return { ready, handle: {
    update,
    zoom: amount => { const direction = camera.position.clone().sub(controls.target); direction.multiplyScalar(amount > 0 ? 0.85 : 1.18); camera.position.copy(controls.target).add(direction); controls.update(); },
    resetCamera: () => { if (currentDesign) applyCamera(currentDesign, currentView, true); },
    capture: () => { if (pending && loadedModels) { const next = pending; pending = undefined; applyDesign(next.design, next.view); } renderer.render(scene, camera); return renderer.domElement.toDataURL("image/png"); },
    dispose: () => { disposed = true; cancelAnimationFrame(animation); observer.disconnect(); canvas.removeEventListener("pointerdown", pointerDown, true); canvas.removeEventListener("pointermove", pointerMove, true); canvas.removeEventListener("pointerup", pointerUp, true); canvas.removeEventListener("pointercancel", pointerUp, true); controls.dispose(); selection.geometry.dispose(); (selection.material as THREE.Material).dispose(); clearContent(); releaseImports(); draco.dispose(); renderer.dispose(); },
  } };
}
