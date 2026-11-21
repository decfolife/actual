@AGENTS.md
@.github/agents/pr-and-commit-rules.md

# The `ynab-style` fork

This repository is a personal fork of Actual Budget. The `ynab-style` branch
reshapes Actual to look and behave like **YNAB 4** (the classic desktop
YNAB). Upstream rules in `AGENTS.md` and the PR/commit rules still apply; this
section adds what is specific to the fork, so work can continue on any
machine.

## Goal and how changes are requested

- Everything is judged against YNAB 4. The owner sends side-by-side
  screenshots (YNAB 4 vs this app) and asks for the app to match: spacing,
  fonts, colors, behavior.
- Match by **measuring**, not eyeballing. Compare screenshots at the same
  scale (e.g. row pitch in pixels) and convert to CSS px. Earlier eyeballed
  changes went the wrong way.
- YNAB-only look and behavior lives behind the **YNAB theme** (`ynab`), so the
  other themes and upstream behavior keep working. `ynab` is the default theme
  in this fork (`useTheme()` in `packages/desktop-client/src/style/theme.tsx`).

## Working rules (agreed with the owner)

- Commit every finished change locally, with the `[AI]` prefix and the
  attribution trailer. **Push only when the owner says "push".**
- Ask before deleting anything.
- Never modify the original data from the Actual Mac app
  (`~/Library/Application Support/Actual/actual-server`). The server runs on a
  copy (see Deployment).
- Test against the **demo budget** in a browser ("Try the demo" on the
  welcome screen), never the owner's real budget.
- After each change: typecheck, lint, run the relevant vitest suites, check it
  in the browser, build, restart the server, then commit.
- The repo on GitHub is public: keep personal details (names, emails,
  machine/Tailscale addresses, budget contents) out of commits and this file.

## Deployment (how the owner runs it)

The owner self-hosts this branch; there is no separate hosting.

- **Server:** the sync server built from this checkout serves the web app and
  syncs budgets. On the Mac it runs from a LaunchAgent,
  `~/Library/LaunchAgents/com.decfolife.actual-server.plist`:
  - `node packages/sync-server/build/app.js`, working directory = this
    checkout (`~/developer/actual`)
  - env: `ACTUAL_PORT=5007`, `ACTUAL_HOSTNAME=127.0.0.1`,
    `ACTUAL_DATA_DIR=~/developer/actual-data` (with `server-files/` and
    `user-files/` inside), log at `~/developer/actual-data/server.log`
  - `RunAtLoad` and `KeepAlive` are on.
- **The web UI** comes from `packages/desktop-client/build`
  (`@actual-app/web` is linked to the local `desktop-client`), so a frontend
  change only shows after a build.
- **Other devices** (iPhone, Windows) reach the Mac through **Tailscale**:
  `tailscale serve` maps the Mac's tailnet HTTPS address to
  `http://127.0.0.1:5007`. Check it with `tailscale serve status`. Every
  device needs Tailscale running. The app is local-first: devices keep working
  offline and sync when they reach the server again (the sync button in the
  sidebar forces it).
- **Installed apps:** the owner uses it as an installed Chrome app on the Mac
  (localhost:5007) and from the Tailscale address on other devices. After a
  deploy, clients need a reload (Cmd+Shift+R) for the service worker to pick
  up the new build. Disable "new version" notices in Settings if they nag.

### Deploy a change

```bash
yarn build:server
launchctl kickstart -k gui/$(id -u)/com.decfolife.actual-server
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5007/   # expect 200
```

### Setting up on another machine

