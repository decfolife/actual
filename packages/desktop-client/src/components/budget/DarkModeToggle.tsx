import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgMoonStars, SvgSun } from '@actual-app/components/icons/v2';
import { Tooltip } from '@actual-app/components/tooltip';

import { useGlobalPref } from '#hooks/useGlobalPref';
import { useTheme } from '#style';

/**
 * One-click switch between light and dark colors for the YNAB theme. The
 * full list of themes stays in Settings.
 */
export function DarkModeToggle() {
  const { t } = useTranslation();
  const [theme, setTheme] = useTheme();
  const [ynabDark = false, setYnabDark] = useGlobalPref('ynabDark');
  const isDark =
    theme === 'ynab' ? ynabDark : theme === 'dark' || theme === 'midnight';
  const label = isDark ? t('Switch to light mode') : t('Switch to dark mode');
  const Icon = isDark ? SvgSun : SvgMoonStars;

  return (
    <Tooltip placement="bottom start" content={label}>
      <Button
        variant="bare"
        aria-label={label}
        onPress={() => {
          // Always end up on the YNAB theme (it holds the fork's behavior);
          // dark mode only changes its colors.
          if (theme !== 'ynab') setTheme('ynab');
          setYnabDark(!isDark);
        }}
        style={{
          minWidth: 36,
          minHeight: 32,
          padding: '0 8px',
        }}
      >
        <Icon style={{ width: 20, height: 20, color: 'inherit' }} />
      </Button>
    </Tooltip>
  );
}
