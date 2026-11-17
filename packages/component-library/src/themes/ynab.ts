// YNAB 4-inspired theme: the Light theme with a blue sidebar and frame, a
// light-gray budget panel, a dark month strip and month cards, a pale green
// column header row, light blue category group rows and boxed budget cells.
// Applied on top of the generated Light theme CSS.
const ynabOverrides: Record<string, string> = {
  // Sidebar
  sidebarBackground: '#0099ca',
  sidebarAccountGroupBackground: '#0072a0',
  sidebarItemText: '#ffffff',
  sidebarItemTextSelected: '#ffffff',
  sidebarItemTextNegative: '#ffb3ab',
  sidebarItemAccentSelected: '#ffffff',
  sidebarItemBackgroundSelected: '#00476c',
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
  budgetMonthStripYearBackground: '#2c3536',
  budgetMonthStripBorder: '#586b73',
  budgetMonthStripText: '#ffffff',
  budgetMonthStripSelectedBackground: '#186c89',
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
  budgetRowBackgroundHover: '#f0f9fd',
  budgetCellBorder: '#c8c8c8',

  // Tables
  tableBackground: '#ffffff',
  tableRowBackgroundAlternate: '#ffffff',
  tableText: '#2b2b2b',
  tableTextSubdued: '#9a9a9a',
  tableBorder: '#d4d4d4',
  tableHeaderBackground: '#ecf5e7',
  tableHeaderText: '#4d4d4d',
  tableBorderSelected: '#0099ca',
  tableRowBackgroundHover: '#f0f9fd',
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
};

// YNAB 4 on the Mac used Lucida Grande
const ynabFontFamily =
  "'Lucida Grande', 'Lucida Sans Unicode', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const ynabOverridesCss = `:root {\n  --font-family: ${ynabFontFamily};\n${Object.entries(
  ynabOverrides,
)
  .map(([name, value]) => `  --color-${name}: ${value};`)
  .join('\n')}\n}\n`;
