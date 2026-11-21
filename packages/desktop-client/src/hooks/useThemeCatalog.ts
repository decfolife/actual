import type { CatalogTheme } from '#style/customThemes';

/**
 * The online theme catalog is disabled in this fork so that the app never
 * contacts GitHub. Returns an empty catalog.
 */
export function useThemeCatalog() {
  return {
    data: [] as CatalogTheme[],
    isLoading: false,
    error: null as string | null,
  };
}
