# Theatre layouts and item pricing

## Speaker configuration

Sound offers 5.1, 5.1.2, 5.1.4, 7.1.2, 7.1.4, 7.2.4, 7.1.6 and 9.1.4 presets.
The final two contain 14 physical speakers including the subwoofer. Custom layouts
combine 5/7/9 ear-level speakers, 1-4 subwoofers and 0/2/4/6 overhead speakers,
with a maximum of 16 physical speakers. Unsupported combinations are disabled and
rejected during saved-design parsing. This is channel selection within supported
symmetrical layouts, rather than arbitrary independent cabinet placement.

One layout definition drives the 3D scene, channel counts, equipment requirements,
pack rounding, compatibility checks and proposal labels. Nine ear-level channels
add a front-wide pair. Six overhead channels add a top-middle pair. Ceiling,
front-wide and rear speakers stay fixed when the primary seat moves; only its side
surrounds follow it. Seating collision stops and projector throw limits still apply.
Receiver processing and amplification are checked separately; front-wide, six-height
and multiple-sub output assignments require manufacturer verification.

Placement references:
- [Dolby 7.1.6](https://www.dolby.com/siteassets/about/support/guide/setup-guides/7.1.6-overhead-speaker-placement/7_1_6_overhead_speakers_setup.pdf)
- [Dolby 9.1.4](https://www.dolby.com/siteassets/about/support/guide/setup-guides/9.1.4-overhead-speaker-placement/9_1_4_overhead_speaker_setup.pdf)

## Preview and pricing

Every product/service row in quotation review has its own discount percentage,
maximum allowance, savings and final total. Apply to all resets item overrides and
sets the starting percentage, capped separately for each brand. Identical product
IDs with the same finish are grouped before pair/set rounding and share one discount.

The allowed percentage is the lower of the employee allowance and brand cap.
Rotel is capped at 10% for every role, including extras. Global defaults are capped
in the calculator; forged explicit item overrides are rejected by fresh membership
checks in the project and quotation transactions. No Rotel products or prices are
invented; this policy applies when those catalog items are supplied.

Sound has a single optional Soundproofing - acoustics service per room, initially
INR 35,000. Its custom price and item discount are edited in quotation preview.
Employees can override this service price only; its service code, category,
description and quantity identify this narrow exception. All other employee work
rates must match an active administrator-approved rate. Duplicate service IDs or
multiple acoustics add-ons are rejected.

Catalog and service amounts are final inclusive prices. The calculator rounds line
gross to whole paise, then subtracts each item's rounded discount. Source tax
metadata is preserved for audit/history but does not create pending prices or add
amounts. Admin pricing, CSV exports, team rates, model selection and new PDFs omit
separate tax fields and labels.

## Saved records and PDFs

Optional customAudio and lineDiscounts fields retain compatibility with existing
projects. Missing line overrides use the project's original default discount.
New quotations use templateVersion 3 and pricingMode inclusive. Issued snapshots
are immutable. Existing cached v2 PDFs are returned unchanged; historical snapshots
without a cached PDF retain their original line totals when rendered.

New projects default to the 11 clauses from Mr Subramanyam garu Klipsch +benq.pdf,
page 2. The normalized text and source SHA-256 are recorded in quotation-terms.json;
source wording is retained. Customer notes remain editable. Terms paginate at the
end after the bank/signature block, with the standard clauses kept together where
possible.

Verification: focused calculation/geometry/access tests, Firebase emulator API and
private media tests, production build, Chrome interaction with the public layout
controls, and rendered sample quotation pages. QA samples are kept outside Git in
.theater-data.
