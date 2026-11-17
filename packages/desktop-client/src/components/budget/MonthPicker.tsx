// @ts-strict-ignore
import type { CSSProperties } from 'react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  SvgCheveronLeft,
  SvgCheveronRight,
} from '@actual-app/components/icons/v1';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';

import { Link } from '#components/common/Link';
import { useLocale } from '#hooks/useLocale';
import { useResizeObserver } from '#hooks/useResizeObserver';

import type { MonthBounds } from './MonthsContext';

type MonthPickerProps = {
  startMonth: string;
  numDisplayed: number;
  monthBounds: MonthBounds;
  style: CSSProperties;
  onSelect: (month: string) => void;
};

/**
 * YNAB 4's month strip: the calendar year of the first month shown, with
 * the shown months highlighted and arrow tabs at each end.
 */
export const MonthPicker = ({
  startMonth,
  numDisplayed,
  monthBounds,
  style,
  onSelect,
}: MonthPickerProps) => {
  const locale = useLocale();
  const { t } = useTranslation();
  const [hoverMonth, setHoverMonth] = useState<string | null>(null);
  const [nameFormat, setNameFormat] = useState<'MMMM' | 'MMM' | 'MMMMM'>('MMM');

  const currentMonth = monthUtils.currentMonth();
  const lastSelectedMonth = monthUtils.addMonths(startMonth, numDisplayed - 1);
  const year = monthUtils.getYear(startMonth);
  const months = monthUtils.rangeInclusive(`${year}-01`, `${year}-12`);

  const containerRef = useResizeObserver(
    rect => {
      const perMonth = rect.width / 13;
      setNameFormat(perMonth >= 80 ? 'MMMM' : perMonth >= 36 ? 'MMM' : 'MMMMM');
    },
    { measureOnAttach: true },
  );

  const lastHoverMonth =
    hoverMonth && monthUtils.addMonths(hoverMonth, numDisplayed - 1);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'stretch',
        ...style,
      }}
    >
      <ArrowTab
        side="left"
        label={t('Previous month')}
        onPress={() => onSelect(monthUtils.prevMonth(startMonth))}
      />
      <View
        innerRef={containerRef}
        style={{
          flex: 1,
          flexDirection: 'row',
          backgroundColor: theme.budgetMonthStripBackground,
          backgroundImage: 'var(--budget-strip-gradient, none)',
          borderRadius: 2,
          overflow: 'hidden',
          textShadow: 'var(--sidebar-text-shadow, none)',
        }}
      >
        <View
          style={{
            justifyContent: 'center',
            padding: '0 7px',
            backgroundColor: theme.budgetMonthStripYearBackground,
            color: theme.budgetMonthStripText,
            fontSize: 14,
            fontWeight: 600,
            opacity: 0.75,
            userSelect: 'none',
          }}
        >
          {year}
        </View>
        {months.map((month, idx) => {
          const selected = month >= startMonth && month <= lastSelectedMonth;
          const hovered =
            hoverMonth != null &&
            month >= hoverMonth &&
            month <= lastHoverMonth;
          const isMonthBudgeted =
            month >= monthBounds.start && month <= monthBounds.end;

          return (
            <View
              key={month}
              data-testid={selected ? 'selected-budget-month' : undefined}
              data-month={selected ? month : undefined}
              onClick={() => onSelect(month)}
              onMouseEnter={() => setHoverMonth(month)}
              onMouseLeave={() => setHoverMonth(null)}
              style={{
                position: 'relative',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 2px',
                userSelect: 'none',
                cursor: 'pointer',
                color: theme.budgetMonthStripText,
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                borderLeft:
                  idx === 0
                    ? 'none'
                    : '1px solid ' + theme.budgetMonthStripBorder,
                ...(!isMonthBudgeted && {
                  textDecoration: 'line-through',
                  opacity: 0.5,
                }),
                ...(hovered &&
                  !selected && {
                    backgroundColor: `color-mix(in srgb, ${theme.budgetMonthStripSelectedBackground} 45%, transparent)`,
                  }),
                ...(selected && {
                  backgroundColor: theme.budgetMonthStripSelectedBackground,
                  backgroundImage: 'var(--budget-strip-gradient, none)',
                  color: theme.budgetMonthStripSelectedText,
                }),
              }}
            >
              {month === currentMonth && (
                <View
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '8px 8px 0 0',
                    borderColor: `${theme.budgetSummaryCurrentMonthMarker} transparent transparent transparent`,
                  }}
                />
              )}
              {monthUtils.format(month, nameFormat, locale)}
            </View>
          );
        })}
      </View>
      <ArrowTab
        side="right"
        label={t('Next month')}
        onPress={() => onSelect(monthUtils.nextMonth(startMonth))}
      />
    </View>
  );
};

type ArrowTabProps = {
  side: 'left' | 'right';
  label: string;
  onPress: () => void;
};

function ArrowTab({ side, label, onPress }: ArrowTabProps) {
  const Icon = side === 'left' ? SvgCheveronLeft : SvgCheveronRight;

  return (
    <Link
      variant="button"
      buttonVariant="bare"
      aria-label={label}
      onPress={onPress}
      style={{
        width: 32,
        padding: 0,
        justifyContent: 'center',
        alignItems: 'center',
        margin: side === 'left' ? '0 3px 0 0' : '0 0 0 3px',
        borderRadius:
          side === 'left' ? '12px 3px 3px 12px' : '3px 12px 12px 3px',
        border: '1px solid ' + theme.budgetMonthOutline,
        backgroundColor: theme.budgetPagePanel,
        backgroundImage:
          'linear-gradient(rgba(255, 255, 255, 0.6), rgba(0, 0, 0, 0.06))',
        color: theme.pageTextSubdued,
      }}
    >
      <Icon width={14} height={14} />
    </Link>
  );
}
