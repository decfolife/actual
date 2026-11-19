import React, { memo, useMemo, useState } from 'react';

import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type {
  CategoryEntity,
  CategoryGroupEntity,
} from '@actual-app/core/types/models';

import {
  BUDGET_ROW_HEIGHT,
  CATEGORY_COLUMN_WIDTH,
} from '#components/budget/util';
import { DropHighlightPosContext } from '#components/sort';
import type { DragState, OnDropCallback } from '#components/sort';
import { Row } from '#components/table';
import { useGlobalPref } from '#hooks/useGlobalPref';
import { useLocalPref } from '#hooks/useLocalPref';
import { useTheme } from '#style';

import { ExpenseCategory } from './ExpenseCategory';
import { ExpenseGroup } from './ExpenseGroup';
import {
  getHiddenGroups,
  HiddenCategoriesRow,
  isImportedHiddenGroup,
} from './HiddenCategoriesRow';
import type { HiddenGroup } from './HiddenCategoriesRow';
import { IncomeCategory } from './IncomeCategory';
import { IncomeGroup } from './IncomeGroup';
import { IncomeHeader } from './IncomeHeader';
import { RenderMonths } from './RenderMonths';
import { SidebarCategory } from './SidebarCategory';
import { SidebarGroup } from './SidebarGroup';
import { separateGroups } from './util';

type BudgetItem =
  | { type: 'new-group' }
  | { type: 'new-category' }
  | { type: 'expense-group'; value: CategoryGroupEntity }
  | {
      type: 'expense-category';
      value: CategoryEntity;
      group: CategoryGroupEntity;
    }
  | { type: 'income-separator' }
  | { type: 'income-group'; value: CategoryGroupEntity }
  | { type: 'income-category'; value: CategoryEntity }
  | { type: 'hidden-categories'; hiddenGroups: HiddenGroup[] };

type LocalDragState =
  | DragState<CategoryEntity>
  | DragState<CategoryGroupEntity>
  | null;

type BudgetCategoriesProps = {
  categoryGroups: CategoryGroupEntity[];
  editingCell: { id: string; cell: string } | null;
  onBudgetAction: (month: string, action: string, arg: unknown) => void;
  onShowActivity: (id: CategoryEntity['id'], month?: string) => void;
  onEditName: (id: CategoryEntity['id']) => void;
  onEditMonth: (id: CategoryEntity['id'], month: string) => void;
  onSaveCategory: (category: CategoryEntity) => void;
  onSaveGroup: (group: CategoryGroupEntity) => void;
  onDeleteCategory: (id: CategoryEntity['id']) => void;
  onDeleteGroup: (id: CategoryGroupEntity['id']) => void;
  onApplyBudgetTemplatesInGroup: (categoryIds: CategoryEntity['id'][]) => void;
  onSortCategories?: (
    groupId: CategoryGroupEntity['id'],
    direction: 'asc' | 'desc',
  ) => void;
  onReorderCategory: OnDropCallback;
  onReorderGroup: OnDropCallback;
  isAddingGroup: boolean;
  onAddingGroupChange: (isAddingGroup: boolean) => void;
  showIncome: boolean;
};

