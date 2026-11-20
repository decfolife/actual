// @ts-strict-ignore
import React, { memo } from 'react';
import type { ComponentProps } from 'react';

import { View } from '@actual-app/components/view';

import { useServerURL } from '#components/ServerContext';
import {
  BudgetMonthCountSelector,
  ServerSyncButton,
} from '#components/Titlebar';
import { useGlobalPref } from '#hooks/useGlobalPref';

import { DarkModeToggle } from './DarkModeToggle';
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
    const serverURL = useServerURL();
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
            justifyContent: 'flex-start',
            // The month count and the buttons under it sit in the empty space
            // beside the month cards, so they must not add to the header's height.
            height: 0,
            overflow: 'visible',
            zIndex: 1,
          }}
        >
          <View style={{ flexShrink: 0 }}>
            <BudgetMonthCountSelector />
          </View>
          <View
            style={{
              flexShrink: 0,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginTop: 4,
            }}
          >
            <DarkModeToggle />
            {serverURL ? <ServerSyncButton large /> : null}
          </View>
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
