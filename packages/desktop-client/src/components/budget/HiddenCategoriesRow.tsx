import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Popover } from '@actual-app/components/popover';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import type {
  CategoryEntity,
  CategoryGroupEntity,
} from '@actual-app/core/types/models';

import {
  useUpdateCategoryGroupMutation,
  useUpdateCategoryMutation,
} from '#budget/mutations';
import { useEnvelopeSheetValue } from '#components/budget/envelope/EnvelopeBudgetComponents';
import { Row } from '#components/table';
import { useFormat } from '#hooks/useFormat';
import { useGlobalPref } from '#hooks/useGlobalPref';
import { envelopeBudget } from '#spreadsheet/bindings';

import { RenderMonths } from './RenderMonths';
import { BUDGET_ROW_HEIGHT, CATEGORY_COLUMN_WIDTH } from './util';

export type HiddenGroup = {
  group: CategoryGroupEntity;
  categories: CategoryEntity[];
};

/** The expense categories that are hidden (themselves or by their group) */
export function getHiddenGroups(
  categoryGroups: CategoryGroupEntity[],
): HiddenGroup[] {
  return categoryGroups
    .filter(group => !group.is_income)
    .map(group => ({
      group,
      categories: (group.categories ?? []).filter(
        category => group.hidden || category.hidden,
      ),
    }))
    .filter(({ group, categories }) => group.hidden || categories.length > 0);
}

type HiddenCategoriesRowProps = {
  hiddenGroups: HiddenGroup[];
};

/**
 * YNAB 4's "Hidden Categories" row at the bottom of the budget: the hidden
 * categories' totals for each month, and (on hover) an Unhide button that
 * lists them to unhide.
 */
