import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronDown } from '@actual-app/components/icons/v1';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import type { RuleConditionEntity } from '@actual-app/core/types/models';
import { format as formatDate, startOfMonth, subMonths } from 'date-fns';
import { isEqual } from 'es-toolkit/compat';

type DateRange =
  | 'this-month'
  | 'latest-3-months'
  | 'this-year'
  | 'last-month'
  | 'last-year';

type DateRangeButtonProps = {
  filterConditions: RuleConditionEntity[];
  onApplyFilter: (condition: RuleConditionEntity) => void;
  onUpdateFilter: (
    oldCondition: RuleConditionEntity,
    newCondition: RuleConditionEntity,
  ) => void;
  onDeleteFilter: (condition: RuleConditionEntity) => void;
};

/**
 * YNAB 4's "All Dates" dropdown: shows the account's transactions for a
 * preset date range. The range is added as an ordinary date filter.
 */
export function DateRangeButton({
  filterConditions,
  onApplyFilter,
  onUpdateFilter,
  onDeleteFilter,
}: DateRangeButtonProps) {
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [today] = useState(() => new Date());

  const labels: Record<DateRange | 'all', string> = {
    all: t('All Dates'),
    'this-month': t('This Month'),
    'latest-3-months': t('Latest Three Months'),
    'this-year': t('This Year'),
    'last-month': t('Last Month'),
    'last-year': t('Last Year'),
  };

  const ranges = Object.keys(labels).filter((r): r is DateRange => r !== 'all');
  const conditions = Object.fromEntries(
    ranges.map(r => [r, conditionForRange(r, today)]),
  ) as Record<DateRange, RuleConditionEntity>;

  let active: { range: DateRange; condition: RuleConditionEntity } | null =
    null;
  for (const condition of filterConditions) {
    const range = ranges.find(r => isEqual(conditions[r], condition));
    if (range) {
      active = { range, condition };
      break;
    }
  }

  function select(name: DateRange | 'all') {
    if (name === 'all') {
      if (active) {
        onDeleteFilter(active.condition);
      }
    } else if (active) {
      onUpdateFilter(active.condition, conditions[name]);
    } else {
      onApplyFilter(conditions[name]);
    }
    setIsOpen(false);
  }

  return (
    <>
      <Button
        ref={triggerRef}
        aria-label={t('Date range')}
        onPress={() => setIsOpen(true)}
      >
        {labels[active?.range ?? 'all']}
        <SvgCheveronDown style={{ width: 12, height: 12, marginLeft: 4 }} />
      </Button>
      <Popover
        triggerRef={triggerRef}
        placement="bottom start"
        isOpen={isOpen}
        onOpenChange={() => setIsOpen(false)}
      >
        <Menu
          onMenuSelect={select}
          items={(['all', ...ranges] as const).map(name => ({
            name,
            text: labels[name],
          }))}
        />
      </Popover>
    </>
  );
}

function conditionForRange(range: DateRange, today: Date): RuleConditionEntity {
  switch (range) {
    case 'this-month':
      return monthCondition(today);
    case 'last-month':
      return monthCondition(subMonths(today, 1));
    case 'latest-3-months':
      return {
        field: 'date',
        op: 'gte',
        value: formatDate(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd'),
        type: 'date',
      } as RuleConditionEntity;
    case 'this-year':
      return yearCondition(today.getFullYear());
    case 'last-year':
      return yearCondition(today.getFullYear() - 1);
    default:
      throw new Error(`Unknown date range: ${range satisfies never}`);
  }
}

function monthCondition(date: Date): RuleConditionEntity {
  return {
    field: 'date',
    op: 'is',
    value: formatDate(date, 'yyyy-MM'),
    options: { month: true },
    type: 'date',
  } as RuleConditionEntity;
}

function yearCondition(year: number): RuleConditionEntity {
  return {
    field: 'date',
    op: 'is',
    value: String(year),
    options: { year: true },
    type: 'date',
  } as RuleConditionEntity;
}
