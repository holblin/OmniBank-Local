# V2 page completion

Finish the native V2 navigation using the existing Astryx page frame, compiled
StyleX tokens, TanStack Router, Query, Charts, and Virtual. Keep V1 available as
an explicit alternative. No financial records belong in browser storage.

Coverage: accounts (including loans), categories, recurring templates and
generation, trends, scenarios, local assistant conversations, configuration,
profiles, backups, diagnostics, license, bank connections and pending review,
and the action journal. Dashboard, budgets, summary, and transaction history
already exist and remain supported.

Validation: compile and typecheck; exercise native navigation in French and
English, desktop and mobile; exercise writes and confirmation dialogs against
an isolated local backend; check screenshots and console errors. Bank providers
and Ollama require user-configured local services and cannot be exercised live
without those services. Record any remaining workflow gaps explicitly.

## Delivered

All main routes now stay in V2, including accounts, categories, recurrences,
trends, overview, scenarios, assistant, settings, bank synchronization, journal,
imports, notifications, setup and unlock. Secondary pages load on demand through
TanStack Router. The shared Astryx tables keep sticky headers and virtualization;
row actions use tooltips, editors use dialogs and destructive writes require
confirmation. Profile changes clear the in-memory query cache.

Settings include profile/PIN management, backup/restore, diagnostics, license,
organization users, label rules, exchange rates, assistant memory, shared storage
and maintenance. History includes attachment upload/removal and recurrence links.
Accounts include loan/savings details, interest and balance adjustments.

## Verification results

- Production build and strict TypeScript server-layer check passed.
- Vite hot reload renders accounts, settings, assistant and bank pages without
  browser errors.
- All 38 Chrome browser checks passed against an isolated temporary backend.
  Coverage includes real account/category/recurrence/scenario writes, profile
  isolation and PIN removal, dialogs, failed writes, local assistant proposals,
  simulated bank streams/mapping/review, maintenance payloads, six themes,
  responsive layouts, sticky headers and a 1,000-row virtualization fixture.
- All 8 finance resilience and CSV autopilot benchmark checks passed.
- The final translation additions passed desktop/mobile route and English checks.
- Captured desktop/mobile screenshots for the remaining pages with synthetic data;
  no page errors. Corrected clipped actions, table backgrounds and caption alignment.

## Remaining parity and integration limits

Live bank authentication and Ollama inference require configured services. Tests
mock those stream responses and validate the local review/write paths. V1's
specialized recurrence timeline/renewal wizard and bank bulk-review helpers are
not reproduced; V2 provides individual template, generation, mapping and review
workflows. Docker and Tauri packaging were not exercised during this page work.
