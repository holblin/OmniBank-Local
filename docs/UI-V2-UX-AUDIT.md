# V1/V2 workflow improvements

Audit: 6 October 2026. Starting V2: `0eccdae` (first-launch onboarding and native feature parity). This pass compares how people reach and complete tasks, independently of theme colors. The [Astryx research report](UI-V2-ASTRYX-RESEARCH.md) records all 49 live gallery entries, all 55 installed page templates, official guidance, and which patterns fit OmniBank.

## Comparison and implementation

V1's strength is continuity: navigation exposes the working destinations, actions stay close to their records, and task-specific tools appear in context. Earlier V2 work restored those features but often stacked them into one screen. The improvements below retain V2's themes, density preferences, query caching, optimistic reconciliation, draft-preserving errors and virtualized tables.

| Surface | V1 strength / earlier V2 friction | Implemented improvement / retained behavior |
| --- | --- | --- |
| Shared navigation | V1 exposes many finance destinations. V2 left imports, bank sync, notifications and other secondary pages under settings. | Astryx SideNav groups Finance, Analysis, Data/imports and Tools; every working route has a selected-state link. Profile entry opens the Profiles settings section. Classic-interface links retain their corresponding V1 view. |
| Mobile navigation | A drawer is a separate interaction region. V2's translated-offscreen sidebar remained in the DOM, and appearance controls consumed three header rows. | Astryx Dialog owns focus containment, Escape dismissal and focus return. Desktop navigation is unmounted on narrow screens; choosing a destination closes the menu. Theme, density and language move into the menu, leaving room for the page title and privacy/undo controls. |
| Dashboard | V1 creates operations in context; V2's main action sent users to history. | The shared TransactionEditor opens on the dashboard, preselects the current account, and refreshes financial queries after saving. Quick links expose reconciliation, imports and bank sync. |
| Overview | V1 places pay controls and timeline actions close to the financial overview. | Existing V2 cockpit/pay controls, timeline, skip/edit and reconciliation remain. Shared navigation and editor improvements apply here too. |
| History | V1 offers configurable rows and contextual filters. V2 exposed date/type/status controls and specialist tools in a long stack. | Quick views for all operations, reconciliation and this month; visible search/account/status; disclosed dates/type/category; removable filter Tokens and reset; actionable empty results; a separate columns dialog. Cross-profile transfers follow the main ledger. Server filtering still precedes pagination. Counts explicitly describe displayed operations. |
| Budgets | V1 keeps envelope progress as the working surface. V2 placed bulk deletion and AI tooling before envelopes. | Envelope grid remains first; previous/next/current-month controls handle year boundaries; suggestions and bulk tools follow the grid. Empty archives return to active budgets; empty active budgets offer creation. |
| Recurrences | V1 separates daily model editing from annual planning. V2 surfaced annual renewal/propagation above ordinary records. | Renewal and propagation remain available under a labeled Astryx Collapsible after the model table. Generation, edit, closure and instance inspection remain native. |
| Summary | V1 supports category/account drilldown, export and printing. | V2's multi-account summaries, heat shading, CSV and complete printing remain. Shared page action hierarchy improves consistency; print controls remain hidden. |
| Accounts | V1 exposes import/sync and details alongside each account. | Existing V2 account actions, balance adjustments, loans, interest and color remain. Shared RecordEditor now pins commit/cancel actions. |
| Categories | V1 uses rows and direct editing. | Existing V2 CRUD stays in rows; the shared editor/footer and actionable empty state apply. |
| Trends | V1 offers periods, comparisons, statistics and zoom. | Native V2 controls and local series remain; grouped navigation exposes Trends directly and the generic page header separates primary actions from refresh. |
| Simulator | V1 keeps scenarios, events, assumptions and projections related. | Existing native V2 scenario/preset/compare workflows remain; shared dialogs pin their actions. No calculation or projection changes. |
| Import/export | V1 makes inspection, mapping and review a sequence. V2 showed actions without a clear stage. | Astryx Stepper and stage guidance indicate file → analysis → review → completion. Changing mode resets stale review/inspection state; mode/account controls are disabled during work. AI operations use secondary action styling. Existing editable review, confirmation and attachment-before-write ordering remain. |
| Bank sync | V1 exposes connections and review as a working destination. | Direct navigation replaces discovery through settings. Native review, mapping, vault, 2FA, exclusions and explicit writes remain. |
| Local assistant | V1 integrates transcript, sessions, tool output and context controls. | Existing native V2 streaming/context/tool-action review remains; direct navigation and pinned RecordEditor actions apply. No cloud service, model or prompt changes. |
| Settings | V1 separates configuration domains. V2 had a long horizontal destination list and one mixed preference editor. | Astryx SideNav groups sections; mobile uses adaptive Selector. General, Features, Local AI and Backups have focused preference tabs/editors. Selected section survives reload; each editor writes only its own fields. AI specialist tools use disclosure. |
| Profiles/access/setup | Contextual profile changes and PIN protection matter more than visual similarity. | Existing V2 profile/PIN/setup and session guards remain. Header profile entry now targets Profiles directly; shared dialogs retain focus and commit visibility. |
| Notifications/journal | V1 exposes supporting administrative records. | Both now appear in the shared navigation; existing batch controls and confirmations remain. |

