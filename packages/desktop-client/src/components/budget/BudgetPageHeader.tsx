// @ts-strict-ignore
import React, { memo } from 'react';
import type { ComponentProps } from 'react';

import { View } from '@actual-app/components/view';

import { BudgetMonthCountSelector } from '#components/Titlebar';
import { useGlobalPref } from '#hooks/useGlobalPref';

import { MonthPicker } from './MonthPicker';
import { CATEGORY_COLUMN_WIDTH, getScrollbarWidth } from './util';

type BudgetPageHeaderProps = {
  startMonth: string;
  onMonthSelect: (month: string) => void;
  numMonths: number;
  monthBounds: ComponentProps<typeof MonthPicker>['monthBounds'];
};

export const BudgetPageHeader = memo<BudgetPageHeaderProps>(
  ({ startMonth, onMonthSelect, numMonths, monthBounds }) => {
    const [categoryExpandedStatePref] = useGlobalPref('categoryExpandedState');
    const categoryExpandedState = categoryExpandedStatePref ?? 0;
    const offsetMultipleMonths = numMonths === 1 ? 4 : 0;

    return (
      <View style={{ flexDirection: 'row', flexShrink: 0 }}>
        <View
          style={{
            width:
              CATEGORY_COLUMN_WIDTH +
              100 * categoryExpandedState +
              5 -
              offsetMultipleMonths,
            paddingLeft: 12,
            paddingTop: 5,
            justifyContent: 'center',
          }}
        >
          <BudgetMonthCountSelector />
        </View>
        <View
          style={{
            flex: 1,
            marginRight: 5 + getScrollbarWidth() - offsetMultipleMonths,
          }}
        >
          <MonthPicker
            startMonth={startMonth}
            numDisplayed={numMonths}
            monthBounds={monthBounds}
            style={{ paddingTop: 5 }}
            onSelect={month => onMonthSelect(month)}
          />
        </View>
      </View>
    );
  },
);

BudgetPageHeader.displayName = 'BudgetPageHeader';