export const BudgetCategories = memo<BudgetCategoriesProps>(
  ({
    categoryGroups,
    editingCell,
    onBudgetAction,
    onShowActivity,
    onEditName,
    onEditMonth,
    onSaveCategory,
    onSaveGroup,
    onDeleteCategory,
    onDeleteGroup,
    onApplyBudgetTemplatesInGroup,
    onSortCategories,
    onReorderCategory,
    onReorderGroup,
    isAddingGroup,
    onAddingGroupChange,
    showIncome,
  }) => {
    const [collapsedGroupIds = [], setCollapsedGroupIdsPref] =
      useLocalPref('budget.collapsed');
    const [showHiddenCategoriesPref] = useLocalPref(
      'budget.showHiddenCategories',
    );
    // YNAB 4 keeps hidden categories out of the grid, totalled in a "Hidden
    // Categories" row at the bottom that can unhide them
    const [themeName] = useTheme();
    const isYnab = themeName === 'ynab';
    const showHiddenCategories = !isYnab && showHiddenCategoriesPref;
    const [categoryExpandedStatePref] = useGlobalPref('categoryExpandedState');
    const categoryExpandedState = categoryExpandedStatePref ?? 0;
    function onCollapse(value: Array<CategoryGroupEntity['id']>) {
      setCollapsedGroupIdsPref(value);
    }

    const [newCategoryForGroup, setNewCategoryForGroup] = useState<
      string | null
    >(null);
    const items: BudgetItem[] = useMemo(() => {
      const [expenseGroups, incomeGroup] = separateGroups(categoryGroups);

      let items: BudgetItem[] = Array.prototype.concat.apply(
        [],
        expenseGroups.map(group => {
          if (
            (group.hidden && !showHiddenCategories) ||
            (isYnab && isImportedHiddenGroup(group))
          ) {
            return [];
          }

          const groupCategories = group.categories?.filter(
            cat => showHiddenCategories || !cat.hidden,
          );

          const items: BudgetItem[] = [
            { type: 'expense-group', value: { ...group } },
          ];

          if (newCategoryForGroup === group.id) {
            items.push({ type: 'new-category' });
          }

          return [
            ...items,
            ...(collapsedGroupIds.includes(group.id)
              ? []
              : groupCategories || []
            ).map((cat): BudgetItem => ({
              type: 'expense-category',
              value: cat,
              group,
            })),
          ];
        }),
      );

      if (isAddingGroup) {
        items.push({ type: 'new-group' });
      }

      if (isYnab) {
        const hiddenGroups = getHiddenGroups(categoryGroups);
        if (hiddenGroups.length > 0) {
          items.push({ type: 'hidden-categories', hiddenGroups });
        }
      }

      if (incomeGroup && showIncome) {
        const incomeCategoryItems: BudgetItem[] = [
          { type: 'income-separator' },
          { type: 'income-group', value: incomeGroup },
        ];

        if (newCategoryForGroup === incomeGroup.id) {
          incomeCategoryItems.push({ type: 'new-category' });
        }

        incomeCategoryItems.push(
          ...(collapsedGroupIds.includes(incomeGroup.id)
            ? []
            : incomeGroup.categories?.filter(
                cat => showHiddenCategories || !cat.hidden,
              ) || []
          ).map((cat): BudgetItem => ({
            type: 'income-category',
            value: cat,
          })),
        );

        items = items.concat(incomeCategoryItems);
      }

      return items;
    }, [
      categoryGroups,
      showIncome,
      collapsedGroupIds,
      newCategoryForGroup,
      isAddingGroup,
      showHiddenCategories,
      isYnab,
    ]);

    const [dragState, setDragState] = useState<LocalDragState>(null);
    const [savedCollapsed, setSavedCollapsed] = useState<Array<
      CategoryGroupEntity['id']
    > | null>(null);

    // TODO: If we turn this into a reducer, we could probably memoize
    // each item in the list for better perf
    function onDragChange(
      newDragState: DragState<CategoryEntity> | DragState<CategoryGroupEntity>,
    ) {
      const { state } = newDragState;

      if (state === 'start-preview') {
        // @ts-expect-error fix me
        setDragState({
          type: newDragState.type,
          item: newDragState.item,
          preview: true,
        });
      } else if (state === 'start') {
        if (dragState) {
          setDragState({
            ...dragState,
            preview: false,
          });
          setSavedCollapsed(collapsedGroupIds);
        }
      } else if (state === 'end') {
        setDragState(null);
        onCollapse(savedCollapsed || []);
      }
    }

    function onToggleCollapse(id: CategoryGroupEntity['id']) {
      if (collapsedGroupIds.includes(id)) {
        onCollapse(collapsedGroupIds.filter(id_ => id_ !== id));
      } else {
        onCollapse([...collapsedGroupIds, id]);
      }
    }

    function onShowNewGroup() {
      onAddingGroupChange(true);
    }

    function onHideNewGroup() {
      onAddingGroupChange(false);
    }

    function _onSaveGroup(group: CategoryGroupEntity) {
      onSaveGroup?.(group);
      if (group.id === 'new') {
        onHideNewGroup();
      }
    }

    function onShowNewCategory(groupId: CategoryGroupEntity['id']) {
      onCollapse(collapsedGroupIds.filter(c => c !== groupId));
      setNewCategoryForGroup(groupId);
    }

    function onHideNewCategory() {
      setNewCategoryForGroup(null);
    }

    function _onSaveCategory(category: CategoryEntity) {
      onSaveCategory?.(category);
      if (category.id === 'new') {
        onHideNewCategory();
      }
    }

    // Stripe every other category row, restarting under each group heading.
    const isAlternateRow: boolean[] = [];
    let rowInGroup = 0;
    for (const item of items) {
      const isCategory =
        item.type === 'expense-category' || item.type === 'income-category';
      if (!isCategory) {
        rowInGroup = 0;
      }
      isAlternateRow.push(isCategory && rowInGroup % 2 === 1);
      if (isCategory) {
        rowInGroup++;
      }
    }

    return (
      <View
        style={{
          // The panel shows around the rounded tops of the columns
          backgroundColor: theme.budgetPagePanel,
          overflow: 'hidden',
          boxShadow: `var(--budget-table-shadow, ${styles.cardShadow})`,
          borderRadius: '0 0 4px 4px',
          flex: 1,
          position: 'relative',
        }}
      >
        <View
          aria-hidden
          style={{
            // Outline the category column as its own panel, like YNAB 4
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: CATEGORY_COLUMN_WIDTH + 100 * categoryExpandedState,
            border: '1px solid ' + theme.budgetMonthOutline,
            borderRadius: '4px 4px 0 0',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
        <BudgetGridTop />
        {items.map((item, idx) => {
          let content;
          switch (item.type) {
            case 'new-group':
              content = (
                <Row
                  height={BUDGET_ROW_HEIGHT}
                  style={{ backgroundColor: theme.budgetHeaderCurrentMonth }}
                >
                  <SidebarGroup
                    group={{ id: 'new', name: '' }}
                    collapsed={false}
                    editing
                    onSave={_onSaveGroup}
                    onHideNewGroup={onHideNewGroup}
                    onEdit={onEditName}
                  />
                </Row>
              );
              break;
            case 'new-category':
              content = (
                <Row height={BUDGET_ROW_HEIGHT}>
                  <SidebarCategory
                    innerRef={null}
                    category={{
                      name: '',
                      group: newCategoryForGroup!,
                      is_income:
                        newCategoryForGroup ===
                        categoryGroups.find(g => g.is_income)?.id,
                      id: 'new',
                    }}
                    editing
                    onSave={_onSaveCategory}
                    onHideNewCategory={onHideNewCategory}
                    onEditName={onEditName!}
                  />
                </Row>
              );
              break;

            case 'expense-group':
              content = (
                <ExpenseGroup
                  group={item.value}
                  editingCell={editingCell}
                  collapsed={collapsedGroupIds.includes(item.value.id)}
                  dragState={dragState}
                  onEditName={onEditName}
                  onSave={_onSaveGroup}
                  onDelete={onDeleteGroup}
                  onDragChange={onDragChange}
                  onReorderGroup={onReorderGroup}
                  onReorderCategory={onReorderCategory}
                  onToggleCollapse={onToggleCollapse}
                  onShowNewCategory={onShowNewCategory}
                  onApplyBudgetTemplatesInGroup={onApplyBudgetTemplatesInGroup}
                  onSortCategories={onSortCategories}
                />
              );
              break;
            case 'expense-category':
              content = (
                <ExpenseCategory
                  cat={item.value}
                  categoryGroup={item.group}
                  editingCell={editingCell}
                  dragState={dragState}
                  onEditName={onEditName}
                  onEditMonth={onEditMonth}
                  onSave={_onSaveCategory}
                  onDelete={onDeleteCategory}
                  onDragChange={onDragChange}
                  onReorder={onReorderCategory}
                  onBudgetAction={onBudgetAction}
                  onShowActivity={onShowActivity}
                />
              );
              break;
            case 'income-separator':
              content = (
                <View
                  style={{
                    height: styles.incomeHeaderHeight,
                    backgroundColor: theme.budgetCurrentMonth,
                  }}
                >
                  <IncomeHeader onShowNewGroup={onShowNewGroup} />
                </View>
              );
              break;
            case 'income-group':
              content = (
                <IncomeGroup
                  group={item.value}
                  editingCell={editingCell}
                  collapsed={collapsedGroupIds.includes(item.value.id)}
                  onEditName={onEditName!}
                  onSave={_onSaveGroup}
                  onSortCategories={onSortCategories}
                  onToggleCollapse={onToggleCollapse}
                  onShowNewCategory={onShowNewCategory!}
                />
              );
              break;
            case 'income-category':
              content = (
                <IncomeCategory
                  cat={item.value}
                  editingCell={editingCell}
                  isLast={idx === items.length - 1}
                  onEditName={onEditName}
                  onEditMonth={onEditMonth}
                  onSave={_onSaveCategory}
                  onDelete={onDeleteCategory}
                  onDragChange={onDragChange}
                  onReorder={onReorderCategory}
                  onBudgetAction={onBudgetAction}
                  onShowActivity={onShowActivity}
                />
              );
              break;
            case 'hidden-categories':
              content = (
                <HiddenCategoriesRow
                  hiddenGroups={item.hiddenGroups}
                  categoryGroups={categoryGroups}
                />
              );
              break;
            default:
              // @ts-expect-error Error is expected here because "item.type" is "never"
              throw new Error('Unknown item type: ' + item.type);
          }

          const pos =
            idx === 0 ? 'first' : idx === items.length - 1 ? 'last' : null;

          return (
            <DropHighlightPosContext.Provider
              key={
                'value' in item
                  ? item.value.id
                  : item.type === 'income-separator'
                    ? 'separator'
                    : item.type === 'hidden-categories'
                      ? 'hidden-categories'
                      : idx
              }
              value={pos}
            >
              <View
                style={{
                  ...(isAlternateRow[idx] &&
                    budgetRowColors(theme.budgetRowBackgroundAlternate)),
                  ...(!dragState && {
                    ':hover':
                      item.type === 'expense-category' ||
                      item.type === 'income-category'
                        ? budgetRowColors(theme.budgetRowBackgroundHover)
                        : { backgroundColor: theme.budgetCurrentMonth },
                  }),
                }}
              >
                {content}
              </View>
            </DropHighlightPosContext.Provider>
          );
        })}
        <BudgetGridFiller />
      </View>
    );
  },
);

BudgetCategories.displayName = 'BudgetCategories';

// Rows paint their cells with the budget month colors, so recoloring a row
// means pointing those colors at another token for that row only.
function budgetRowColors(color: string) {
  return {
    '--color-budgetCurrentMonth': color,
    '--color-budgetOtherMonth': color,
  };
}

// Empty month columns below the last row, so the grid runs to the bottom of
// the panel like YNAB 4
function BudgetGridFiller() {
  const [categoryExpandedStatePref] = useGlobalPref('categoryExpandedState');
  const categoryExpandedState = categoryExpandedStatePref ?? 0;

  return (
    <View style={{ flex: 1, minHeight: 20, flexDirection: 'row' }}>
      <View
        style={{
          width: CATEGORY_COLUMN_WIDTH + 100 * categoryExpandedState,
          backgroundColor: theme.budgetCurrentMonth,
        }}
      />
      <RenderMonths style={{ backgroundColor: theme.budgetCurrentMonth }}>
        {null}
      </RenderMonths>
    </View>
  );
}

// Rounded, outlined tops of the category column and each month, like YNAB 4
function BudgetGridTop() {
  const [categoryExpandedStatePref] = useGlobalPref('categoryExpandedState');
  const categoryExpandedState = categoryExpandedStatePref ?? 0;

  return (
    <View style={{ height: 4, flexShrink: 0, flexDirection: 'row' }}>
      <View
        style={{
          width: CATEGORY_COLUMN_WIDTH + 100 * categoryExpandedState,
          backgroundColor: theme.budgetCurrentMonth,
          borderRadius: '4px 4px 0 0',
        }}
      />
      <RenderMonths style={{ boxShadow: 'none' }}>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.budgetCurrentMonth,
            border: '1px solid ' + theme.budgetMonthOutline,
            borderBottomWidth: 0,
            borderRadius: '4px 4px 0 0',
          }}
        />
      </RenderMonths>
    </View>
  );
}
