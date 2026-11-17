// @ts-strict-ignore
import type { CSSProperties } from 'react';
import React, { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  SvgCheveronLeft,
  SvgCheveronRight,
} from '@actual-app/components/icons/v1';
import { SvgCalendar } from '@actual-app/components/icons/v2';
import { styles } from '@actual-app/components/styles';
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

export const MonthPicker = ({
  startMonth,
  numDisplayed,
  monthBounds,
  style,
  onSelect,
}: MonthPickerProps) => {
  const locale = useLocale();
  const { t } = useTranslation();
  const [hoverId, setHoverId] = useState(null);
  const [targetMonthCount, setTargetMonthCount] = useState(12);

  const currentMonth = monthUtils.currentMonth();
  const firstSelectedMonth = startMonth;

  const lastSelectedMonth = monthUtils.addMonths(
    firstSelectedMonth,
    numDisplayed - 1,
  );

  const range = monthUtils.rangeInclusive(
    monthUtils.subMonths(
      firstSelectedMonth,
      Math.floor(targetMonthCount / 2 - numDisplayed / 2),
    ),
    monthUtils.addMonths(
      lastSelectedMonth,
      Math.floor(targetMonthCount / 2 - numDisplayed / 2),
    ),
  );

  const firstSelectedIndex =
    Math.floor(range.length / 2) - Math.floor(numDisplayed / 2);
  const lastSelectedIndex = firstSelectedIndex + numDisplayed - 1;

  const [size, setSize] = useState('small');
  const containerRef = useResizeObserver(
    rect => {
      setSize(rect.width <= 400 ? 'small' : 'big');
      setTargetMonthCount(
        Math.min(Math.max(Math.floor(rect.width / 50), 12), 24),
      );
    },
    { measureOnAttach: true },
  );

  const yearHeadersShown = [];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      <View
        innerRef={containerRef}
        style={{
          flexDirection: 'row',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Link
          variant="button"
          buttonVariant="bare"
          onPress={() => onSelect(currentMonth)}
          style={{
            padding: '3px 3px',
            marginRight: '12px',
          }}
        >
          <View title={t('Today')}>
            <SvgCalendar
              style={{
                width: 16,
                height: 16,
              }}
            />
          </View>
        </Link>
        <Link
          variant="button"
          buttonVariant="bare"
          onPress={() => onSelect(monthUtils.prevMonth(startMonth))}
          style={{
            padding: '3px 3px',
            marginRight: '12px',
          }}
        >
          <View title={t('Previous month')}>
            <SvgCheveronLeft
              style={{
                width: 16,
                height: 16,
              }}
            />
          </View>
        </Link>
        <View
          style={{
            flexDirection: 'row',
            flex: 1,
            maxWidth: size === 'big' ? range.length * 60 : undefined,
            backgroundColor: theme.budgetMonthStripBackground,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {range.map((month, idx) => {
            const monthName = monthUtils.format(month, 'MMM', locale);
            const selected =
              idx >= firstSelectedIndex && idx <= lastSelectedIndex;

            const lastHoverId = hoverId + numDisplayed - 1;
            const hovered =
              hoverId === null ? false : idx >= hoverId && idx <= lastHoverId;

            const current = currentMonth === month;
            const year = monthUtils.getYear(month);

            let showYearHeader = false;

            if (!yearHeadersShown.includes(year)) {
              yearHeadersShown.push(year);
              showYearHeader = true;
            }

            const isMonthBudgeted =
              month >= monthBounds.start && month <= monthBounds.end;

            return (
              <Fragment key={month}>
                {showYearHeader && (
                  <View
                    style={{
                      justifyContent: 'center',
                      padding: '0 6px',
                      backgroundColor: theme.budgetMonthStripYearBackground,
                      color: theme.budgetMonthStripText,
                      fontSize: 11,
                      fontWeight: 'bold',
                      userSelect: 'none',
                      opacity: isMonthBudgeted ? 1 : 0.5,
                    }}
                  >
                    {size === 'small' ? String(year).slice(2) : year}
                  </View>
                )}
                <View
                  data-testid={selected ? 'selected-budget-month' : undefined}
                  data-month={selected ? month : undefined}
                  style={{
                    flex: 1,
                    minWidth: size === 'big' ? 35 : 20,
                    alignItems: 'center',
                    padding: '4px 2px',
                    textAlign: 'center',
                    userSelect: 'none',
                    cursor: 'pointer',
                    color: theme.budgetMonthStripText,
                    borderLeft:
                      showYearHeader || idx === 0
                        ? 'none'
                        : '1px solid ' + theme.budgetMonthStripBorder,
                    ...styles.smallText,
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
                      color: theme.budgetMonthStripSelectedText,
                    }),
                    ...(hoverId !== null &&
                      !hovered &&
                      selected && {
                        filter: 'brightness(80%)',
                      }),
                    ...(current && { fontWeight: 'bold' }),
                  }}
                  onClick={() => onSelect(month)}
                  onMouseEnter={() => setHoverId(idx)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  {size === 'small' ? monthName[0] : monthName}
                </View>
              </Fragment>
            );
          })}
        </View>
        <Link
          variant="button"
          buttonVariant="bare"
          onPress={() => onSelect(monthUtils.nextMonth(startMonth))}
          style={{
            padding: '3px 3px',
            marginLeft: '12px',
          }}
        >
          <View title={t('Next month')}>
            <SvgCheveronRight
              style={{
                width: 16,
                height: 16,
              }}
            />
          </View>
        </Link>
        {/*Keep range centered*/}
        <span
          style={{
            width: '22px',
            marginLeft: '12px',
          }}
        />
      </View>
    </View>
  );
};
