# Theatre catalog source updates

The catalog contains 498 entries across 12 brands. The October 2026 import adds
83 entries to the original 415 without changing any original product record:

| Brand | New entries | Source handling |
| --- | ---: | --- |
| Marantz | 40 | October list takes precedence for the same model. July Cinema 50 and Cinema 60 remain separate from October Series 2 editions. |
| Sony | 36 | 20 professional displays, 9 projectors, 3 lenses, 1 software licence and 3 unidentified accessory codes. |
| BenQ | 7 | W2720i, W4100i, GP520, TK705i, TK705STi, TK710 and TK710STi. Four supplied screenshot prices; three brochure models remain on request. |

## Rebuild

Keep the supplied PDFs outside the repository in `../home 3d/new`. Install Python
dependencies `pdfplumber`, `pymupdf` and `Pillow`, then run:

```powershell
python scripts/import-theater-catalog-additions.py --source "D:/WORK/Epix Infra/home 3d/new"
pnpm test:theater
```

The importer merges source products by stable brand/model ID, records PDF page
and SHA-256 provenance, and rebuilds bounded quotation JPEGs. The original
`import-theater-catalog.py` also includes these additions when the `new` source
directory is present. Reviewed downloaded photos and supplementary specifications
are tracked in `src/data/theater/catalog-additions-details.json`; photos are local
assets, so neither catalog browsing nor quotation rendering depends on remote
image availability.

Do not infer prices, GST rates, lens ratios, model generations or enclosure axis
order from a similar product. Historical tax metadata is retained only as source provenance.
Three Sony ZM2810 accessory codes have no supplied description;
their selling units remain unconfirmed. The software licence and unidentified
codes use clearly labelled catalog identity cards, rather than unrelated hardware
photographs. Hardware entries have supplied or reviewed model photos.

## BenQ October-December 2026 update

Two supplied price-list screenshots add TK710 and TK710STi and provide final
inclusive amounts: TK705i INR 219,990; TK705STi INR 235,000; TK710 INR 259,990;
TK710STi INR 299,990. W2720i, W4100i and GP520 still have no supplied price.
The screenshots, page references, validity and hashes are recorded in
`benq-price-updates-2026-10.json`. The importer applies these updates after the
brochure merge and retains all 17 source manifests.

Exact model photos and optical specifications come from the recorded official
BenQ model pages/manuals. The image preparation step creates local bounded
quotation JPEGs. Previously issued quotation images remain available.

All 36 Sony entries are unchanged pending the user's confirmation of the Sony
selection scope; no display, lens or accessory records have been removed.

## Application behavior

- Sony displays are selected in the Screen tab in TV mode. Selecting a model sets
  its actual diagonal; changing a room preset cannot resize that physical model.
- AV processors have zero internal amplifier channels. Dedicated power amplifiers
  provide their stated channel counts. Stereo and distribution equipment remains
  available under extras, rather than being treated as cinema power amplification.
- Firestore supplies approved price overrides over the source catalog. Importing
  new seed products requires no Firestore migration and does not overwrite team
  pricing or previously issued quotation snapshots.
- Admins confirm final selling prices and selling units on the protected pricing
  page. All amounts are treated as inclusive final prices; no separate tax is
  added or displayed. Missing amounts and unconfirmed selling units stay pending.
  Price CSVs contain model identity, amount, selling unit, pack size and revision.

Manufacturer specifications supplement supplied brochures where explicitly
recorded. Regional ES projector photo suffixes are retained in image provenance;
the Indian price-list model names remain unchanged.
