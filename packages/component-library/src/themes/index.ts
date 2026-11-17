import { colors } from './source/colors';
import { generatePaletteCss, generateThemeCss } from './source/generate';
import { palette } from './source/palette';
import { ynabOverridesCss } from './ynab';

export const paletteCss = generatePaletteCss(palette);
export const lightThemeCss = generateThemeCss('light', colors, palette);
export const darkThemeCss = generateThemeCss('dark', colors, palette);
export const midnightThemeCss = generateThemeCss('midnight', colors, palette);
export const ynabThemeCss = darkThemeCss + ynabOverridesCss;
