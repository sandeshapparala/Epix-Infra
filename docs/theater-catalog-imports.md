# Theatre catalog source updates

The catalog contains 709 entries across 15 brands. The six October sources and
two BenQ screenshots added 83 entries to the original 415. Four further root price
lists add 211 entries while retaining all 498 existing product records:

| Brand | New entries | Source handling |
| --- | ---: | --- |
| Marantz | 58 | October list takes precedence for the same model. July Cinema 50 and Cinema 60 remain separate from October Series 2 editions. The June 2023 list adds 18 models missing from the 2026 lists; matching models retain newer prices. |
| Sony | 36 | 20 professional displays, 9 projectors, 3 lenses, 1 software licence and 3 unidentified accessory codes. |
| Rotel | 34 | Includes Michi, cinema processor, power amplifiers, stereo equipment and two 7.1.4 electronics bundles. |
| Sonus faber | 90 | Finish variants with matching prices share a model entry; explicit per-unit, pair and kit quantities are preserved. |
| Focal | 69 | Aria, Vestia, Theva, Littora, custom-install ranges, packages and accessories. |
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

All 36 Sony entries, including TVs, lenses and accessories, remain available as
confirmed by the user. Their records and prices have not been altered.

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

## Remaining root price lists

Run `python scripts/import-theater-remaining-catalogs.py` to rebuild the four
previously missing root lists. The original importer and additions importer also
include this step when those supplied files are present. All 13 root PDFs are
accounted for by source-file SHA-256; source PDFs remain outside Git. There are
21 source manifests including the newer six PDFs and two BenQ screenshots.

`remaining-catalog-evidence.json` records individual parsed rows, printed amounts
and page references before model grouping. Duplicate PDF text layers are ignored.
The Sonus list contributes 195 distinct printed price rows grouped into 90 model
and accessory entries. Same-price finishes remain selectable. Shared stand/kit
codes are deduplicated. KIT320FIN and KIT321FIN have conflicting printed prices
across Palladio ranges, so their amounts remain pending. Arena 20 and Arena 30
are separate models despite their duplicated printed item reference; both carry
an order-code confirmation note. No euro prices are converted or substituted for
the supplied INR column.

All existing records and Firestore price overrides are preserved. Old Marantz
prices cannot replace later editions. The new records contain source-extracted
product photos and bounded quotation thumbnails; 21 unpictured accessories have
clearly labelled reference cards rather than unrelated photographs. All main
new hardware models have supplied photos. Exact finish and included accessories
should be confirmed when ordering.

Rotel has an unconditional 10% item-discount ceiling for both roles, including
Michi products and bundles. A larger default discount is capped per Rotel item;
an explicit override over 10% is rejected by project and quotation APIs. Individual
Rotel power amplifiers expose their verified channel counts; both supplied
7.1.4 amplification bundles can fill the receiver/processor selection as an
11-channel electronics system. They never supply or suppress speaker selections.
