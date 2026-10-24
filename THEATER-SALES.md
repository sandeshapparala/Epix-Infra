# Epix theatre sales studio

Builder: `/home-theater-builder`
Pricing updates: `/home-theater-builder/pricing`

Feet and inches are the primary room and layout measurements. Exact entry fields
accept feet/inches; distance buttons and sliders use one-inch increments. Metres
remain an optional, remembered display preference. The 3D rulers, position editor,
speaker distances and quote summary follow that preference. Customer quotation
PDFs show feet/inches first with a metric reference. Screen diagonals stay in
inches, and source equipment specifications retain their documented units.
Saved geometry and database dimensions remain in metres for compatibility.

## Seating movement and room colour

Moving the first seating row, through dragging or its distance control, moves
only the side surrounds (SL/SR).
Front L/R, centre, rear surrounds, all ceiling speakers, subwoofers and the projector
keep their placement and orientation. Their listener distances and delay
estimates still recalculate. Other seating rows retain their positions.
Automatic projector placement depends on room depth, image size and throw
limits, independently of the seating distance; manual projector positions persist.

Room finishes include a Custom colour picker alongside the three presets.
Custom colours update the existing wall/panel materials live and are validated
and retained in saved projects and design backups. Existing preset designs remain
compatible. This remains a geometric concept aid, not measured room calibration.

## Run and verify

```powershell
pnpm exec next dev --port 3010
node --test scripts/theater-design.test.mjs
node --test scripts/theater-sales.test.cjs
pnpm test:theater
pnpm exec tsc --noEmit
pnpm exec next build
```

## Catalog

The nine supplied PDFs import into 415 entries: Canton 86, JVC 6, Denon 56,
FAITH 13, KEF 72, Klipsch 85, SVS 15 and Polk 69. Entries include distinct
priced finishes, accessories and complete systems, not only individual speakers.
All 415 entries now have a local product photo. Original photos were extracted
from the supplied PDFs; 24 gaps and one low-resolution ceiling speaker photo
are supplemented by reviewed manufacturer sources in image-overrides.json.

`src/data/theater/products.json` is the reproducible source catalog;
`sources.json` records document hashes and counts. Each entry retains its PDF,
page, effective date, full supplied description, finish choices and original
pricing assumptions. Images are stored in `public/theater-catalog/`.

Run the importer with Python packages `pdfplumber`, `pypdf`, `pypdfium2`, Pillow:

```powershell
python scripts/import-theater-catalog.py --source "D:/WORK/Epix Infra/home 3d"
```

Polk's model-column text overlaps vertical headings in the original PDF. The
importer contains an explicit, ordered transcription of those model labels;
prices and descriptions still come from each corresponding table row. Failures
in page row counts stop the import. JVC lens ratios are separately attributed to
manufacturer URLs in each product's specifications. Price-list brightness stays
attributed to the supplied PDF. Ratios use image width and need a scope-screen
installation review for 2.4:1 setups.

## Price interpretation

- Preserve source tax inclusion; do not add GST twice to MRP-inclusive prices.
- FAITH explicitly excludes GST. Its rate and unspecified selling units require
  confirmation in pricing administration.
- Denon includes GST, but this supplied list does not establish its numeric GST
  rate. Canton, Klipsch and Onkyo need tax-inclusion confirmation where absent.
- Canton selling units are not inferred from a product photo. A tower pictured
  as one speaker does not establish whether the price is for one or a pair.
- Polk R200 says Unit in the model column and Pair in its description. Its unit
  remains unconfirmed until edited.
- POR, TBA and source zeroes are unpriced, never free products.
- Round physical speaker requirements to purchasable packs after combining the
  same SKU and finish across channel groups. Disclose any spare speaker.
- Prices and totals use integer paise. Inclusive line totals reconcile to their
  exact source amount before/after discounts.
- A complete system package suppresses dormant component lines. Only the listed
  Onkyo complete systems explicitly count as including an AV receiver.
- Project screens and TVs use explicitly categorized custom project-work lines;
  their price lists were not among the supplied PDFs.