1. Prerequisites: git, Node >= 22 (repo's `.nvmrc`), Yarn 4 via corepack
   (`corepack enable`; if `/usr/local/bin` isn't writable use
   `corepack enable --install-directory ~/.local/bin` and put that on PATH).
2. `git clone -b ynab-style https://github.com/decfolife/actual`, then from
   the repo root `yarn install` and `yarn build:server`.
3. Pick a data directory (e.g. `~/developer/actual-data`). If moving an
   existing server, **copy** its data there (back it up first, never move or
   edit the original).
4. Run `node packages/sync-server/build/app.js` with the env vars above (or
   create an equivalent LaunchAgent / systemd unit / Windows service).
5. For other devices, set up `tailscale serve` to the server's port.
6. Only one server should own a budget's sync data; don't run two against the
   same files.

## Development and verification

- Dev server (frontend only, with the demo budget): from the repo root
  `yarn start:browser-frontend`, port 3001. In Claude Code desktop this is the
  `actual-dev` preview config (`.claude/launch.json` in the parent folder).
- After `yarn build:server` the dev server can go blank (stale HMR): restart
  it.
- Browser checks have been scripted with Playwright from
  `packages/desktop-client` (`require('playwright')`, `channel: 'chrome'`,
  a persistent profile so the demo budget survives). Useful patterns:
  screenshots at the same `deviceScaleFactor` as the owner's screenshots,
  per-frame `requestAnimationFrame` logs to catch layout jumps, CDP CPU
  throttling to imitate a phone, and `sharp` (in the repo) to measure pixels.
- To measure real performance, serve `packages/desktop-client/build` locally
  with COOP/COEP headers and use "Try the demo"; the dev build is several
  times slower.
- Tests: `yarn typecheck`, `yarn lint` (oxlint + oxfmt), and vitest per
  workspace, e.g.
  `yarn workspace @actual-app/web vitest --run src/components/transactions`.
  Component-library tests need their config: `yarn workspace
  @actual-app/components run test`.
- `TransactionsTable.test.tsx` mocks the theme to `light`: it covers the
  standard register, while the YNAB theme changes clicking and labels.
- e2e/VRT suites were not updated for the fork (e.g. oldest-first registers,
  header balance moved to the footer) and are expected to fail in places.

## What the fork changes, and where

### Theme

- `packages/component-library/src/themes/ynab.ts`: the YNAB theme = light
  theme + overrides (`ynabOverrides` color tokens) + CSS variables in
  `ynabOverridesCss` (`--button-gradient*`, `--checkbox-*`,
  `--autocomplete-*`, `--budget-*`, font stack). Most YNAB styling is a token
  or CSS variable here, with a neutral default elsewhere, so other themes are
  unaffected.
- New tokens are declared in
  `packages/component-library/src/themes/source/colors.ts` (with a
  `description`); give them defaults that match the existing look.
- Font: Myriad Pro if installed, else bundled Source Sans 3
  (`fonts.scss`).
- Buttons (`component-library/src/Button.tsx`): normal/primary/menu buttons
  take `--button-gradient*` from the theme (YNAB gray bevel).

### Budget screen (`packages/desktop-client/src/components/budget/`)

- Compact dark month cards (`BudgetSummary.tsx`, `ToBudgetAmount.tsx`),
  calendar-year month strip (`MonthPicker.tsx`), totals header boxes and
  dotted teal grid (`envelope/EnvelopeBudgetComponents.tsx`,
  `BudgetTotals.tsx`, `BudgetCategories.tsx`).
- Budget cell ▼ menu (`envelope/QuickBudgetMenu.tsx`) with last month,
  averages, scheduled amounts and a calculator (`envelope/BudgetCalculator.tsx`);
  server side `loot-core/src/server/budget/quick-budget.ts`.
- Month count: −/+ control (`MonthCountSelector.tsx`); `DynamicBudgetTable.tsx`
  fits up to 12 months and scales the whole budget down (CSS `zoom`, to 75%)
  when they don't fit at YNAB's 230px per month. The count is a per-device
  global pref (`maxMonths`).
- Card "To be Budgeted" colors (`BudgetSummary.tsx`): the current month is
  green or red; next month is white unless overbudgeted (red,
  `isOnlyNegativeColored`); other months are white.
- Hidden categories (YNAB theme only): they're not shown in the grid. A
  "Hidden Categories" row at the bottom (`HiddenCategoriesRow.tsx`) shows
  their totals per month, plus an Unhide button that appears on hover and
  opens a "Click a category to unhide it" list. Clicking a group unhides all
  of its categories. The "Show hidden categories" option is ignored in the
  YNAB theme (`BudgetCategories.tsx`).
- YNAB 4 imports: the importer (`loot-core/src/server/importers/ynab4.ts`)
  puts YNAB's hidden categories, unflagged, into a regular group named
  "Hidden Categories" and names each one "Group/Category". The YNAB theme
  treats that group as hidden (`isImportedHiddenGroup`): it's left out of the
  grid and its categories are listed under their original group. Unhiding one
  renames it back to "Category" and moves it to the end of that group. The
  group is created if it no longer exists, and the full name is kept if the
  short one is already taken there. The empty imported group is never deleted.

### Header controls, dark mode, and what is switched off

- Budget header: a dark-mode toggle (`budget/DarkModeToggle.tsx`) and a large
  sync button (`ServerSyncButton` in `Titlebar.tsx`, `large` prop) sit under
  the −/+ month count (`BudgetPageHeader.tsx`). The sync button shows on the
  budget page only, and only with a server; `SyncHotkey` keeps Cmd+S working
  everywhere.
- YNAB dark mode is a variant of the `ynab` theme, not Actual's Dark theme, so
  YNAB behavior (hidden categories etc.) stays. Global pref `ynabDark`
  (`loot-core/src/types/prefs.ts`, `server/preferences/app.ts`);
  `ynabDarkThemeCss` in `component-library/src/themes/ynab.ts`; selected in
  `desktop-client/src/style/theme.tsx`.
- Password managers: the shared `Input` sets `autocomplete=off` and the
  `data-lpignore` / `data-1p-ignore` / `data-form-type` attributes.
- **No outbound traffic.** Update toasts, the upstream release check
  (`util/versions.ts` returns `'unknown'`) and the news feed
  (`hooks/useNewsFeed.ts`, `isEnabled = false`) are off; their tests are
  skipped. The online theme catalog and theme downloads
  (`hooks/useThemeCatalog.ts`, `style/customThemes.ts`) are disabled and the
  "Custom theme" entries are removed from Settings → Themes.
- **Bank sync is hidden.** The Bank Sync sidebar/settings entry
  (`hooks/useSidebarMenu.ts`), automatic bank sync (`FinancesApp.tsx`), the
  "Set up bank sync" button and "Link account" menu item are gone. The code
  stays so upstream merges are easy. Check for leaks with a Playwright run
  over the main pages and list non-local requests; it should be empty.

### Sidebar (`components/sidebar/`)

- Nav box (Budget/Reports/All Accounts), collapsible account group boxes
  (`Accounts.tsx`, pref `ui.collapsedAccountGroups`), less-used items moved to
  the bottom, which scrolls with the accounts on short screens.
- Account rows: right-click menu = Adjust Balance (`AdjustBalancePopover.tsx`,
  creates a reconciliation transaction) and Note; yellow hover tooltip with
  balance and notes (no graph).

### Account register (`components/accounts/`, `components/transactions/`)

- **Oldest first, newest at the bottom.** `Account.tsx` orders by date asc
  when no column sort is chosen, loads the whole list at once
  (`pageCount` 1,000,000) and opens scrolled to the bottom with no visible
  scrolling; searches, filters and a date-ascending sort do the same.
  `FixedSizeList.tsx` clamps scroll offsets and can keep the bottom in view
  when the list shrinks; `table.tsx` has `scrollToBottom` and stays pinned to
  the bottom when rows are added there.
- Scheduled transactions are listed after the newest transaction
  (`previewAtBottom`). Their status icon opens Enter now / Enter on its date /
  Skip / Edit schedule.
- The grid is hidden behind a skeleton (`AccountSkeleton.tsx`) only on an
  account's first load, then appears once, in its final layout.
- Header (`Header.tsx`): one compact row; Edit Transactions ▼ (always shown,
  disabled with nothing selected), Import, Filter, date range dropdown
  (`DateRangeButton.tsx`) and search with YNAB-style suggestions
  (`TransactionSearch.tsx`; searches on Enter or a picked suggestion, not
  while typing). Green "Showing N results" bar with Clear Search
  (`SearchBanner.tsx`).
- Footer: Add a new transaction / Make a transfer strip
  (`AddTransactionBar.tsx`; new rows open at the bottom) and the bottom bar
  (`AccountFooter.tsx`): Scheduled Transactions, Cleared + Uncleared = Working
  Balance (Search Total / Selected Total when relevant), Reconcile Account.
- Grid (`TransactionsTable.tsx`, all gated on `useIsYnabRegister()`):
  - slate header bar, YNAB column names (Memo, Outflow, Inflow) and order
    (enforced in `hooks/useTransactionTableColumns.ts`, running balance always
    shown), "Group: Category", striped rows without grid lines, 25px rows /
    28px header, fixed widths with Memo flexing;
  - where an account balance can't be shown (All Accounts, a filter or a
    search) the balance column becomes a "Running Total" of the listed rows
    (`canShowRunningTotal` in `Account.tsx`); not on touch devices.
  - resizable columns: drag a header edge, double-click to reset; widths in
    the local pref `ui.transactionColumnWidths`;
  - green "C" clearing badges; gray beveled checkboxes on every row;
  - click a row to select it, click again to edit; Shift+click selects a
    range, Cmd/Ctrl+click toggles one row; checkbox and C act at once;
  - editing shows an orange outline and a striped Done/Cancel bar (Cancel
    restores the transaction as it was); new transactions get Save and add
    another / Save / Cancel.
  - in a new transaction, Enter moves to the next field like Tab
    (`useTableNavigator(..., { enterMovesRight })`) and saves from the last
    field (Inflow); picking a date, account, payee or category also moves on
    (`advanceAfterPick`). Make a transfer opens a new row on the payee with
    the transfer accounts listed (`newTransactionKind: 'transfer'`,
    `initialFocusTransferPayees`).
  - register inputs are smaller (`--table-input-padding`) and carry
    `data-lpignore` / `data-1p-ignore` / `data-form-type="other"` so password
    managers stay out of them.
  - Performance: rows are memoized, so props passed to `Transaction` must stay
    stable (memoized callbacks, `useAmountColumnWidths` memoized). A new
    function or object per render re-renders every row on each click.
