# Epix Infra theatre builder demonstration

Local route: `/home-theater-builder`.

Run `pnpm dev` and open `http://localhost:3000/home-theater-builder`, or use
`pnpm exec next dev --port 3010` to keep the demo separate from an existing dev server.

## Features

- Procedural room, wall finishes, screen, LED strips and seating risers.
- Local glTF assets: 2/3/4/5-seat rows, projector, television and speaker pack.
- Local Draco decoder; no hotlinks to Audio Advice during demo use.
- Room/seating/screen/audio controls; 3D, overhead and primary-seat views.
- Dimension and illustrative speaker-coverage overlays, lighting and zoom.
- Capacity, image geometry, viewing angle, fit warnings and generic projection estimates.
- Save/load one design in browser localStorage; PNG preview and JSON specification exports.
- Responsive interface and model-load error/retry state.

## Asset provenance

`public/theater-demo/source-manifest.json` records model URLs, sizes, hashes,
mesh names and retrieval time. The supplied demonstration uses public reference
assets from Audio Advice at the user's request. Public availability does not
establish a reuse licence. These assets are not represented as Epix-owned models.
The route is marked noindex. No deployment or publication is included in this task.

Draco decoder files come from the installed Three.js package. Its MIT notice is
included alongside the decoder. Draco is Apache-2.0 licensed.

## Calculation assumptions

Internal dimensions use metres. Feet are a display conversion. Seating rows are
normalized to `0.78 m × seat count + 0.16 m` wide. Product-specific dimensions,
recline clearances and lens positions are not verified manufacturer specifications.
Front row is the primary listening position. Placement rules and coverage cones
are concept aids; they do not calculate acoustic reflections or room correction.
Riser height is user-selected and is not a sightline-derived recommendation.

Screen dimensions are derived from diagonal/aspect ratio. Horizontal viewing angle
is `2 × atan(screen width / (2 × viewing distance))`. Generic throw ranges use
`image width × throw ratio`. Brightness is an idealized estimate:
`lumens × gain / (π × image area in m²)`. It assumes uniform light over that image
area and excludes calibration/zoom losses, directional gain, ambient light, and
letterboxing effects. It is not an HDR certification.

## Verification

`node --test scripts/theater-design.test.mjs` exercises screen geometry, fit
warnings, brightness relationships and saved-design validation. Browser checks
cover actual model loading, configuration changes, persistence and exports.

Verified locally: all seven model files decode and render; five-seat layouts
show width warnings; TV and primary-seat view, top view, in-wall speakers,
lighting and coverage controls work. Local save/load restores the chosen screen
and seating. Generated JSON and PNG outputs were inspected. Layout widths of
360, 768 and 1024 pixels have no horizontal overflow; viewport controls use
44-pixel touch targets. TypeScript, the eight domain tests and Next.js production
build pass. The repository's pre-existing root metadata viewport warning remains.

Implementation is isolated in `src/components/theater-builder/` and the new route.
The existing website and marketing workspace are not redesigned.


## Live layout refinement (15 October 2026)

- Scene objects, normalized asset templates, screen texture, materials, rulers and
  coverage cones are pooled. A slider event changes transforms rather than rebuilding
  the scene. Changes coalesce to one application per animation frame; camera orbit
  stays in place while dimensions change. Rendering and shadow updates stop when
  the scene is idle (the lightweight controls/frame scheduler remains active).
- Sliders use 5 cm steps for room/seating distances, with labelled increment/decrement
  controls and filled tracks. Existing integer counts and screen inches stay discrete.
  The preview stays visible above controls on mobile.
- In overhead view, drag any seating row forward/backward to move the whole seating
  group. Pointer capture ends on release/cancel; native sliders provide a keyboard
  alternative. New positions update the same design state used by save/export.
- `solveSpeakers()` is a pure geometric solver. Front L/R target 26 degrees and clear
  the screen edges; 7-channel surrounds target 100 degrees; 5-channel surrounds
  target 110 degrees. Rear channels trace 145-degree rays to room boundaries.
  Four overhead speakers follow the listening position with nominal 45-degree
  front/back elevation in the longitudinal plane; two overhead speakers sit beside
  the listener at ceiling level. Cabinet footprints are kept inside the room.
- Freestanding speakers yaw toward the primary listening point; in-wall speakers
  stay flush. Subwoofer positions remain illustrative front placements, not an
  optimization of bass response. Room constraints and front-angle deviations appear
  as warnings, with actual angles/distances in the Sound table and JSON export.
- Main-channel geometric alignment delay is `(farthest distance - distance) / 343`
  seconds. Subwoofer delay is excluded from the UI table; its exported zero is a
  placeholder, not a calibration recommendation. Cabinet centre is the assumed
  acoustic origin. Actual directivity, sound pressure, reflections, crossover,
  phase, room modes and electronics latency require product data and measurements.
- Placement reference: https://www.dolby.com/about/support/guide/speaker-setup-guides/7.1.4-overhead-speaker-setup-guide
  This is an independent concept implementation, not a Dolby certification or a copy
  of Audio Advice's proprietary algorithm.

