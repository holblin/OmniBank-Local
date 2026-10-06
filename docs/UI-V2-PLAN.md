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


## Six themes and compact layouts

- Added official Stone, Gothic, Y2K and Butter alongside Neutral and Matcha.
- Compact spacing is independently saved for each theme; Gothic uses dark mode.
- Production build and all nine browser checks passed, including all six themes
  at 320px and separate compact preferences surviving reloads.
- Captured and visually inspected all six compact desktop layouts plus Gothic
  mobile in `screenshots/ui-v2/themes/`. No external runtime requests or browser
  errors were observed.


## Budgets, summary and transaction history

- Migrated core budget management, envelope details/adjustments, financial summary
  filters/chart/tables/export, and paginated transaction management to V2 routes.
- V1 switch opens the corresponding V2 page; sidebar and dashboard links use
  TanStack Router. Reused existing backend accounting and audit APIs.
- Added optional transaction date/type/reconciliation query filters, applied before
  pagination. Fixed a missing HTTPException import in the budget router.
- Shared guarded loading and idle lock across pages; retained failed form input.
- Production build, sixteen Chrome browser checks and eleven CSV/accounting checks
  passed. Captured desktop/mobile screenshots with synthetic data and corrected
  crowded history rows on mobile.
- Attachments, recurrence setup and AI budget tools remain available in V1.


## StyleX foundation

- Confirmed `@astryxdesign/core`, `@stylexjs/stylex`,
  `@astryxdesign/theme-neutral` and `@astryxdesign/cli` are installed in V2.
- Ran the installed Astryx CLI's `init` command through pnpm and read the generated
  `ui-v2/AGENTS.md`, layout, token and StyleX authoring guidance. Documented the
  configured compiler outside the CLI-managed section.
- Added the official Vite StyleX plugin and migrated all three CSS modules and
  inline page styles to compiled StyleX. Astryx overrides use `xstyle`; DOM nodes
  use `stylex.props`. Published color, spacing, radius and type tokens follow
  each theme, with explicit compact variants. Global CSS covers reset/print only.
- Corrected sidebar offsets, responsive table columns, compact history cells and
  print framing during screenshot review. Added layout/print regression checks.
- Production build and all seventeen Chrome browser checks passed. Production
  and Vite hot reload both rendered without browser errors or horizontal overflow.
- Refreshed dashboard, migrated-page and six-theme screenshots with synthetic data.


## Shared virtualized tables and clean UI diff

- Pushed project skills and GSD cleanup directly to the holblin fork's main as
  `75440b0`, then merged that baseline into the UI branch. `.agents` and `.planning`
  no longer appear in the UI diff; no V2 implementation was merged into main.
- Replaced every V2 table with the shared Astryx/TanStack Virtual component.
  Long tables use measured rows and overscan; headers stay in one scroll region.
  Spacer rows retain native table layout and the full sticky containing block.
- Kept server pagination and financial APIs. Preserved record keys, offscreen
  focused actions, keyboard Home/End, theme density and full loaded-row printing.
- Production build and nineteen Chrome checks passed, including a 1,000-row
  variable-height fixture, reaching the last row, complete printing, sticky
  headers in all six compact themes on desktop/mobile and correct edited records.
- Refreshed table screenshots and verified sticky headers in production and
  the Vite development server with no browser errors.

## TanStack Query and dialog actions

- Replaced the custom resource loader and React fetch effects with TanStack
  Query. Added a strict TypeScript server-state layer with domain/profile/filter
  keys and colocated query functions; kept a thin same-origin fetch transport.
- Shared account/budget queries reuse their cache across routes. Refreshes retain
  data and expose background/stale states. Initial loading, errors, empty results,
  cancellation, local offline access and guarded financial queries are preserved.
- Mutation invalidation targets affected domains within the active profile.
  Reconciliation uses optimistic snapshots and rollback; financial amounts and
  balances remain authoritative. The in-memory cache clears on PIN lock.
- Replaced inline editors with Astryx Dialog and native header/content/footer
  layout. Added IconButton tooltips and separate transaction/budget copy drafts.
  Deletion and archive actions use AlertDialog, including allocation deletion as
  a separate step. Failed writes retain drafts or confirmations; focus returns
  after closing. Fixed a narrow-screen header overlap found in screenshots.
- TypeScript checking, production build and twenty-five Chrome checks passed.
  Added cache reuse, failed background refresh, optimistic rollback, targeted
  invalidation, confirmation cancellation/failure, duplication, focus restoration,
  delayed-access refresh safety and six-theme compact dialog checks at 320px.
- Captured desktop/mobile pages and edit/delete dialogs against isolated synthetic
  preview data; no browser errors or mobile dialog overflow were reported.

## Browser review refinements

- Made the shared shell grow to viewport height and keep the footer after long
  content. History measures available space below filters while reserving room
  for pagination/footer, leaving blank space inside short and empty table views.
  Resize, density, theme and filter/status changes update its measured height.
- Restored relative-value summary shading from V1 using theme success/error/accent
  colors, neutral zero cells and an adjustable color-intensity control. Financial
  values and exports are unchanged; the stronger tint follows the larger amount
  within each transaction-type table.
- Marked Accounts, Recurrences, Assistant and Settings links as V1 and provided
  translated explanations of the interface switch.
- TypeScript checking, production build and all twenty-eight Chrome checks passed.
  Added short/empty table fill and footer checks at the reported viewport sizes,
  six-theme shading and intensity-disable checks, and V1-link checks. Reviewed
  refreshed screenshots; the compact 1279x1111 preview footer ends at pixel 1111,
  with no browser errors and blank space inside one-row/empty table views.
