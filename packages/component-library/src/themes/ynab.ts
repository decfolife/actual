// YNAB 4-inspired theme: the Dark theme with a blue sidebar, red negatives,
// striped and hover-highlighted budget rows and darker month cards.
// Applied on top of the generated Dark theme CSS.
const ynabOverrides: Record<string, string> = {
  // Sidebar
  sidebarBackground: '#0f5f97',
  sidebarItemText: '#ffffff',
  sidebarItemTextSelected: '#ffffff',
  sidebarItemTextNegative: '#ffa39c',
  sidebarItemAccentSelected: '#7cc4f0',
  sidebarItemBackgroundHover: '#0c5182',
  sidebarBudgetName: '#ffffff',
  sidebarHeaderText: '#ffffff',
  sidebarTextSubdued: '#cfe6f6',
  sidebarTextMuted: '#9cc9e8',
  sidebarBorder: '#3a7fb0',

  // Page
  pageBackground: '#141d26',
  pageText: '#e6edf3',
  pageTextSubdued: '#8fa1b1',
  pageTextLink: '#5bb4ea',

  // Budget grid
  budgetCurrentMonth: '#1d2935',
  budgetOtherMonth: '#1d2935',
  budgetHeaderCurrentMonth: '#24384b',
  budgetHeaderOtherMonth: '#24384b',
  budgetRowBackgroundAlternate: '#22303e',
  budgetRowBackgroundHover: '#2a4157',

  // Month cards
  budgetSummaryCurrentMonth: '#34404c',
  budgetSummaryOtherMonth: '#34404c',
  budgetSummaryText: '#ffffff',

  // Tables
  tableBackground: '#1d2935',
  tableRowBackgroundAlternate: '#22303e',
  tableText: '#e6edf3',
  tableTextSubdued: '#5f7384',
  tableBorder: '#2c3d4e',
  tableHeaderBackground: '#24384b',
  tableHeaderText: '#9fc6e3',
  tableBorderSelected: '#3aa0e0',
  tableRowBackgroundHover: '#2a4157',
  tableRowBackgroundHighlight: '#1f5a86',
  tableRowBackgroundHighlightText: '#ffffff',
  tableTextSelected: '#ffffff',
  tableRowHeaderBackground: '#24384b',
  tableRowHeaderText: '#e6edf3',

  // Numbers
  numberPositive: '#e6edf3',
  numberNegative: '#ff6b6b',
  budgetNumberPositive: '#e6edf3',
  budgetNumberNegative: '#ff6b6b',
  budgetNumberZero: '#5f7384',
  toBudgetPositive: '#8cc94f',
  toBudgetZero: '#8cc94f',
  toBudgetNegative: '#ff6b6b',

  // Buttons
  buttonPrimaryBackground: '#1b8fd2',
  buttonPrimaryBackgroundHover: '#167bb8',
  buttonPrimaryText: '#ffffff',
};

export const ynabOverridesCss = `:root {\n${Object.entries(ynabOverrides)
  .map(([name, value]) => `  --color-${name}: ${value};`)
  .join('\n')}\n}\n`;
