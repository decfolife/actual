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
  pageText: '#2b2b2b',
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
  budgetTotalsText: '#4d4d4d',

  // Budget grid
  budgetCurrentMonth: '#ffffff',
  budgetOtherMonth: '#ffffff',
  budgetHeaderCurrentMonth: '#e4f5fd',
  budgetHeaderOtherMonth: '#e4f5fd',
  budgetRowBackgroundAlternate: '#ffffff',
  budgetRowBackgroundHover: '#c8d9e1',
  budgetCellBorder: '#00aed9',
  budgetCellSelection: '#b3ecfb',
  formInputBorderSelected: '#3cb2d0',
  formInputShadowSelected: 'transparent',
  budgetMonthGap: '#dbdbdb',
  budgetMonthOutline: '#9a9a9a',

  // Tables
  tableBackground: '#ffffff',
  tableRowBackgroundAlternate: '#ffffff',
  tableText: '#2b2b2b',
  tableTextSubdued: '#9a9a9a',
  tableBorder: '#b5dfea',
  tableHeaderBackground: '#ecf5e7',
  tableHeaderText: '#4d4d4d',
  tableBorderSelected: '#0099ca',
  tableRowBackgroundHover: '#c8d9e1',
  tableRowHeaderBackground: '#e4f5fd',
  tableRowHeaderText: '#2b2b2b',

  // Numbers
  numberPositive: '#2b2b2b',
  numberNegative: '#d43c3c',
  budgetNumberPositive: '#2b2b2b',
  budgetNumberNegative: '#d43c3c',
  budgetNumberZero: '#a8a8a8',
  toBudgetPositive: '#a4c666',
  toBudgetZero: '#a4c666',
  toBudgetNegative: '#eb8b8b',

  // Buttons
  buttonPrimaryBackground: '#0099ca',
  buttonPrimaryBackgroundHover: '#0086b2',
  buttonPrimaryBorder: '#0086b2',
  buttonPrimaryText: '#ffffff',

  // Window title bar of the installed app (and the mobile status bar)
  mobileViewTheme: '#ececec',
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

export const ynabOverridesCss = `:root {\n  --font-family: ${ynabFontFamily};\n  --budget-month-gap: 8px;\n  --sidebar-text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);\n  --budget-card-gradient: linear-gradient(#4a5c63, #3d4b52 55%, #323d43);\n  --budget-card-edge: #22292b;\n  --budget-card-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 1px 2px rgba(0, 0, 0, 0.3);\n  --budget-card-divider: #2a353b;\n  --budget-card-divider-light: #56636a;\n  --budget-card-icon: #7f8d94;\n  --budget-card-subtext: #c9cfd2;\n  --budget-strip-gradient: linear-gradient(rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.12));\n  --budget-grid-style: dotted;\n  --budget-table-shadow: none;\n${Object.entries(
  ynabOverrides,
)
  .map(([name, value]) => `  --color-${name}: ${value};`)
  .join('\n')}\n}\n${ynabTextRendering}`;
