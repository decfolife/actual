// YNAB 4-inspired theme: the Light theme with a blue sidebar and frame, a
// light-gray budget panel, a dark month strip and month cards, a pale green
// column header row, light blue category group rows and boxed budget cells.
// Applied on top of the generated Light theme CSS.
const ynabOverrides: Record<string, string> = {
  // Sidebar
  sidebarBackground: '#0098cb',
  sidebarAccountGroupBackground: '#0070a0',
  sidebarItemText: '#ffffff',
  sidebarItemTextSelected: '#ffffff',
  sidebarItemTextNegative: '#ffb3ab',
  sidebarItemAccentSelected: 'transparent',
  sidebarItemBackgroundSelected: '#00446d',
  sidebarItemBackgroundHover: '#005f87',
  sidebarBudgetName: '#ffffff',
  sidebarHeaderText: '#ffffff',
  sidebarTextSubdued: '#d6f0fa',
  sidebarTextMuted: '#a9dcef',
  sidebarBorder: '#33add5',

  // Page
  pageBackground: '#dbdbdb',
  pageText: '#3a3a3a',
  pageTextSubdued: '#6f6f6f',
  pageTextLight: '#5c5c5c',
  pageTextLink: '#0072a0',

  // Budget page frame and panel
  budgetPageFrame: '#0099ca',
  budgetPagePanel: '#dbdbdb',

  // Month strip
  budgetMonthStripBackground: '#3b4a4e',
  budgetMonthStripYearBackground: '#4f5559',
  budgetMonthStripBorder: '#2e3b40',
  budgetMonthStripText: '#ffffff',
  budgetMonthStripSelectedBackground: '#0b87cf',
  budgetMonthStripSelectedText: '#ffffff',

  // Month cards
  budgetSummaryCurrentMonth: '#3a464d',
  budgetSummaryOtherMonth: '#3a464d',
  budgetSummaryText: '#ffffff',
  budgetSummaryCurrentMonthMarker: '#f1d610',

  // Column header row
  budgetTotalsBackground: '#ecf5e7',
  budgetTotalsText: '#555854',
  budgetTotalsLabel: '#6c7069',
  budgetTotalsBorder: '#6a6d68',
  budgetTotalsSeparator: '#848a7e',

  // Budget grid
  budgetCurrentMonth: '#ffffff',
  budgetOtherMonth: '#ffffff',
  budgetHeaderCurrentMonth: '#e4f5fd',
  budgetHeaderOtherMonth: '#e4f5fd',
  budgetRowBackgroundAlternate: '#ffffff',
  budgetRowBackgroundHover: '#c8d9e1',
  budgetCellBorder: '#00aed9',
  budgetCellSelection: '#b3ecfb',
  // YNAB 4's pale yellow account tooltip
  // Account register: slate column header bar, striped rows without lines
  registerHeaderBackground: '#5f6b72',
  registerHeaderBackgroundEnd: '#3e484e',
  registerHeaderText: '#ffffff',
  registerHeaderDivider: '#2d363b',
  registerRowBorder: 'transparent',
  registerEditingBorder: '#f0a830',
  registerEditingStripe: '#fde3b8',
  registerEditingStripeAlternate: '#fff1d9',
  registerClearedBackground: '#3fae2a',
  registerClearedText: '#ffffff',
  registerUnclearedText: '#b4b4b4',
  accountSearchBannerText: '#2e6b12',
  accountSearchBannerBackground: '#e3f2c4',
  accountSearchBannerStripe: '#d2e9a6',
  accountFooterBox: '#ffffff',
  accountTooltipText: '#2a2a2a',
  accountTooltipBackground: '#ffffcc',
  accountTooltipBorder: '#d6d68a',
  formInputBorderSelected: '#3cb2d0',
  formInputShadowSelected: 'transparent',
  budgetMonthGap: '#dbdbdb',
  budgetMonthOutline: '#9a9a9a',

  // Tables
  tableBackground: '#ffffff',
  tableRowBackgroundAlternate: '#eaf4f9',
  // YNAB 4 highlights selected rows in yellow
  tableRowBackgroundHighlight: '#faf2b0',
  tableRowBackgroundHighlightText: '#2a2a2a',
  tableText: '#3a3a3a',
  tableTextSubdued: '#9a9a9a',
  tableBorder: '#b5dfea',
  tableHeaderBackground: '#ecf5e7',
  tableHeaderText: '#4d4d4d',
  tableBorderSelected: '#0099ca',
  tableRowBackgroundHover: '#c8d9e1',
  tableRowHeaderBackground: '#e4f5fd',
  tableRowHeaderText: '#3a3a3a',

  // Numbers
  numberPositive: '#3a3a3a',
  numberNegative: '#d43c3c',
  budgetNumberPositive: '#3a3a3a',
  budgetNumberNegative: '#d43c3c',
  budgetNumberZero: '#a8a8a8',
  toBudgetPositive: '#a4c666',
  toBudgetZero: '#a4c666',
  toBudgetNegative: '#eb8b8b',

  // Dropdowns (payee, category, …): YNAB 4's white list with a blue
  // highlight, bold group headings and dark amounts
  menuAutoCompleteBackground: '#ffffff',
  menuAutoCompleteBackgroundHover: '#1271aa',
  menuAutoCompleteText: '#2a2a2a',
  menuAutoCompleteTextHover: '#ffffff',
  menuAutoCompleteTextHeader: '#2a2a2a',
  menuAutoCompleteItemText: '#2a2a2a',
  menuAutoCompleteItemTextHover: '#ffffff',
  noticeTextMenu: '#3a3a3a',
  errorTextMenu: '#c62828',

  // Row checkboxes: a gray beveled box with a dark check
  checkboxText: '#16294a',
  checkboxBackgroundSelected: '#e6e6e6',
  checkboxBorderSelected: '#7f7f7f',

  // Buttons inside dropdowns (Make transfer, Manage payees, …)
  buttonMenuText: '#2a2a2a',
  buttonMenuTextHover: '#1a1a1a',
  buttonMenuBackground: '#e4e4e4',
  buttonMenuBackgroundHover: '#ededed',
  buttonMenuBorder: '#9b9b9b',
  buttonMenuSelectedText: '#ffffff',
  buttonMenuSelectedTextHover: '#ffffff',
  buttonMenuSelectedBackground: '#1271aa',
  buttonMenuSelectedBackgroundHover: '#1a7cb6',
  buttonMenuSelectedBorder: '#0d5e8f',

  // Buttons: YNAB 4's gray beveled buttons, primary ones included
  buttonNormalBackground: '#e4e4e4',
  buttonNormalBackgroundHover: '#ededed',
  buttonNormalBorder: '#9b9b9b',
  buttonNormalText: '#3a3a3a',
  buttonNormalTextHover: '#2a2a2a',
  buttonNormalShadow: 'rgba(0, 0, 0, 0.25)',
  buttonNormalDisabledBackground: '#ececec',
  buttonNormalDisabledBorder: '#c4c4c4',
  buttonNormalDisabledText: '#a8a8a8',
  buttonPrimaryBackground: '#e4e4e4',
  buttonPrimaryBackgroundHover: '#ededed',
  buttonPrimaryBorder: '#8a8a8a',
  buttonPrimaryText: '#2a2a2a',
  buttonPrimaryTextHover: '#1a1a1a',
  buttonPrimaryShadow: 'rgba(0, 0, 0, 0.25)',
  buttonPrimaryDisabledBackground: '#ececec',
  buttonPrimaryDisabledBorder: '#c4c4c4',
  buttonPrimaryDisabledText: '#a8a8a8',

  // Window title bar of the installed app (and the mobile status bar)
  mobileViewTheme: '#ececec',
  // On phones and tablets the edges blend into YNAB's blue frame
  touchViewTheme: '#0098cb',
};

