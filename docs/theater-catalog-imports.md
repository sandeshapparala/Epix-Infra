# Theatre catalog source updates

The catalog contains 496 entries across 12 brands. The October 2026 import adds
81 entries to the original 415 without changing any existing product record:

| Brand | New entries | Source handling |
| --- | ---: | --- |
| Marantz | 40 | October list takes precedence for the same model. July Cinema 50 and Cinema 60 remain separate from October Series 2 editions. |
| Sony | 36 | 20 professional displays, 9 projectors, 3 lenses, 1 software licence and 3 unidentified accessory codes. |
| BenQ | 5 | W2720i, W4100i, GP520, TK705i and TK705STi. No prices are supplied in their brochures. |

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
order from a similar product. Historical tax metadata is retained only as source provenance. BenQ prices
remain on request. Three Sony ZM2810 accessory codes have no supplied description;
their selling units remain unconfirmed. The software licence and unidentified
codes use clearly labelled catalog identity cards, rather than unrelated hardware
photographs. Hardware entries have supplied or reviewed model photos.

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
