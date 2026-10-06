# UI V2 dashboard

GSD entry-point bypass explicitly approved by the user on 2026-10-06.

## Scope

- Add an opt-in V2 switch to the existing interface and a return link.
- Use TanStack Router for V2 navigation and TanStack Charts for balance history.
- Isolate a React 19 / Vite / Astryx frontend in `ui-v2/` with CSS modules,
  shared tokens, reusable components, an API client and bilingual dictionaries.
- Use existing on-device APIs for dashboard statistics, accounts, budgets and
  recent transactions; preserve backend accounting calculations.
- Bundle all assets locally and serve the production build through FastAPI.
- Keep unfinished workflows accessible through the existing interface.

## Verification

- Production build and automated browser checks against a local backend.
- Desktop and mobile screenshots, visual inspection and corrections.
- Check language switching, account filtering, loading, empty and error states,
  navigation to the original UI and absence of external runtime requests.
- Push the validated branch to GitHub, creating a holblin fork if needed.

## Results

- Implemented the dashboard, V1 entry/return links, local assets, bilingual UI,
  account filtering, budget progress and accessible chart data.
- Removed project GSD configuration; backed up planning files outside the checkout.
  Installed all 38 Matt Pocock skills plus Unslop under `.agents/skills/`.
- Production Vite build passed. Seven Playwright browser checks passed in Chrome,
  using an isolated temporary SQLite backend.
- Eleven targeted backend CSV/accounting benchmark checks passed.
- Captured and visually reviewed `screenshots/ui-v2/dashboard-desktop.png` and
  `dashboard-mobile.png` using synthetic data. Corrected action/badge contrast,
  control styling and mobile screenshot transition timing. No browser errors or
  horizontal overflow remained.
- GitHub fork: `holblin/OmniBank-Local`; branch: `codex/ui-v2-dashboard`.
- Docker and native Tauri packaging hooks were updated but those builds were not
  executed in this environment.


## Theme switcher follow-up

- Added the official Astryx Matcha package as the default, with Neutral selectable
  in the header. The choice persists locally across reloads and language changes.
- Dashboard surfaces and TanStack chart colors follow the selected palette.
- Production build and eight Chrome browser checks passed. Updated and reviewed
  desktop/mobile screenshots; no browser errors or horizontal overflow.
