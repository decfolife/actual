import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgMoonStars, SvgSun } from '@actual-app/components/icons/v2';
import { Tooltip } from '@actual-app/components/tooltip';

import { useTheme } from '#style';

/**
 * One-click switch between the default (YNAB) look and dark mode. The full
 * list of themes stays in Settings.
 */
export function DarkModeToggle() {
  const { t } = useTranslation();
  const [theme, setTheme] = useTheme();
  const isDark = theme === 'dark' || theme === 'midnight';
  const label = isDark ? t('Switch to light mode') : t('Switch to dark mode');
  const Icon = isDark ? SvgSun : SvgMoonStars;

  return (
    <Tooltip placement="bottom start" content={label}>
      <Button
        variant="bare"
        aria-label={label}
        onPress={() => setTheme(isDark ? 'ynab' : 'dark')}
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