## Astryx patterns used

The implementation adapts `shell-side-nav`, `settings-sidebar`, `table-filter`, `table-page`, `form-wizard` and `form-wizard-dialog` inside the existing page frame. It uses SideNav/SideNavSection/SideNavItem, Selector, TabList/Tab, HStack/VStack, Collapsible, Stepper/Step, Token, EmptyState, Spinner, Dialog and LayoutFooter. Existing financial widgets and virtualized Table remain useful.

App styles use typed Astryx tokens and compiled StyleX. The compiler now uses the same minified property keys as published Astryx components in development and production; otherwise `xstyle` overrides failed to merge with component styles. No dependency upgrade or generated component fork was necessary.

The official French component catalogue is bundled alongside the application translations, so dialog dismissal, removable tokens and adaptive selector messages follow the selected language offline.

## Verification and limits

Final results: strict TypeScript and production Vite build passed; **60 Chrome browser checks passed**; **15 accounting/backend checks passed**, including the external CSV round-trip. French/English key sets match, and both application locale pairs retain their UTF-8 BOM.

Browser tests use an isolated local backend with synthetic records. Screenshots contain no personal financial data. The [existing side-by-side gallery](ui-v2-comparison.html) is refreshed, with additional [desktop](../screenshots/ui-v2/workflows/history-desktop.png) and [mobile](../screenshots/ui-v2/workflows/history-mobile.png) workflow captures.

Checks cover real local transaction saving, account context, query invalidation, filter reset/empty states, column persistence, month/year transitions, section reload, preference isolation, mobile focus/Escape/navigation, 320px dialogs in six themes, printing and local-only runtime requests. The full suite also exercises native imports/attachment recovery, recurrence renewal, bank-review contracts, profile access, financial totals and virtualization.

Accounting regression checks include the external 2,468-operation import/export/import, amount/date/account equality and Decimal balance comparison. This does **not** resolve the pre-existing image/fixture discrepancy documented in [V1/V2 comparison](UI-V1-V2-COMPARISON.md#écart-entre-limage-et-les-fixtures). Live bank authentication and actual Ollama inference remain environment-dependent and were not exercised here.

Reproduce: strict TypeScript check, production Vite build, then the Playwright suite (`OMNIBANK_TEST_PYTHON` points to the project Python environment; `PLAYWRIGHT_CHANNEL=chrome` when using installed Chrome). For the accounting checks set a temporary `OMNIBANK_DATA_DIR` and `OMNIBANK_BACKUP_SAMPLE_DIR`, then run `pytest tests/test_backup_reference.py tests/test_csv_multi_account_import.py tests/test_finance_resilience.py tests/test_autopilot_benchmark.py -q`.
