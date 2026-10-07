# Astryx templates and OmniBank workflow recommendations

Research date: 6 October 2026. Primary sources: the live [Astryx template gallery](https://astryx.atmeta.com/templates), official guides, and the installed `@astryxdesign/cli` 0.6.5 reference/source. This is a workflow audit; theme colors are outside its purpose.

## Coverage and method

The live gallery exposes **49 page preview buttons**. The installed CLI lists **55 page templates**: 52 ready and 3 marked work in progress. The six CLI entries absent from the live gallery are Basic Login, Blank, Theme Showcase, Incident Console, Messaging Shell, and Simple Table. The CLI separately lists **659 block/component examples**; these are not 659 additional page templates.

Every page entry below was checked against its official description and component skeleton. Relevant table, shell, settings, wizard, and assistant patterns received additional source inspection. The live gallery and Principles page were read in the browser. This research does not claim an interaction test of every preview, nor a 659-example implementation audit. Counts describe the catalogue observed on this date and package version.

Reproduction, from a frontend with Astryx installed:

```sh
pnpm run astryx template --list --type page --json
pnpm run astryx template --list --type block --json
pnpm run astryx template <id> --skeleton
pnpm run astryx template <id>
pnpm run astryx docs principles --full
pnpm run astryx docs layout --full
pnpm run astryx docs migration --full
```

The installed CLI's read-only `template()` API was also used to retrieve all 55 skeletons without scaffolding files. No package or application source changes were needed for this research. Upstream source: [facebook/astryx](https://github.com/facebook/astryx).

## Complete page catalogue

Names and IDs come from the [official gallery](https://astryx.atmeta.com/templates) and CLI. “Adopt” and “borrow” below are recommendations for OmniBank, rather than claims made by Astryx. The decisions preserve local APIs and existing financial calculations.

| ID | Official name | OmniBank fit and decision |
| --- | --- | --- |
| `ai-chat` | AI Chat Conversation | Adopt transcript/composer structure for the local assistant. Tool output stays attached to its message; financial writes retain explicit review. An artifact rail is optional, not required for ordinary chat. |
| `ai-chat-landing` | AI Chat Landing | Adopt its empty conversation composer and useful suggested prompts. Keep model availability/setup visible; omit dictation unless already supported locally. |
| `dashboard` | Analytics Dashboard | Adopt headline totals → chart → supporting records, with explicit shared filter scope. Avoid disconnected filters that appear to affect all totals. |
| `login` | Basic Login | Borrow centered, focused access structure for profile/PIN unlock. Do not add email/password authentication. CLI-only entry. |
| `blank` | Blank | Reference scaffold only; it offers no financial workflow. CLI-only entry. |
| `canvas-editor` | Canvas Editor | Reject artboard/layers/inspector interaction: financial records are not positioned objects. |
| `library` | Card Grid | Borrow category tabs and actionable empty states for budgets or profile selection. Use rows for high-volume financial collections. |
| `centered-hero` | Centered Hero | Reject marketing imagery/chrome for routine finance; a short welcome step can borrow its focused hierarchy. |
| `payment-form` | Checkout Form | Borrow grouped fields and a persistent review summary for complex financial drafts. Do not introduce checkout/payment-provider flows. |
| `checkout-wizard` | Checkout Wizard | Borrow validation and recalculated review before committing an import or transfer draft. Its cart/payment domain is outside OmniBank. |
| `classic-gallery` | Classic Gallery | Reject image grid for ledger work. Document thumbnails may use individual gallery primitives. |
| `contact-form` | Contact Form | Borrow a flat labeled form for short create/edit tasks; omit lead-capture semantics. |
| `dashboard-comparison` | Data Dashboard | Borrow period comparisons in trends, with the period and reconciliation basis labeled. Avoid fabricated deltas without matching backend data. |
| `form-wizard-dialog` | Dialog Wizard | Adopt for short setup/renewal tasks that benefit from keeping their parent context visible. Keep steps short and actions reachable. |
| `documentation` | Documentation Catalog | Borrow grouped help destinations if an in-app help index exists. Not a replacement for the finance dashboard. |
| `documentation-design` | Documentation Design | Borrow comparison/examples for optional help; reject property tables and code samples in ordinary financial tasks. |
| `documentation-technical` | Documentation Technical | Borrow sequential instructions and prerequisites for local Ollama/bank setup, with configuration controls alongside the guidance. |
| `dashboard-scorecard` | Executive Summary Dashboard | Borrow outcome-first summary and optional commentary for organisation reports. Narrative must reflect real local data, not decorative generated text. |
| `file-explorer` | File Explorer | Borrow selected-file metadata and breadcrumbs for document inspection. A multi-column file manager is unnecessary for statement import. |
| `table-filter` | Filterable Table | Adopt progressive filters, active clauses, view options and a retained record context for history. Saved views are a later extension; query-language search is unnecessary for the initial improvement. |
| `form-wizard` | Form Wizard | Adopt explicit progress, per-step validation, previous-step editing and draft retention for setup/import. Do not split simple forms into unnecessary steps. |
| `dashboard-cohort-funnel` | Funnel & Cohort Dashboard | Reject conversion/retention analytics: those metrics are unrelated to personal accounting and conflict with zero tracking. Heatmap presentation alone can inform monthly summaries. |
| `gallery-hero` | Gallery Hero | Reject promotional image grids in working financial screens. |
| `table-grouped` | Grouped Table | Borrow collapsible account/month groups for long collections where grouping helps scanning. Keep counts and filtered state clear. |
| `ide` | IDE | Borrow only deliberate panel budgets/resizing. Reject terminal/editor complexity in finance navigation. |
| `table-inbox` | Inbox Table | Borrow queue → selected detail → review for bank/import/notification triage. On narrow screens, detail becomes a dialog or sheet. |
| `incident-console` | Incident Console | Borrow severity/state cues for failed import or sync review; do not scaffold this WIP page as production UI. |
| `form-wizard-inline` | Inline Wizard | Adopt collapsed completed-step summaries and expandable current work for dependent import/bank stages; failures stay attached to the stage that failed. |
| `kanban-board` | Kanban Board | Reject drag-to-change ledger state; explicit financial actions are clearer and auditable. |
| `login-card` | Login Card | Borrow a focused local unlock card; omit third-party identity buttons, sign-up and cloud legal links. |
| `login-split` | Login Split | Reject large branding/media pane; local unlock should stay quick and usable on mobile. |
| `login-sso` | Login SSO | Reject domain discovery/cloud SSO: local profile/PIN and organisation access remain authoritative. |
| `messaging-shell` | Messaging Shell | Reject four-column team chat shell for a single local assistant. WIP, absent from live gallery. |
| `mixed-gallery` | Mixed Gallery | Reject masonry layout for comparable amounts and records. |
| `detail-page` | Order Detail | Borrow record header, properties, children, totals and chronological activity for account/budget/transaction details. Do not add order/shipping concepts. |
| `editor` | Page Editor | Reject drag-and-drop authoring canvas; no match to current finance workflows. |
| `dashboard-composition` | Portfolio Dashboard | Borrow balances-over-time and account contributors for overview/trends. Keep account currencies and reconciled/pending meanings separate. |
| `product-detail` | Product Detail | Borrow progressive disclosure for optional details, not product selection/quantity/cart controls. |
| `product-gallery` | Product Gallery | Reject product imagery/price-card browsing for a ledger. |
| `dashboard-progress` | Project Status Dashboard | Borrow savings/project goal progress and due dates. Avoid pretending envelopes have tasks, owners or burndown metrics. |
| `table-page` | Searchable Table | Adopt readable tabular history, search/scope/column filters and totals explicitly labeled as filtered or partial. Keep server pagination and full exports. |
| `dashboard-alert-rail` | Service Monitoring Dashboard | Borrow actionable alert priority for sync/import issues. Technical uptime/service monitoring belongs in diagnostics, not the main finance dashboard. |
| `settings-dialog` | Settings Dialog | Borrow quick appearance/preferences disclosure and search. Keep backups, profiles, rules and maintenance in full-page settings. |
| `settings` | Settings Form | Appropriate for a short preference form; reject a single long stack as the home for all OmniBank settings. |
| `settings-sidebar` | Settings Panels | Adopt section navigation with focused panels: general, profiles/security, assistant, backups/import, rules, organisation, advanced tools. Mobile navigation stays explicit. |
| `shell-nav` | Shell Nav | Borrow app identity/global context plus grouped product navigation. Use both axes only because the top controls own profile/privacy/global commands. |
| `side-gallery` | Side Gallery | Reject marketing collage for working financial screens. |
| `shell-side-nav` | Side Nav | Adopt grouped, collapsible navigation for the growing set of financial destinations. Keep main tasks visible; put secondary administration in groups. |
| `table` | Simple Table | Borrow sortable rows, selection and overflow actions; do not ship this WIP page wholesale. Existing virtualized table remains valuable. |
| `theme-showcase` | Theme Showcase | Use only as a development verification harness for six themes and density variants. CLI-only entry. |
| `shell-top-nav` | Top Nav | Reject as the sole navigation axis: OmniBank has many destinations and a growing hierarchy. Keep top controls for global context. |
| `table-tree` | Tree Table | Borrow hierarchical category rollups only if actual parent/child data needs them. Do not impose a file-tree metaphor on flat transactions. |
| `form-two-column` | Two-column Form | Borrow input + context/review layout for longer drafts on desktop; collapse naturally on mobile and omit hero images. |
| `form-wizard-vertical` | Vertical Wizard | Strong reference for statement upload → mapping → preview → commit when steps have unequal detail. Rail/guidance yield space at narrow widths. |
| `work-item-detail` | Work Item Detail | Borrow attachments/properties/activity for detailed records. Reject task comments/assignees unless the accounting domain actually supports them. |

## Official guidance and practical consequences

1. **Start with the frame and navigation.** Astryx recommends choosing shell, region budgets and fill/capped content before placing content; SideNav is its default for a growing hierarchy. OmniBank should group daily work, planning, and administration, retain route-driven selected state, and move low-frequency appearance controls away from the primary financial actions. Sources: [Layout: scaffold, shell and navigation](https://astryx.atmeta.com/docs/layout), [Migration: frame first](https://astryx.atmeta.com/docs/migration).

2. **Restore the information density that makes V1 easy to scan.** Lists of operations, recurrences and settings rows belong in Table/List under Section with dividers. Card is appropriate for a self-contained KPI/chart widget or an important boundary. Avoid nested cards and repeated full-page containers. Use the weakest grouping that communicates the relationship. Source: [Layout: structure and card or rows](https://astryx.atmeta.com/docs/layout); [Principles](https://astryx.atmeta.com/docs/principles).

3. **Use action hierarchy, not more borders.** Give each region one lead and one primary command. Keep supporting text readable using secondary color/weight rather than shrinking every label. Use Toolbar where a header has interactive controls; LayoutHeader for simple titles and LayoutFooter for commit actions that must remain reachable. Source: [Layout: hierarchy, headers and footers](https://astryx.atmeta.com/docs/layout).

4. **Make filtering visible and reversible.** `ToolbarTableFilter` keeps search visible, uses selectors as clauses, provides result counts, Clear all, and a separate column picker; lower-priority filters fold into an overflow popover. Adapt that pattern to History without hiding which filters are active. `table-page` explicitly marks filtered totals as partial. Do not calculate a full ledger total from a single paginated page. Sources: [template gallery](https://astryx.atmeta.com/templates), installed `ToolbarTableFilter`, `table-filter`, and `table-page` template sources.

5. **Use sections for settings navigation and steps for dependent work.** `settings-sidebar` swaps focused panels; `form-wizard` validates advance and allows return; `form-wizard-inline` preserves completed-step summaries; `form-wizard-vertical` accommodates upload and review. Preserve drafts after errors and keep irreversible actions in a final reviewed step. Sources: [template gallery](https://astryx.atmeta.com/templates), installed template sources for these IDs.

6. **Define mobile behavior per region.** Astryx recommends revealing, resizing or swapping each region deliberately. Its example moves details into Dialog below 1024px and navigation into MobileNav below 768px; these are recommended example thresholds, not mandatory framework rules. Preserve table horizontal scroll and visible actions rather than shrinking every region. Source: [Layout: responsive contract](https://astryx.atmeta.com/docs/layout).

7. **Let Astryx own the controls and semantics.** Prefer Button/IconButton, Selector, DateInput/DateRangeInput, Switch, TabList, Popover, Dialog/AlertDialog, Banner, EmptyState, Stepper and FormLayout over duplicated behavior. Use typed tokens and compiled StyleX for the remaining app-specific layout. Reserve Badge for counts/enumerated states; use StatusDot/Token for state and metadata. Sources: [Principles](https://astryx.atmeta.com/docs/principles), [Migration primitive mapping](https://astryx.atmeta.com/docs/migration), [template grading rubric](https://astryx.atmeta.com/docs/cli-integrations-building-blocks-templates-write-good-templates-template-grading-rubric).

8. **Keep component strings bilingual too.** Application translations and Astryx translations are separate systems. Feed the application locale to InternationalizationProvider and bundle the needed component catalogues; its provider updates component strings when locale changes. No remote locale/font fetch belongs in this app. Sources: [Internationalization](https://astryx.atmeta.com/docs/internationalization), [Typography: fonts](https://astryx.atmeta.com/docs/typography).

## Useful block references

These were selected from the 659-example catalogue; they provide smaller compositions to adapt rather than copying entire pages. Resolve the exact installed APIs before implementation.

| Examples | Application |
| --- | --- |
| `AppShellTopNavWithSideNav`, `AppShellMobileHookUsage`, `SideNavNestedItems` | Shared frame, grouped destinations, mobile navigation and selected routes. |
| `PopoverSettingsPanel`, `ToolbarThreeSlot`, `ToolbarWithTabs`, `ToolbarCardHeader` | Move preferences into disclosure; align meaningful page actions. |
| `ToolbarTableFilter`, `TableColumnSettingsTable`, `TableInlineFilterTable`, `TablePaginatedTable` | History search/filter/view controls without replacing local server pagination. |
| `StickyColumnsHookUsage`, `ColumnResizeHookUsage`, `TableGroupedRowsTable` | Keep identifying/action columns available and tune high-volume data scanning. |
| `DateRangeInputWithPresets`, `DateInputWithValidation`, `FieldStatus` component | Fast period selection and clear validation. `FieldStatus` is a component, not a listed block ID. |
| `DialogFormDialog`, `AlertDialogAsyncAction`, `DialogAdaptivePresentation` | Task dialogs and confirmed writes; adaptive sheets are opt-in, not the default for destructive confirmations. |
| `StepperWidthResponsiveCollapse`, `StepStates`, `BottomSheetSwitcherReviewFlow` | Guided work with progress, review and back navigation. |
| `ChatComposerStreaming`, `ChatComposerValidation`, `ChatToolCallsStatuses` | Clear local generation/stop/error/tool states. |
| `VisuallyHiddenLiveRegion`, `VisuallyHiddenSupplementaryContext` | Announce changed results/status and explain concise visual indicators. |

## V1/V2 comparison criteria

The existing [feature audit](UI-V1-V2-COMPARISON.md) establishes API capability but does not prove that the workflows feel equally polished. This research recommends checking these user journeys in both versions with identical synthetic records:

- Find an operation, narrow by account/date/type/status, edit it, and return to the same list context. Count navigation and identify whether active filters and failed drafts remain visible.
- Review a statement: pick the file, associate accounts, correct rows, inspect selected totals, commit, and understand the result. An early stage must not look like a finished import.
- Change a preference or inspect a backup without scanning unrelated maintenance/organisation controls. Preserve a clear destination when entering settings from a context link.
- Plan a budget or recurrence, then inspect the underlying transactions. Preserve V1's direct links and contextual commands while retaining V2's dialogs and responsive table behavior.
- Read the financial overview and explain each number's scope, especially reconciled balances versus charts including pending transactions.
- Complete the same work by keyboard and on a narrow screen, including opening/closing navigation, dialogs, filters and confirmations. Focus must return predictably.

Keep V2's useful additions: six local themes, independent density preference, strict TypeScript, query caching, separate edit/delete dialogs, retained error drafts, accessible virtualized tables and mobile scroll. Improve the navigation, hierarchy and sequence around those capabilities. Do not alter decimal arithmetic, backend totals, privacy behavior or V1 availability to imitate a template.

## Verification limits

Catalogue research does not itself verify OmniBank changes. Implementation still needs strict typecheck/build, targeted real-backend workflow tests, local-only request checks, keyboard/mobile review, and screenshots of the affected surfaces. Astryx recommends light/dark, collapsed/expanded/mobile navigation, focus return, and empty/error/loading checks during migration. Source: [Migration verification](https://astryx.atmeta.com/docs/migration).

The previous comparison records an existing reference-image/fixture mismatch despite exact CSV round-trip. This research does not resolve or reclassify that accounting discrepancy. Real bank authentication and Ollama inference also remain separate environment-dependent validation.