Validation: eight domain tests pass, including symmetry, target azimuths, equalized
arrival times and 162 combinations of room dimensions/listening positions. Chrome
checks exercised repeated slider changes, direct seat dragging (4.10 m to 3.27 m),
TV resizing, alternate sound layouts, in-wall models, boundary warnings and save/load.
Sampled warmed scene-application times were 0.1-0.2 ms; this measures CPU transform
updates, not total GPU frame time or a guarantee on other hardware. The seating
slider test retained 42 pooled objects and two procedural geometries. Mobile 360px
layout has no horizontal overflow. TypeScript and production build pass; existing
root metadata viewport warnings remain. No deployment was performed.


## Direct object editing (15 October 2026)

3D and Top view now allow mouse/touch dragging of each seating row, each speaker
(including subs and ceiling speakers), and the projector. Drag empty space for
camera navigation. Dragging moves objects in their horizontal mounting plane;
height remains fixed. Screen placement remains controlled by display settings.
Selection has a gold outline and editable X/front-wall-distance fields, plus
Auto-place selected/all controls. Each row moves independently. Seating models
now use an explicit 1.4 m depth and 1.15 m height, shared with the fit validator.

Manual positions use stable object IDs and front-wall-relative depth and persist
in version-1 saved designs and exported JSON. Existing designs remain compatible.
Untouched speakers use the seat-aware solver; overrides stay fixed. Seating
sliders restore generated row positions; removing a row drops its override.

Invalid moves stay visible. An in-scene warning badge and room border report
issues immediately; the details identify out-of-room seats/speakers/projectors,
overlapping rows, speaker/seat overlap, projector throw mismatch and off-axis
projector placement. Room resizing revalidates manual positions. This is a
concept fit checker, not a substitute for manufacturer clearances or installation
survey. Direct drag verification in Chrome covered SR speaker, projector and rows.

Current verification: 11 calculation/persistence tests pass; production build and
TypeScript pass. Chrome mouse drags selected SR and projector, then independently
moved row 1. Out-of-room and overlap feedback appeared immediately. Save/Load
restored the manual X coordinate (-1.35 m). A CDP touch gesture at 360px moved a row
to X=0.35 m; mobile document/client widths both measured 353px. The reference's
three-row configuration was rechecked and displayed a seating-too-far-back warning.


## Movement constraints and customer report (15 October 2026)

This supersedes the free object editing behavior above. Seating rows and projector
now move only front/back. Their X and height are derived from aisle/riser/ceiling
settings; old lateral overrides are normalized on load and ignored at rendering.
Seat dragging is bounded by the row footprint; the projector follows the valid
throw interval intersected with the room. Invalid room/screen changes still surface
warnings. A visible track appears on selection; lateral position inputs are removed.
Speakers and subwoofers are automatic again, and old manual overrides are discarded
on load. No amplifier or cable-routing model is present.

Reference interaction check: seating drag changed the distance from 132 to 126
inches; attempted subwoofer dragging orbited the scene. The reference has a visible
projector throw track. The requested axial restriction is implemented independently.

Save on device keeps settings in local storage. Print / save PDF opens the browser
print dialog with a dedicated customer report: scene image, dimensions, seating,
display, sound layout, distances/delays and fit warnings. JSON export is now under
Editable design backup, with a clear explanation of its software-only purpose.
Twelve tests cover movement-axis locks, track limits, legacy override migration,
fit checks and saved data. Browser inspection confirms no lateral input and a
sideways gesture leaves row X at zero; print-media layout was visually inspected.


## Physical seating stops (21 October 2026)

Dragging and exact position inputs use the same connected safe track. Row indices
keep front-to-back order, even after a large pointer jump. The representative chair
is 1.4 m deep and 1.15 m tall, with 0.30 m clear between footprints and at the rear
wall, plus a 1 m front approach beyond the 0.2 m screen face. A 60-degree horizontal
viewing-angle ceiling further limits front-row proximity. These are configurable
concept policies, not certified recline or local building-code requirements. Final
clearances need the chosen chair's extended dimensions and the installer's survey.

Cabinet dimensions include yaw through a conservative horizontal bounding radius.
Seats and raised platforms stop before fixed equipment; the moving side surrounds
also stop before front/rear cabinets, other seating or room edges. Riser geometry
uses the same footprint as collision checking. Subwoofers are placed behind the
front pair with clearance. All ceiling, front and rear speakers and the projector
remain fixed during seat drags; only SL/SR follow the first row.

Room, screen and seating edits fit rows into legal positions if possible. Impossible
changes are rejected with an explanation beside the controls. Restoring an older
project repairs row order and clearance; physically impossible projects are rejected
before replacing the current workspace. Equipment selection uses supplied dimensions
when known and rejects combinations that cannot fit. Quote snapshots remain intact.

Verification adds boundary drags in both directions, ordered three-row tests,
non-tunnelling, fixed-equipment separation, projector preservation, old-layout
repair and a 216-configuration room/layout matrix. The full domain suite has
44 passing tests, with TypeScript and production build checks.