- **Touch devices** (phones, tablets, the owner's iPhone Duo; detected with
  `isTouchDevice()` from `#util/isTouchDevice`, i.e. `pointer: coarse` /
  `hover: none`), while the wide layout is shown:
  - Add a new transaction / Make a transfer open a YNAB 4 iPhone-style
    full-screen entry (`accounts/TouchTransactionEntry.tsx`): amount keypad
    with Expense/Income, then Payee / Category / Account / Date / Memo /
    Cleared and Save Transaction. Pickers reuse the `payee-autocomplete`,
    `category-autocomplete` and `account-autocomplete` modals; transfers open
    the payee list on the accounts (`showTransfersFirst`).
  - Tapping a (non-split) transaction opens it in the same screen to edit or
    delete (`TouchEditContext`, provided by `Account.tsx`).
  - The payee/category/account pickers use the phone sizing and don't focus
    their search box (so the keyboard doesn't cover the list).
  - The account name row is hidden too. The account toolbar and filter chips are hidden; the register drops Memo
    (and the running balance under 900px wide), payee/category share the
    width; the footer shortens its labels under 900px.
  - The installed iOS app runs edge to edge (`apple-mobile-web-app-*` meta in
    `index.html`) and its status bar/edges use `touchViewTheme` (YNAB blue),
    not the gray `mobileViewTheme` used for desktop installed apps. Gray
    bands after rotating came from iOS painting the old gray theme color.
    iOS keeps a stale top safe-area inset after rotating, so the top padding
    uses `--safe-area-top` (from `index.html`), which is 0 in landscape on
    touch devices.
  - No Xcode on the owner's Mac: touch layouts were checked in Chrome with
    touch emulation at the Duo's unfolded sizes (about 1000x700 landscape,
    730x890 portrait). Safari-specific behavior needs checking on the phone.
