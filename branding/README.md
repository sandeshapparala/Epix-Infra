# Epix Infra approved logo exports

The original supplied clean wordmark and circular artwork are retained in `source/`.
Website exports preserve the original photographic lettering and colours on a white
backing. The compact header version omits the small tagline for legibility. It is
also exported to legacy logo paths so existing pages display the approved branding.
The full logo includes INTERIOR | EXTERIOR | HOME THEATRE. The proprietor portrait
from the other supplied presentation images is not part of the website logo.

- `public/brand/epix-infra-logo.png` / `.webp`: full logo and tagline.
- `public/brand/epix-infra-wordmark.png`: compact EPIX / INFRA header logo.
- `public/brand/epix-infra-emblem.png`: circular logo.
- `public/brand/epix-infra-symbol.png`: original E, padded for square favicons.
- `src/app/favicon.ico`: 16, 32, 48 and 64 px entries.
- `public/favicon-16x16.png`, `favicon-32x32.png`: browser PNG alternatives.
- `public/apple-touch-icon.png`, `public/brand/icon-{192,512}.png`: large icons.

Run `node scripts/prepare-brand-assets.cjs` to reproduce the image exports using
the Sharp version provided by Next.js. These are raster exports of supplied
artwork; no SVG tracing or new letterforms are used.
