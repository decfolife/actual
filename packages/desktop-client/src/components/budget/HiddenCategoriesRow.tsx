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
  useCreateCategoryGroupMutation,
  useMoveCategoryMutation,
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

/**
 * A YNAB 4 import puts hidden categories in a regular group named "Hidden
 * Categories", naming each "Group/Category" after where it came from. The
 * YNAB theme treats that group as the hidden list.
 */
export const IMPORTED_HIDDEN_GROUP_NAME = 'Hidden Categories';

export function isImportedHiddenGroup(group: CategoryGroupEntity) {
  return !group.is_income && group.name === IMPORTED_HIDDEN_GROUP_NAME;
}

export type HiddenCategory = {
  category: CategoryEntity;
  /** Shown in the unhide list */
  name: string;
  /** For a category in the imported group: where unhiding moves it back to */
  restoreTo?: { groupName: string; name: string };
};

export type HiddenGroup = {
  key: string;
  name: string;
  /** Absent for an imported category whose original group no longer exists */
  group?: CategoryGroupEntity;
  categories: HiddenCategory[];
};

/** The expense categories that are hidden (themselves or by their group) */
export function getHiddenGroups(
  categoryGroups: CategoryGroupEntity[],
): HiddenGroup[] {
  const expenseGroups = categoryGroups.filter(group => !group.is_income);
  const hiddenGroups: HiddenGroup[] = expenseGroups
    .filter(group => !isImportedHiddenGroup(group))
    .map(group => ({
      key: group.id,
      name: group.name,
      group,
      categories: (group.categories ?? [])
        .filter(category => group.hidden || category.hidden)
        .map(category => ({ category, name: category.name })),
    }));

  // List the imported hidden categories under the group they came from
  for (const imported of expenseGroups.filter(isImportedHiddenGroup)) {
    for (const category of imported.categories ?? []) {
      const slash = category.name.indexOf('/');
      const groupName =
        slash > 0 ? category.name.slice(0, slash).trim() : category.name;
      const name =
        slash > 0 ? category.name.slice(slash + 1).trim() : category.name;
      let entry = hiddenGroups.find(
        hidden => hidden.name.toUpperCase() === groupName.toUpperCase(),
      );
      if (!entry) {
        entry = {
          key: `imported:${groupName}`,
          name: groupName,
          categories: [],
        };
        hiddenGroups.push(entry);
      }
      entry.categories.push({
        category,
        name,
        restoreTo: { groupName, name },
      });
    }
  }

  return hiddenGroups.filter(
    hidden => hidden.group?.hidden || hidden.categories.length > 0,
  );
}

type HiddenCategoriesRowProps = {
  hiddenGroups: HiddenGroup[];
  categoryGroups: CategoryGroupEntity[];
};

/**
 * YNAB 4's "Hidden Categories" row at the bottom of the budget: the hidden
 * categories' totals for each month, and (on hover) an Unhide button that
 * lists them to unhide.
 */
export function HiddenCategoriesRow({
  hiddenGroups,
  categoryGroups,
}: HiddenCategoriesRowProps) {
  const { t } = useTranslation();
  const [categoryExpandedStatePref] = useGlobalPref('categoryExpandedState');
  const categoryExpandedState = categoryExpandedStatePref ?? 0;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const updateCategory = useUpdateCategoryMutation();
  const updateGroup = useUpdateCategoryGroupMutation();
  const moveCategory = useMoveCategoryMutation();
  const createGroup = useCreateCategoryGroupMutation();

  const categoryIds = hiddenGroups.flatMap(({ categories }) =>
    categories.map(({ category }) => category.id),
  );

  // Move an imported hidden category back to its group (making the group if
  // it's gone), under its own name unless that's taken there
  async function restoreImported(
    { category, restoreTo }: HiddenCategory,
    groupIds: Map<string, string>,
  ) {
    if (!restoreTo) {
      return;
    }
    const key = restoreTo.groupName.toUpperCase();
    let groupId = groupIds.get(key);
    if (!groupId) {
      groupId = await createGroup.mutateAsync({ name: restoreTo.groupName });
      groupIds.set(key, groupId);
    }
    const target = categoryGroups.find(group => group.id === groupId);
    const isNameTaken = (target?.categories ?? []).some(
      other => other.name.toUpperCase() === restoreTo.name.toUpperCase(),
    );
    await updateCategory.mutateAsync({
      category: {
        ...category,
        name: isNameTaken ? category.name : restoreTo.name,
        hidden: false,
      },
    });
    await moveCategory.mutateAsync({
      id: category.id,
      groupId,
      targetId: null,
    });
  }

  function existingGroupIds() {
    return new Map(
      categoryGroups
        .filter(group => !group.is_income && !isImportedHiddenGroup(group))
        .map(group => [group.name.toUpperCase(), group.id]),
    );
  }

  async function unhideCategories(
    hiddenGroup: HiddenGroup,
    categories: HiddenCategory[],
  ) {
    const groupIds = existingGroupIds();
    for (const hidden of categories) {
      if (hidden.restoreTo) {
        await restoreImported(hidden, groupIds);
      } else if (hidden.category.hidden) {
        await updateCategory.mutateAsync({
          category: { ...hidden.category, hidden: false },
        });
      }
    }
    // Unhiding a group's category shows the group too, so it's visible
    const group = hiddenGroup.group;
    if (group?.hidden) {
      await updateGroup.mutateAsync({ group: { ...group, hidden: false } });
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
          <View
            style={{
              maxHeight: 'min(480px, 60vh)',
              overflowY: 'auto',
              padding: '8px 0',
            }}
          >
            {hiddenGroups.map((hiddenGroup, index) => (
              <View
                key={hiddenGroup.key}
                style={{
                  padding: '6px 14px',
                  flexShrink: 0,
                  borderTop:
                    index > 0 ? `1px solid ${theme.tableBorder}` : undefined,
                }}
              >
                <UnhideLink
                  bold
                  onPress={() => {
                    if (hiddenGroups.length === 1) {
                      setIsOpen(false);
                    }
                    void unhideCategories(hiddenGroup, hiddenGroup.categories);
                  }}
                >
                  {hiddenGroup.name}:
                </UnhideLink>
                {hiddenGroup.categories.map(hidden => (
                  <View
                    key={hidden.category.id}
                    style={{ paddingLeft: 18, flexShrink: 0 }}
                  >
                    <UnhideLink
                      onPress={() => {
                        if (categoryIds.length === 1) {
                          setIsOpen(false);
                        }
                        void unhideCategories(hiddenGroup, [hidden]);
                      }}
                    >
                      {hidden.name}
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
        flexShrink: 0,
        textAlign: 'left',
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