export function HiddenCategoriesRow({
  hiddenGroups,
}: HiddenCategoriesRowProps) {
  const { t } = useTranslation();
  const [categoryExpandedStatePref] = useGlobalPref('categoryExpandedState');
  const categoryExpandedState = categoryExpandedStatePref ?? 0;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const updateCategory = useUpdateCategoryMutation();
  const updateGroup = useUpdateCategoryGroupMutation();

  const categoryIds = hiddenGroups.flatMap(({ categories }) =>
    categories.map(category => category.id),
  );

  function unhideCategory(
    group: CategoryGroupEntity,
    category: CategoryEntity,
  ) {
    updateCategory.mutate({ category: { ...category, hidden: false } });
    if (group.hidden) {
      updateGroup.mutate({ group: { ...group, hidden: false } });
    }
  }

  function unhideGroup({ group, categories }: HiddenGroup) {
    for (const category of categories) {
      if (category.hidden) {
        updateCategory.mutate({ category: { ...category, hidden: false } });
      }
    }
    if (group.hidden) {
      updateGroup.mutate({ group: { ...group, hidden: false } });
    }
  }

  return (
    <Row
      collapsed
      height={BUDGET_ROW_HEIGHT}
      style={{
        fontWeight: 600,
        backgroundColor: theme.budgetHeaderCurrentMonth,
        '& .unhide-button': { opacity: isOpen ? 1 : 0 },
        '&:hover .unhide-button': { opacity: 1 },
      }}
    >
      <View
        style={{
          width: CATEGORY_COLUMN_WIDTH + 100 * categoryExpandedState,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 10,
          paddingRight: 6,
          gap: 8,
          flexShrink: 0,
        }}
      >
        <View style={{ whiteSpace: 'nowrap' }}>
          <Trans>Hidden Categories</Trans>
        </View>
        <Button
          ref={buttonRef}
          className="unhide-button"
          aria-label={t('Unhide categories')}
          onPress={() => setIsOpen(true)}
          style={{ padding: '0 8px', fontSize: 12, minHeight: 18 }}
        >
          <Trans>Unhide</Trans>
        </Button>
        <Popover
          triggerRef={buttonRef}
          placement="top start"
          isOpen={isOpen}
          onOpenChange={() => setIsOpen(false)}
          style={{ width: 360, padding: 0 }}
        >
          <View
            style={{
              padding: '10px 14px',
              fontSize: 17,
              color: theme.pageText,
              backgroundColor: theme.buttonNormalBackground,
              backgroundImage: 'var(--button-gradient, none)',
              borderBottom: `1px solid ${theme.buttonNormalBorder}`,
            }}
          >
            <Trans>Click a category to unhide it</Trans>
          </View>
          <View style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
            {hiddenGroups.map((hidden, index) => (
              <View
                key={hidden.group.id}
                style={{
                  padding: '6px 14px',
                  borderTop:
                    index > 0 ? `1px solid ${theme.tableBorder}` : undefined,
                }}
              >
                <UnhideLink
                  bold
                  onPress={() => {
                    unhideGroup(hidden);
                    if (hiddenGroups.length === 1) {
                      setIsOpen(false);
                    }
                  }}
                >
                  {hidden.group.name}:
                </UnhideLink>
                {hidden.categories.map(category => (
                  <View key={category.id} style={{ paddingLeft: 18 }}>
                    <UnhideLink
                      onPress={() => {
                        unhideCategory(hidden.group, category);
                        if (categoryIds.length === 1) {
                          setIsOpen(false);
                        }
                      }}
                    >
                      {category.name}
                    </UnhideLink>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </Popover>
      </View>
      <RenderMonths>
        {({ month }) => (
          <HiddenCategoriesMonth month={month} categoryIds={categoryIds} />
        )}
      </RenderMonths>
    </Row>
  );
}

type UnhideLinkProps = {
  children: ReactNode;
  bold?: boolean;
  onPress: () => void;
};

function UnhideLink({ children, bold = false, onPress }: UnhideLinkProps) {
  return (
    <Button
      variant="bare"
      onPress={onPress}
      style={{
        justifyContent: 'flex-start',
        padding: '3px 0',
        color: theme.pageTextLink,
        textDecoration: 'underline',
        fontWeight: bold ? 700 : 400,
        fontSize: 15,
        backgroundColor: 'transparent',
      }}
    >
      {children}
    </Button>
  );
}

type Totals = { budgeted: number; spent: number; balance: number };

type HiddenCategoriesMonthProps = {
  month: string;
  categoryIds: CategoryEntity['id'][];
};

// The hidden categories' totals for one month
function HiddenCategoriesMonth({
  month,
  categoryIds,
}: HiddenCategoriesMonthProps) {
  const format = useFormat();
  const [values, setValues] = useState<Record<string, Totals>>({});
  const onValues = useCallback((id: string, totals: Totals) => {
    setValues(prev => ({ ...prev, [id]: totals }));
  }, []);

  const total = categoryIds.reduce(
    (sum, id) => ({
      budgeted: sum.budgeted + (values[id]?.budgeted ?? 0),
      spent: sum.spent + (values[id]?.spent ?? 0),
      balance: sum.balance + (values[id]?.balance ?? 0),
    }),
    { budgeted: 0, spent: 0, balance: 0 },
  );

  const cell = {
    flex: 1,
    textAlign: 'right' as const,
    padding: '0 5px',
    ...styles.tnum,
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: monthUtils.isCurrentMonth(month)
          ? theme.budgetHeaderCurrentMonth
          : theme.budgetHeaderOtherMonth,
      }}
    >
      {categoryIds.map(id => (
        <CategoryValues key={id} id={id} onValues={onValues} />
      ))}
      <View style={cell}>{format(total.budgeted, 'financial')}</View>
      <View style={cell}>{format(total.spent, 'financial')}</View>
      <View style={{ ...cell, paddingRight: styles.monthRightPadding }}>
        {format(total.balance, 'financial')}
      </View>
    </View>
  );
}

type CategoryValuesProps = {
  id: CategoryEntity['id'];
  onValues: (id: string, totals: Totals) => void;
};

// Reads one category's numbers for the month and reports them up
function CategoryValues({ id, onValues }: CategoryValuesProps) {
  const budgeted = useEnvelopeSheetValue(envelopeBudget.catBudgeted(id)) ?? 0;
  const spent = useEnvelopeSheetValue(envelopeBudget.catSumAmount(id)) ?? 0;
  const balance = useEnvelopeSheetValue(envelopeBudget.catBalance(id)) ?? 0;

  useEffect(() => {
    onValues(id, {
      budgeted: Number(budgeted),
      spent: Number(spent),
      balance: Number(balance),
    });
  }, [id, budgeted, spent, balance, onValues]);

  return null;
}
