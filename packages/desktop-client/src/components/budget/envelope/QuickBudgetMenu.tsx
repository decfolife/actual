import React from 'react';
import { useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';
import type { QuickBudgetValues } from '@actual-app/core/server/budget/quick-budget';
import { useQuery } from '@tanstack/react-query';

import { FinancialText } from '#components/FinancialText';
import { useFormat } from '#hooks/useFormat';

type QuickBudgetMenuProps = {
  categoryId: string;
  month: string;
  onSelect: (amount: number) => void;
};

/**
 * The menu YNAB 4 showed beside a budget cell being edited: pick last
 * month's budget or outflows, an average, the scheduled outflows, or the
 * amount that brings the balance to zero.
 */
export function QuickBudgetMenu({
  categoryId,
  month,
  onSelect,
}: QuickBudgetMenuProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const { data: values } = useQuery({
    queryKey: ['quick-budget-values', categoryId, month],
    queryFn: (): Promise<QuickBudgetValues> =>
      send('budget/get-quick-budget-values', {
        month,
        category: categoryId,
      }),
    staleTime: 0,
  });

  const items: Array<{ label: string; amount: number | undefined }> = [
    {
      label: t('Amount budgeted last month:'),
      amount: values?.budgetedLastMonth,
    },
    { label: t('Outflows last month:'), amount: values?.outflowsLastMonth },
    {
      label: t('Average outflows for last 3 months:'),
      amount: values?.averageOutflows3Months,
    },
    {
      label: t('Average outflows for last year:'),
      amount: values?.averageOutflows12Months,
    },
    {
      label: t('Total scheduled outflows this month:'),
      amount: values?.scheduledOutflowsThisMonth,
    },
    {
      label: t('Balance to {{zero}}:', { zero: format(0, 'financial') }),
      amount: values?.balanceToZero,
    },
  ];

  return (
    <View
      role="menu"
      style={{
        padding: '3px 0',
        minWidth: 300,
        backgroundColor: theme.menuBackground,
        color: theme.menuItemText,
        fontSize: 14,
      }}
    >
      {items.map(({ label, amount }) => (
        <View
          key={label}
          role="menuitem"
          aria-disabled={amount == null}
          onClick={() => amount != null && onSelect(amount)}
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 6,
            padding: '3px 12px 3px 24px',
            cursor: amount == null ? 'default' : 'pointer',
            ':hover': {
              backgroundColor: theme.menuItemBackgroundHover,
              color: theme.menuItemTextHover,
            },
          }}
        >
          <span>{label}</span>
          <FinancialText style={{ minWidth: 60, textAlign: 'right' }}>
            {amount == null ? '…' : format(amount, 'financial')}
          </FinancialText>
        </View>
      ))}
    </View>
  );
}
