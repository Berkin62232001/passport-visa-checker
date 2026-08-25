# Passport Visa Checker

Interactive world map that shows visa requirements for any passport. Select your passport country and instantly see which destinations are visa-free, require an e-visa, or need a full visa application.

**Live demo:** _coming soon — update this link with your custom domain after deployment (search for `YOUR-DOMAIN.com` in `index.html` too)._

## Features

- **199 passport countries** — select any passport and see requirements for every destination
- **Color-coded world map** — green (visa-free), yellow (e-visa / visa on arrival), red (visa required), blue (home country)
- **Click any country** for detailed visa info, allowed duration, recent policy changes, and travel tips
- **Live stats bar** showing visa-free, e-visa, and visa-required counts
- **Search with autocomplete** — find your passport country instantly
- **Responsive design** — works on desktop and mobile
- **Dark theme** with smooth animations

## Data & Accuracy

Visa requirement data is sourced from the open-source [Passport Index Dataset](https://github.com/imorte/passport-index-data) (MIT license).

- Data is **automatically updated weekly** via GitHub Actions
- Each update is **validated for schema correctness and anomaly detection** before being committed
- **SHA-256 integrity checks** detect accidental data corruption
- A staleness warning appears if data is older than 60 days

> **Disclaimer:** Visa requirements change frequently. Always verify with official embassy or consulate sources before making travel plans.

## Tech Stack

- **Pure HTML / CSS / JavaScript** — no frameworks, no build tools
- **Leaflet.js** — interactive map rendering
- **TopoJSON** (world-atlas) — lightweight country boundaries, vendored locally
- **GitHub Actions** — automated data pipeline
- **Netlify** — static hosting + security headers (`_headers`)

## How to Run Locally

Run it with a local server. Opening `index.html` directly as `file://` will not work because browsers block `fetch()` from reading the local JSON data files.

```bash
npm run dev
```

Then visit the localhost URL printed in Terminal.

## Project Structure

```
.
├── index.html                          # Main page
├── favicon.svg                         # Brand mark (gold compass on dark)
├── site.webmanifest                    # PWA manifest
├── robots.txt / sitemap.xml            # SEO basics (update domain post-deploy)
├── css/style.css                       # Dark theme styles
├── js/
│   ├── app.js                          # Map logic, UI, interactions
│   ├── visa-data.js                    # COUNTRY_INFO (names + flags) + ENRICHMENT_DATA (per-route tips)
│   ├── country-facts.js                # COUNTRY_FACTS (capital/language/currency/timezone/region) + STATUS_TEMPLATES
│   ├── visa-data-loader.js             # Data loading with integrity checks
│   └── vendor/
│       └── topojson-client.min.js      # TopoJSON → GeoJSON (vendored, no CDN dep)
├── _headers                            # Netlify security headers (CSP, X-Frame-Options, …)
├── data/
│   ├── passport-index-validated.json   # Validated visa data (auto-updated)
│   ├── countries-110m.json             # Vendored world-atlas map geometry
│   └── data-meta.json                  # Update metadata + SHA-256 hash
├── scripts/
│   └── validate-and-update-data.js     # Data validation pipeline
└── .github/workflows/
    └── update-visa-data.yml            # Weekly auto-update workflow
```

## Before Deployment

- Replace `https://YOUR-DOMAIN/` with the live host everywhere it appears: `robots.txt`, `sitemap.xml`, and the `canonical` / `og:url` / `og:image` / `twitter:image` tags in `index.html`.
- Social card (`og-image.png`, 1200×630) and the PWA / Apple-touch icons are already generated at the site root.
- Commit everything first — `js/vendor/` and `js/country-facts.js` must be tracked, or the deployed map and info panel break.
- Verify the live URL has gzip/brotli enabled (GitHub Pages, Netlify, Vercel all do by default).

## Security

- Content Security Policy (CSP) pinned to the exact external files used, delivered
  both as HTTP headers (`_headers`, Netlify) and a `<meta>` fallback
- Clickjacking protection via `frame-ancestors` / `X-Frame-Options` headers
- Subresource Integrity (SRI) on CDN scripts
- Map geometry vendored locally (`data/countries-110m.json`) — no third-party CDN
  needed at runtime (pinned jsDelivr mirror kept as fallback only)
- HTML escaping on all externally-sourced data
- SHA-256 corruption detection on visa data files (HTTPS is the real trust boundary)
- Anomaly detection blocks suspicious data changes (>25% change threshold)
- No API keys, no secrets, no backend — fully static

## License

MIT © 2026 Berkin YILMAZ
