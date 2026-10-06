# OmniBank UI V2

An opt-in dashboard built with React 19, Vite, Astryx, TanStack Charts and
TanStack Router. The existing interface remains the entry point; click
**Essayer la V2 / Try V2** to open `/v2`.

## Run locally

Node.js 22.12+ and Python 3.12+ are recommended. Install the backend requirements
in a virtual environment first. From the repository root:

```sh
pnpm --dir ui-v2 install --frozen-lockfile
pnpm --dir ui-v2 build
python -m uvicorn app.main:app --host 127.0.0.1 --port 8434
```

Open `http://127.0.0.1:8434/v2`. The production bundle is generated in
`static/v2/`, which is ignored by Git. Build it before running the app or
packaging the Python sidecar. No Node process or network connection is needed
to use the built interface. Fonts, styles and libraries are all local assets.

The Docker image builds V2 automatically in a Node build stage. Docker Compose
mounts the host `static/` directory, so build V2 on the host before using Compose.
The Tauri build and standard `build_sidecar_onedir.ps1` script compile V2 before
collecting assets; install the frontend dependencies before packaging.

For hot reload, keep the backend running and use:

```sh
pnpm --dir ui-v2 dev
```

Open `http://127.0.0.1:5173/v2`. The Vite server proxies local API requests to
port 8434; links to classic workflows open the backend's original interface.

## Themes

The header selector offers official Astryx Neutral, Stone, Gothic, Matcha,
Y2K and Butter themes. Matcha is the default. Gothic uses its dark palette.
Theme stylesheets are bundled locally, with no external runtime requests.

The **Compact** toggle reduces card spacing, sidebar rows and transaction row
height. Its preference is saved independently for each theme in
`omni_v2_compact_themes`; the selected theme is saved in `omni_v2_theme`.

Run `node tests/capture-themes.mjs` from `ui-v2` against the isolated synthetic
preview to capture compact screenshots for all six themes.

## Structure

| Directory | Responsibility |
| --- | --- |
| `src/router.jsx` | TanStack route tree rooted at `/v2`; unknown-route fallback |
| `src/pages/` | Page composition and dashboard state |
| `src/components/` | Reusable UI pieces and scoped CSS modules |
| `src/styles/tokens.css` | Shared design tokens and Astryx theme overrides |
| `src/lib/` | Same-origin API client, formatting and language context |
| `src/locales/` | Small generated V2 dictionaries, extracted from shared i18n |
| `tests/` | Synthetic fixtures, browser checks and screenshot capture |

Financial totals come from the existing backend. The chart includes all
transactions, including pending ones; summary/account cards use reconciled
balances, matching the original UI. The account selector filters the chart and
recent activity; summary cards and budgets cover the active profile. Each account
uses its own currency. A savings envelope total is distinct from savings account
balances. Recent activity excludes future transactions through `date_end`.

The other screens and transaction form still open in V1. Existing PIN lock state,
PIN idle timeout and organisation user selection are respected. No profile switch,
edit or banking sync is introduced in V2.

When adding a translation, update `scripts/setup_ui_v2_i18n.py` and run it with
Python from the root. It preserves existing keys and writes French/English JSON
with the required UTF-8 BOM. Commit the generated dictionaries with the change.

## Verify

After building:

```sh
pnpm --dir ui-v2 exec playwright install chromium
pnpm --dir ui-v2 test
```

The tests start a separate backend on port 8436 with a temporary SQLite data
directory and synthetic fixtures. They do not touch the normal data directory.
Set `PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome instead of Playwright's
downloaded Chromium. The development preview captured for this change uses
`OMNIBANK_DATA_DIR=./data/ui-v2-preview`, which is also ignored by Git.

`tests/capture.mjs` seeds the local port 8434 server with synthetic data and writes
desktop/mobile PNGs into `screenshots/ui-v2/`. Run it only against a preview server
started with that isolated data directory.

## Project skills

All 38 skills from `mattpocock/skills` and `theclaymethod/unslop` are installed in
the repository's `.agents/skills/`. They are available on the next chat turn.
Personal skills remain untouched. GSD configuration and planning files have been
removed; the implementation plan now lives in `docs/UI-V2-PLAN.md`.
