import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCalendar } from '@actual-app/components/icons/v2';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { TransObjectLiteral } from '@actual-app/core/types/util';

import { useBudgetMonthCount } from './BudgetMonthCountContext';

type MonthCountSelectorProps = {
  maxMonths: number;
  onChange: (value: number) => void;
};

/**
 * Fewer/more months shown at a time, up to as many as fit on this screen.
 * The choice is saved per device, so a big monitor and a phone each keep
 * their own.
 */
export function MonthCountSelector({
  maxMonths,
  onChange,
}: MonthCountSelectorProps) {
  const { t } = useTranslation();
  const { displayMax } = useBudgetMonthCount();

  const count = Math.max(1, Math.min(maxMonths, displayMax));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginRight: 20,
        WebkitAppRegion: 'no-drag',
      }}
      title={t('Choose the number of months shown at a time')}
    >
      <Button
        aria-label={t('Show fewer months')}
        isDisabled={count <= 1}
        onPress={() => onChange(count - 1)}
        style={{ padding: '0 7px', minHeight: 22, fontWeight: 700 }}
      >
        −
      </Button>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          minWidth: 64,
          justifyContent: 'center',
          color: theme.pageText,
          whiteSpace: 'nowrap',
        }}
      >
        <SvgCalendar style={{ width: 13, height: 13 }} />
        {count === 1 ? (
          <Trans>1 month</Trans>
        ) : (
          <Trans>{{ count } as TransObjectLiteral} months</Trans>
        )}
      </View>
      <Button
        aria-label={t('Show more months')}
        isDisabled={count >= displayMax}
        onPress={() => onChange(count + 1)}
        style={{ padding: '0 7px', minHeight: 22, fontWeight: 700 }}
      >
        +
      </Button>
    </View>
  );
}