## Firebase team workspace

The runtime uses Firebase Authentication and Firestore through server-only Admin
SDK routes. Exactly two workspace roles exist: **admin** and **employee**.
The public room builder remains open; catalog selection, pricing, saved client
projects and quotations require an active team account. Signing up to Firebase
alone does not grant workspace membership.

- Admin: all team projects/quotes, creator attribution, catalog prices, approved
  work rates, accounts and individual employee maximum discount percentages.
- Employee: own projects/quotes, model selection and quantities; discounts from
  zero through their current limit. Unit prices, GST and approved work rates
  cannot be changed by employees, including through direct API requests.
- Every request verifies the Firebase ID token (including revocation) and current
  member profile. Writes recheck permissions in Firestore transactions. Stale
  prices/project versions return 409; existing quotation snapshots stay immutable.
- Private Firestore collections use the theater prefix. Browser SDK access to
  these collections is denied for every role; the API checks owner/admin access.
  PDFs download through authenticated requests, without public download tokens.
- The existing website publicSiteAdmin claim is independent of this workspace.
  No unrelated marketing-site role or password is changed by theatre membership.

Routes:

| Route | Access |
| --- | --- |
| /home-theater-builder | Public room; team equipment/quote tools |
| /home-theater-builder/login | Team email/password sign-in and reset request |
| /home-theater-builder/dashboard | Own projects/quotes; admin sees all |
| /home-theater-builder/pricing | Admin price updates |
| /home-theater-builder/team | Admin accounts, discount limits, work rates |

### Server configuration

See .env.example. Locally, GOOGLE_APPLICATION_CREDENTIALS points to a service
account JSON **outside the repository**. Hosted environments can instead provide
FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and
FIREBASE_ADMIN_PRIVATE_KEY as server-only secrets. Never put Admin credentials in
NEXT_PUBLIC variables or include the key file in a deployment bundle. Missing
server configuration fails closed rather than reverting to local public storage.

Private previews and quotation PDFs use Cloud Storage by default
(THEATER_MEDIA_BACKEND=storage). Real uploads and downloads were verified on
24 October after the project billing upgrade. Both anonymous and signed-in
Firebase clients receive 403 for direct private-file downloads. Files carry
private/no-store cache headers and no Firebase download tokens; the authenticated
API checks ownership before streaming bytes.

The four existing Firestore media records were copied to Storage with SHA-256
verification. Their metadata points to the verified Storage copy; original chunks
and quotation snapshots remain intact. Legacy firestore: references are still
readable. The explicit firestore backend is retained for compatibility, while
Storage permission failures now fail closed rather than silently changing backend.
Use node scripts/migrate-theater-media.cjs for a dry run and --apply to copy/link
verified files without deleting originals. Production requires server-only Firebase
Admin credentials and the storage bucket environment settings; local credentials
are never included in Git. The connected Vercel account did not allow environment
management during this run, so hosted credentials must be verified independently.

Collections: theaterUsers, theaterProjects, theaterQuotes, theaterPrices,
theaterServiceRates, theaterRequests, theaterAudit and theaterMedia/chunks.
Project/quote lists paginate at 50 records. firestore.indexes.json includes
owner/date and project/date indexes; document payloads are excluded from indexes.

**Live rules:** firestore.theater-live.rules records the narrowly scoped theatre
protection applied to the previously open legacy rules. Root firestore.rules also
contains an independently prepared stricter website policy. Do not deploy the
whole root Firebase configuration without reviewing those separate website
permissions. The provisioning script backs up deployed rules and refuses unknown
rule shapes; it removes the theater namespace from the legacy public wildcard
before writing member data. The three theatre composite indexes are enabled.

The authorized hello@epixinfra.com account already existed and now has an active
admin workspace profile. Its password and public-site claims were not changed.
Create staff from Team; Send setup email is an explicit admin action, never
sent automatically. Self-demotion and self-disable are rejected.

### Migration and maintenance