// YNAB 4 used Myriad Pro. Source Sans 3 is Adobe's free font from the same
// design family and is bundled with the app; Myriad Pro is used if installed.
const ynabFontFamily =
  "'Myriad Pro', 'Source Sans 3 Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Chrome on macOS thickens text, most visibly light text on dark
// backgrounds; YNAB 4 drew it thinner
const ynabTextRendering = `body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;

export const ynabOverridesCss = `:root {\n  --font-family: ${ynabFontFamily};\n  --budget-month-gap: 5px;\n  --sidebar-text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);\n  --budget-card-gradient: linear-gradient(#4a5c63, #3d4b52 55%, #323d43);\n  --budget-card-edge: #22292b;\n  --budget-card-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 1px 2px rgba(0, 0, 0, 0.3);\n  --budget-card-divider: #2a353b;\n  --budget-card-divider-light: #56636a;\n  --budget-card-icon: #7f8d94;\n  --budget-card-subtext: #c9cfd2;\n  --budget-strip-gradient: linear-gradient(rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.12));\n  --budget-grid-style: dotted;\n  --budget-table-shadow: none;\n  --autocomplete-header-weight: 700;\n  --table-input-padding: 1px 4px;\n  --checkbox-size: 15px;\n  --checkbox-check-size: 10px;\n  --checkbox-border: #929292;\n  --checkbox-gradient: linear-gradient(#fdfdfd, #d4d4d4);\n  --checkbox-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 0 rgba(0, 0, 0, 0.06);\n  --autocomplete-list-height: 260px;\n  --button-gradient: linear-gradient(#fdfdfd, #d9d9d9);\n  --button-gradient-hover: linear-gradient(#ffffff, #e4e4e4);\n  --button-gradient-active: linear-gradient(#cfcfcf, #e9e9e9);\n  --button-gradient-disabled: linear-gradient(#f6f6f6, #e8e8e8);\n  --button-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 1px 1px rgba(0, 0, 0, 0.12);\n${Object.entries(
  ynabOverrides,
)
  .map(([name, value]) => `  --color-${name}: ${value};`)
  .join('\n')}\n}\n${ynabTextRendering}`;

// Dark variant of the YNAB theme. It sits on the generated Dark theme and
// keeps what is already dark or colored in the YNAB look (the blue sidebar and
// frame, month strip and cards, register header, cleared marks); the light
// surfaces (page, grid, tables, menus, buttons) come from the Dark theme.
const ynabDarkKeep =
  /^(sidebar|budgetPageFrame|budgetMonthStrip|budgetSummary|toBudget|registerHeader|registerCleared|registerUncleared|touchViewTheme|mobileViewTheme)/;

const ynabDarkOverrides: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(ynabOverrides).filter(([name]) => ynabDarkKeep.test(name)),
  ),
  mobileViewTheme: '#0b0f14',
  budgetCellBorder: '#1f6f8a',
  tableBorder: '#2d4452',
};

// Structural variables (font, dotted grid, card gradients) carry over; the
// light-only button and checkbox gradients do not.
const ynabStructuralCss = ynabOverridesCss
  .split('\n')
  .filter(
    line =>
      !/^\s+--(button|checkbox)-/.test(line) &&
      !/^\s+--color-/.test(line) &&
      !/--autocomplete-/.test(line),
  )
  .join('\n');

export const ynabDarkOverridesCss =
  ynabStructuralCss +
  `:root {\n${Object.entries(ynabDarkOverrides)
    .map(([name, value]) => `  --color-${name}: ${value};`)
    .join('\n')}\n}\n`;