- Dropdowns (`components/autocomplete/`): white list with blue highlight,
  bold "Group:" headings, "Budget Categories" title, taller lists
  (`--autocomplete-list-height`).

## Future plan

### YNAB 4 "Spending By Category" report (requested, not started)

A new report like YNAB 4's: title with Export (CSV) and Print buttons; a
light filter box with dropdown links (Timeframe, e.g. "January 2022 to
October 2024"; Categories: All; Payees: All; Accounts: Budget Accounts); a
large donut chart of spending per category group with leader-line labels
("Food $32,979.12 (4%)") and "Total Spending $X" in the middle; a dark slate
panel on the right listing each group with a colored dot and its amount, and
a big Total. Hidden categories are grouped as "Hidden Categories".

How to add it (follow the Age of Money report, the simplest recent example):

- Widget type: add `'spending-by-category-card'` and its meta type
  (name, timeFrame, category/payee/account filters) in
  `loot-core/src/types/models/dashboard.ts`, and to the allowed list in
  `loot-core/src/server/dashboard/app.ts` (and its test).
- Dashboard: add it to the "Add new widget" menu and the widget render switch
  in `components/reports/Overview.tsx`; a card component in
  `components/reports/reports/` (small donut + total, links to the page).
- Page and routes: `/spending-by-category` and `/spending-by-category/:id` in
  `components/reports/ReportRouter.tsx`; page loads/saves its meta with
  `useDashboardWidget` / `useUpdateDashboardWidgetMutation` like
  `AgeOfMoney.tsx`.
- Data: sum outflows per category group over the timeframe, on-budget
  accounts by default, excluding transfers and income; a spreadsheet in
  `components/reports/spreadsheets/` used through `useReport`. Charts use
  recharts (see `components/reports/graphs/`).

## Known gaps / ideas not done yet

- No flag column, check numbers, or "Add Category" button in the category
  dropdown; the category dropdown highlights Split first rather than the
  current category.
- The iPhone in its narrow layout uses Actual's mobile UI, which this fork
  hasn't restyled.
- Balance adjustments are uncategorized (could default to "To be Budgeted").