The previous .theater-data/studio.db remains untouched as a local backup.
Runtime APIs no longer use SQLite. The one existing project, one quotation and
one price override were imported into Firestore; legacy ownership belongs to the
authorized admin, with creator shown as Legacy import - creator unrecorded.
Original creator identity is not invented.

```powershell
# Inspect before applying; credentials are read from local environment only.
pnpm theater:provision --email=hello@epixinfra.com
pnpm theater:migrate --owner-email=hello@epixinfra.com
# Append --apply only when intentionally performing the configured migration.
```

## Sales workflow

Choose projector models in Screen and role-specific models in Sound. Search,
brand, series, category, budget, relevant channel/light-output filters, comparison
and full specifications are available in the catalog. Apply closes the catalog
without resetting the room or camera. Matching-series suggestions are reviewed
before application. Audio-layout changes recalculate quantities and keep
inactive selections available for a later switch back.

Source dimensions with an explicit axis order and unit scale representative
speaker geometry and participate in geometric fit checks. Missing or ambiguous
dimensions retain the demonstration geometry. This is not a full manufacturer
CAD library, wall-cavity design, acoustic simulation or measured calibration.

Review quotation adds customer information, approved project work (or admin custom work), discounts,
scope, exclusions and validity. Save project persists it in the database; Save
on device separately stores the working room and selections in localStorage.
Projects can be reopened in a fresh browser session. Earlier PDF revisions remain
available from the quotation panel.

The server validates the saved state and recalculates all financial lines using
current database prices. It rejects stale catalog versions. A missing price,
tax rule, billing unit, required component or incompatible layout yields an
explicit incomplete budget estimate. Unknown items are excluded from the known
subtotal, listed for confirmation, and never silently priced at zero.

PDFs contain the preview, room summary, customer, itemized billing units,
discount/tax breakdown, scope, exclusions, confirmations and page numbering.
They are generated from the stored snapshot, not current catalog prices.

## Current verification

The current combined suites pass 67 distinct tests: 44 design/sales tests,
5 access-policy tests, 5 quotation/navigation tests and 13 Firebase emulator integration tests. Integration
tests exercise actual Auth, Firestore and Storage emulator services, including
cross-user reads, forged ownership, direct price/rate tampering, immediate
discount-limit changes, private PDFs/media, pagination and concurrent edits.
The production build and TypeScript check pass. Existing metadata-viewport and
dependency deprecation warnings remain outside the theatre changes.

### Reproduce Firebase integration checks

Start the emulators in one PowerShell terminal (Java 21 or newer required):

```powershell
pnpm --filter @epix-infra/marketing exec firebase emulators:start --config ../../firebase.json --project demo-epix-theater --only 'auth,firestore,storage'
```

Then in a separate terminal:

```powershell
$env:FIREBASE_ADMIN_PROJECT_ID='demo-epix-theater'
$env:FIREBASE_STORAGE_BUCKET='demo-epix-theater.appspot.com'
$env:FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099'
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
$env:FIREBASE_STORAGE_EMULATOR_HOST='127.0.0.1:9199'
pnpm test:theater:firebase
```

Tests refuse to run against the real project. They do not read .env.local.
If Java fails binding an AF_UNIX socket on Windows, use this process-local
fallback before starting the emulator:

```powershell
$env:JAVA_TOOL_OPTIONS='-Djdk.net.unixdomain.tmpdir=./nonexistent-epix-java-sockets -Djava.net.preferIPv4Stack=true'
```

The optional theater:seed-emulator command creates clearly named demo accounts
only in demo-epix-theater. For browser QA, also set THEATER_QA=1, the matching
NEXT_PUBLIC_FIREBASE_* demo settings, and
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 before starting Next on
port 3011. THEATER_QA isolates its Next output from the normal .next directory.
Never set emulator variables on the real deployment.

The domain suites cover room/drag constraints, catalog completeness, original
price spot checks, pair aggregation, exact inclusive totals, discounts, unpriced
items, receiver channel limits, projector selection, package suppression,
validation, database conflict handling, idempotency and snapshot immutability.
Browser testing covers product selection, live totals, a reversible pricing
update, saving/reopening a project and PDF generation. QA uses a clearly named
demonstration customer and a demonstration screen rate, not a commercial offer.

## Illustrated quotation update - 24 October 2026

Successful sign-in and restored sessions automatically return to the room builder.
A safe next parameter can return to a requested theatre route. External URLs,
backslashes, login loops and other application routes cannot become return targets.
Projects & quotations remains a separate workspace navigation item.

The quotation review shows each product image, expandable model features and a
readiness checklist. Current and historical saved revisions open an authenticated
PDF preview with a download link. The preview object URL is revoked when closed.
PDF.js renders one page at a time inside the app, with previous/next, zoom
and accessible page text. It does not depend on a browser PDF plugin. Download
remains available independently. Employee price/GST and discount rules are unchanged.

The A4 v2-illustrated template includes the current Epix logo, company and customer
details, room preview and feet-first specifications, model photos/descriptions,
pack quantities, list tax basis, GST, discounts and totals, confirmations, scope,
exclusions, bank reference and signatory space. Company details come from the
user-supplied July 2026 sample; payment/delivery terms are never inferred from it.
New quotations snapshot company details. Their financial values remain immutable.
Versioned private PDF paths prevent the older cached layout from masking this update.

prepare-theater-images.py produces bounded, content-addressed JPEGs under
public/theater-catalog/quotation. Historical image files are retained; PDF rendering
needs no network image fetch. New quotes snapshot JPEG paths; older quotes resolve
photos by exact product ID. Model-name guesses and arbitrary filesystem paths are
not allowed. Next output tracing includes these assets in the PDF route bundle.

The original PDF importer reapplies reviewed image overrides and regenerates these
JPEGs. Manufacturer source URLs and review dates are recorded in image-overrides.json.
Brand/model photos may show a different finish; the selected finish is always stated.

The demonstration PDF in output/pdf is a visual sample only, with fictitious client
details and explicitly disclosed demonstration service rates and receiver GST. It
is not an actual client offer and does not modify the production price catalog.
The reference sample also contains BenQ and Marantz equipment; these brands were
not part of the original nine approved price lists and were not invented/imported
from a single customer quotation. Add approved source lists before quoting them
through the model library.

PDF preview uses a lazy PDF.js import and a local version-matched worker.
The worker and its license are prepared by postinstall/predev/prebuild. Node
22.13 or newer is required by the current PDF.js package. No PDF content is
sent to an external viewer. The render task and worker are cancelled when the
preview closes; one page at a time keeps mobile memory bounded.

Use THEATER_BUILD_CHECK=1 for an isolated production build under
.theater-data/build-check when the ordinary dev server is already running.

Browser verification on 24 October confirmed fresh employee sign-in to the
builder, restored-session return to the dashboard, illustrated quotation review,
saved revision generation, PDF.js page navigation and a completed PDF download.
The downloaded three-page PDF was reopened and checked for its quotation number,
selected model and exact total. At 390px width the review and PDF dialogs remained
within the viewport without page-level horizontal overflow. The isolated production
build and TypeScript passed after the PDF.js viewer was added.

## Docked builder workspace

The builder uses the full browser viewport with a docked configuration panel.
Room, Seating, Screen and Sound use Radix tabs with arrow-key navigation. Camera
controls sit outside the canvas. On phones the preview remains above an
independently scrolling configuration panel, with a compact camera selector and
44px touch controls. Selected-object positioning appears inside the panel.

The live quotation is a collapsed-by-default disclosure inside the staff panel;
expanding it reveals Projects and Review quotation without covering the scene.
Design tools in the header contain load, image/report export, editable backup
and reset. Layout checks are a separate expandable status strip. The global
website footer is omitted from /home-theater-builder and its staff subroutes.
Other public pages retain the website footer.

Local browser verification on 24 October covered 1280x720, 768x1024 and 360x800
without document overflow, live dimension changes, keyboard tab navigation,
object selection, quotation expansion, quotation review and saved-project access.
The isolated employee session used Firebase emulators. All 54 non-emulator theatre
tests passed. This layout is included in the subsequent Storage release.
