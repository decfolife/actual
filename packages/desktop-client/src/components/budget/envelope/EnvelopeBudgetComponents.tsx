import React, { memo, useRef, useState } from 'react';
import type { ComponentProps, CSSProperties, MouseEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronDown } from '@actual-app/components/icons/v1';
import {
  SvgArrowsSynchronize,
  SvgCalendar3,
} from '@actual-app/components/icons/v2';
import { Popover } from '@actual-app/components/popover';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import { css } from '@emotion/css';

import { BalanceWithCarryover } from '#components/budget/BalanceWithCarryover';
import {
  BUDGET_ROW_HEIGHT,
  hideZeroAmount,
  withTotalSymbol,
} from '#components/budget/util';
import { NotesButton } from '#components/NotesButton';
import { CellValue, CellValueText } from '#components/spreadsheet/CellValue';
import { Field, Row, SheetCell } from '#components/table';
import type { SheetCellProps } from '#components/table';
import { useCategoryScheduleGoalTemplateIndicator } from '#hooks/useCategoryScheduleGoalTemplateIndicator';
import { useFormat } from '#hooks/useFormat';
import type { FormatType } from '#hooks/useFormat';
import { useNavigate } from '#hooks/useNavigate';
import { useSheetName } from '#hooks/useSheetName';
import { useSheetValue } from '#hooks/useSheetValue';
import { useUndo } from '#hooks/useUndo';
import type { Binding, SheetFields } from '#spreadsheet';
import { envelopeBudget } from '#spreadsheet/bindings';
import type { CategoryGroupMonthProps, CategoryMonthProps } from '..';

import { BalanceMovementMenu } from './BalanceMovementMenu';
import { BudgetMenu } from './BudgetMenu';
import { IncomeMenu } from './IncomeMenu';
import { QuickBudgetMenu } from './QuickBudgetMenu';

export function useEnvelopeSheetName<
  FieldName extends SheetFields<'envelope-budget'>,
>(binding: Binding<'envelope-budget', FieldName>) {
  return useSheetName(binding);
}

export function useEnvelopeSheetValue<
  FieldName extends SheetFields<'envelope-budget'>,
>(binding: Binding<'envelope-budget', FieldName>) {
  return useSheetValue(binding);
}

export const EnvelopeCellValue = <
  FieldName extends SheetFields<'envelope-budget'>,
>(
  props: ComponentProps<typeof CellValue<'envelope-budget', FieldName>>,
) => {
  return <CellValue {...props} />;
};

const EnvelopeSheetCell = <FieldName extends SheetFields<'envelope-budget'>>(
  props: SheetCellProps<'envelope-budget', FieldName>,
) => {
  return <SheetCell {...props} />;
};

// The amount being edited: highlighted like YNAB 4, with the cell's own
// outline instead of the focus ring
const budgetInputClassName = css({
  '&[data-focused]': {
    border: '1px solid ' + theme.budgetCellBorder,
    boxShadow: 'none',
  },
  '::selection': {
    backgroundColor: theme.budgetCellSelection,
  },
});

const headerLabelStyle: CSSProperties = {
  flex: 1,
  padding: '0 6px',
  textAlign: 'right',
};

const headerSeparatorStyle: CSSProperties = {
  borderLeft: '1px dotted ' + theme.budgetTotalsSeparator,
};

const cellStyle: CSSProperties = {
  color: theme.budgetTotalsText,
  fontSize: 14,
  fontWeight: 600,
};

export const BudgetTotalsMonth = memo(function BudgetTotalsMonth() {
  const format = useFormat();
  const totalFormatter = (value: unknown, type?: FormatType) =>
    withTotalSymbol(format(value, type), format.currency);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        paddingTop: 1,
        paddingBottom: 1,
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1.15,
        backgroundColor: theme.budgetTotalsBackground,
        border: '1px solid ' + theme.budgetTotalsBorder,
        borderRadius: 5,
        marginBottom: 3,
      }}
    >
      <View style={headerLabelStyle}>
        <Text style={{ color: theme.budgetTotalsText }}>
          <Trans>Budgeted</Trans>
        </Text>
        <EnvelopeCellValue
          binding={envelopeBudget.totalBudgeted}
          type="financial"
        >
          {props => (
            <CellValueText
              {...props}
              value={-props.value || 0}
              style={cellStyle}
              formatter={totalFormatter}
            />
          )}
        </EnvelopeCellValue>
      </View>
      <View style={{ ...headerLabelStyle, ...headerSeparatorStyle }}>
        <Text style={{ color: theme.budgetTotalsText }}>
          <Trans>Outflows</Trans>
        </Text>
        <EnvelopeCellValue binding={envelopeBudget.totalSpent} type="financial">
          {props => (
            <CellValueText
              {...props}
              style={cellStyle}
              formatter={totalFormatter}
            />
          )}
        </EnvelopeCellValue>
      </View>
      <View style={{ ...headerLabelStyle, ...headerSeparatorStyle }}>
        <Text style={{ color: theme.budgetTotalsText }}>
          <Trans>Balance</Trans>
        </Text>
        <EnvelopeCellValue
          binding={envelopeBudget.totalBalance}
          type="financial"
        >
          {props => (
            <CellValueText
              {...props}
              style={cellStyle}
              formatter={totalFormatter}
            />
          )}
        </EnvelopeCellValue>
      </View>
    </View>
  );
});

export function IncomeHeaderMonth() {
  return (
    <Row
      height={BUDGET_ROW_HEIGHT}
      style={{
        color: theme.tableHeaderText,
        alignItems: 'center',
        paddingRight: 10,
        backgroundColor: theme.budgetCurrentMonth,
      }}
    >
      <View style={{ flex: 1, textAlign: 'right' }}>
        <Trans>Received</Trans>
      </View>
    </Row>
  );
}

export const ExpenseGroupMonth = memo(function ExpenseGroupMonth({
  month,
  group,
}: CategoryGroupMonthProps) {
  const { id } = group;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: monthUtils.isCurrentMonth(month)
          ? theme.budgetHeaderCurrentMonth
          : theme.budgetHeaderOtherMonth,
      }}
    >
      <EnvelopeSheetCell
        name="budgeted"
        width="flex"
        textAlign="right"
        style={{ fontWeight: 600, ...styles.tnum }}
        valueProps={{
          binding: envelopeBudget.groupBudgeted(id),
          type: 'financial',
        }}
      />
      <EnvelopeSheetCell
        name="spent"
        width="flex"
        textAlign="right"
        style={{ fontWeight: 600, ...styles.tnum }}
        valueProps={{
          binding: envelopeBudget.groupSumAmount(id),
          type: 'financial',
        }}
      />
      <EnvelopeSheetCell
        name="balance"
        width="flex"
        textAlign="right"
        style={{
          fontWeight: 600,
          paddingRight: styles.monthRightPadding,
          ...styles.tnum,
        }}
        valueProps={{
          binding: envelopeBudget.groupBalance(id),
          type: 'financial',
        }}
      />
    </View>
  );
});

export const ExpenseCategoryMonth = memo(function ExpenseCategoryMonth({
  month,
  category,
  editing,
  onEdit,
  onBudgetAction,
  onShowActivity,
}: CategoryMonthProps) {
  const { t } = useTranslation();
  const format = useFormat();

  const budgetMenuTriggerRef = useRef(null);
  const balanceMenuTriggerRef = useRef(null);
  const quickMenuTriggerRef = useRef(null);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [budgetMenuOpen, setBudgetMenuOpen] = useState(false);
  const [budgetPosition, setBudgetPosition] = useState({
    crossOffset: 0,
    offset: 0,
  });

  const handleBudgetContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setBudgetPosition({
      crossOffset: e.clientX - rect.left,
      offset: e.clientY - rect.bottom,
    });
    setBudgetMenuOpen(true);
  };

  const [balanceMenuOpen, setBalanceMenuOpen] = useState(false);
  const [balancePosition, setBalancePosition] = useState({
    crossOffset: 0,
    offset: 0,
  });
  const resetBalancePosition = (crossOffset = 0, offset = 0) =>
    setBalancePosition({ crossOffset, offset });

  const handleBalanceContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setBalancePosition({
      crossOffset: e.clientX - rect.left,
      offset: e.clientY - rect.bottom,
    });
    setBalanceMenuOpen(true);
  };

  const onMenuAction = (...args: Parameters<typeof onBudgetAction>) => {
    onBudgetAction(...args);
    setBudgetMenuOpen(false);
  };

  const { showUndoNotification } = useUndo();

  const navigate = useNavigate();

  const { schedule, scheduleStatus, isScheduleRecurring, description } =
    useCategoryScheduleGoalTemplateIndicator({
      category,
      month,
    });

  const showScheduleIndicator = schedule && scheduleStatus;

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: monthUtils.isCurrentMonth(month)
          ? theme.budgetCurrentMonth
          : theme.budgetOtherMonth,
        '& .hover-visible': {
          opacity: 0,
          transition: 'opacity .25s',
        },
        '&:hover .hover-visible, & .force-visible .hover-visible': {
          opacity: 1,
        },
        '& .hover-expand': {
          maxWidth: 0,
          overflow: 'hidden',
          transition: 'max-width 0s .25s',
        },
        '&:hover .hover-expand, & .hover-expand.force-visible': {
          maxWidth: '300px',
          overflow: 'visible',
          transition: 'max-width 0s linear 0s',
        },
      }}
    >
      <View
        ref={budgetMenuTriggerRef}
        style={{
          flex: 1,
          flexDirection: 'row',
          position: 'relative',
        }}
        onContextMenu={e => {
          if (editing) return;
          handleBudgetContextMenu(e);
        }}
      >
        {!editing && (
          // Overlaid on the left of the budget cell so showing the menu
          // button on hover never squeezes the amount
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              flexDirection: 'row',
              zIndex: 1,
            }}
          >
            <View
              style={{
                paddingLeft: 3,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NotesButton
                id={`${category.id}-${month}`}
                defaultColor={theme.pageTextLight}
              />
            </View>
            <View
              className={`hover-expand ${budgetMenuOpen ? 'force-visible' : ''}`}
              style={{
                flexDirection: 'row',
                flexShrink: 1,
                paddingLeft: 3,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Popover
                triggerRef={budgetMenuTriggerRef}
                placement="bottom left"
                isOpen={budgetMenuOpen}
                onOpenChange={() => setBudgetMenuOpen(false)}
                style={{ width: 200 }}
                isNonModal
                {...budgetPosition}
              >
                <BudgetMenu
                  onCopyLastMonthAverage={() => {
                    onMenuAction(month, 'copy-single-last', {
                      category: category.id,
                    });
                    showUndoNotification({
                      message: t(`Budget set to last month's budget.`),
                    });
                  }}
                  onSetMonthsAverage={numberOfMonths => {
                    if (
                      numberOfMonths !== 3 &&
                      numberOfMonths !== 6 &&
                      numberOfMonths !== 12
                    ) {
                      return;
                    }

                    onMenuAction(month, `set-single-${numberOfMonths}-avg`, {
                      category: category.id,
                    });
                    showUndoNotification({
                      message: t(
                        'Budget set to {{numberOfMonths}}-month average.',
                        { numberOfMonths },
                      ),
                    });
                  }}
                  onApplyBudgetTemplate={() => {
                    onMenuAction(month, 'apply-single-category-template', {
                      category: category.id,
                    });
                    showUndoNotification({
                      message: t(`Budget template applied.`),
                    });
                  }}
                />
              </Popover>
            </View>
          </View>
        )}
        <EnvelopeSheetCell
          name="budget"
          exposed={editing}
          focused={editing}
          width="flex"
          onExpose={() => onEdit(category.id, month)}
          // Like YNAB 4, the budget column is a plain grid of solid lines
          style={{
            ...(editing && { zIndex: 100 }),
            ...styles.tnum,
            borderColor: theme.budgetCellBorder,
            borderStyle: 'solid',
            borderRightWidth: 1,
          }}
          textAlign="right"
          valueStyle={{
            cursor: 'default',
            padding: '0 4px',
          }}
          valueProps={{
            binding: envelopeBudget.catBudgeted(category.id),
            type: 'financial',
            getValueStyle: hideZeroAmount,
            formatExpr: format.forEdit,
            unformatExpr: format.fromEdit,
          }}
          inputProps={{
            onBlur: () => {
              onEdit(null);
            },
            // Like YNAB 4, select the amount so typing replaces it
            onFocus: e => e.currentTarget.select(),
            className: budgetInputClassName,
            style: {
              backgroundColor: theme.budgetCurrentMonth,
            },
          }}
          onSave={(parsedIntegerAmount: number | null) => {
            onBudgetAction(month, 'budget-amount', {
              category: category.id,
              amount: parsedIntegerAmount ?? 0,
            });
          }}
        />
        {(editing || quickMenuOpen) && (
          <Button
            ref={quickMenuTriggerRef}
            variant="bare"
            aria-label={t('Budget suggestions')}
            // Keep focus in the amount so it isn't saved and closed first
            onMouseDown={e => e.preventDefault()}
            onPress={() => setQuickMenuOpen(true)}
            style={{
              position: 'absolute',
              right: -18,
              top: 3,
              width: 16,
              height: 16,
              padding: 0,
              zIndex: 101,
              borderRadius: 2,
              border: '1px solid ' + theme.budgetMonthOutline,
              backgroundColor: theme.budgetCurrentMonth,
              color: theme.pageText,
            }}
          >
            <SvgCheveronDown width={12} height={12} />
          </Button>
        )}
        <Popover
          triggerRef={quickMenuTriggerRef}
          placement="bottom end"
          isOpen={quickMenuOpen}
          onOpenChange={() => setQuickMenuOpen(false)}
          style={{ margin: 1 }}
        >
          <QuickBudgetMenu
            categoryId={category.id}
            month={month}
            onSelect={amount => {
              onBudgetAction(month, 'budget-amount', {
                category: category.id,
                amount,
              });
              setQuickMenuOpen(false);
              onEdit(null);
            }}
          />
        </Popover>
      </View>
      <Field name="spent" width="flex" style={{ textAlign: 'right' }}>
        <View
          data-testid="category-month-spent"
          onClick={() => onShowActivity(category.id, month)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: showScheduleIndicator
              ? 'space-between'
              : 'flex-end',
            gap: 2,
          }}
        >
          {showScheduleIndicator && (
            <View title={description}>
              <Button
                variant="bare"
                style={{
                  color:
                    scheduleStatus === 'missed'
                      ? theme.budgetNumberNegative
                      : scheduleStatus === 'due'
                        ? theme.templateNumberUnderFunded
                        : theme.upcomingText,
                }}
                onPress={() =>
                  schedule._account
                    ? navigate(`/accounts/${schedule._account}`)
                    : navigate('/accounts')
                }
              >
                {isScheduleRecurring ? (
                  <SvgArrowsSynchronize style={{ width: 12, height: 12 }} />
                ) : (
                  <SvgCalendar3 style={{ width: 12, height: 12 }} />
                )}
              </Button>
            </View>
          )}
          <EnvelopeCellValue
            binding={envelopeBudget.catSumAmount(category.id)}
            type="financial"
          >
            {props => (
              <CellValueText
                {...props}
                className={css({
                  cursor: 'pointer',
                  ':hover': { textDecoration: 'underline' },
                  ...hideZeroAmount(props.value),
                })}
              />
            )}
          </EnvelopeCellValue>
        </View>
      </Field>
      <Field
        ref={balanceMenuTriggerRef}
        name="balance"
        width="flex"
        style={{ paddingRight: styles.monthRightPadding, textAlign: 'right' }}
      >
        <Button
          variant="bare"
          onPress={() => {
            resetBalancePosition(-6, -4);
            setBalanceMenuOpen(true);
          }}
          onContextMenu={e => {
            handleBalanceContextMenu(e);
            // We need to calculate differently from the hook due to being aligned to the right
            const rect = e.currentTarget.getBoundingClientRect();
            resetBalancePosition(
              e.clientX - rect.right + 200 - 8,
              e.clientY - rect.bottom - 8,
            );
          }}
          style={{
            justifyContent: 'flex-end',
            background: 'transparent',
            width: '100%',
            padding: 0,
          }}
        >
          <BalanceWithCarryover
            carryover={envelopeBudget.catCarryover(category.id)}
            balance={envelopeBudget.catBalance(category.id)}
            goal={envelopeBudget.catGoal(category.id)}
            budgeted={envelopeBudget.catBudgeted(category.id)}
            longGoal={envelopeBudget.catLongGoal(category.id)}
          />
        </Button>

        <Popover
          triggerRef={balanceMenuTriggerRef}
          placement="bottom end"
          isOpen={balanceMenuOpen}
          onOpenChange={() => setBalanceMenuOpen(false)}
          style={{
            margin: 1,
            minWidth: 190,
          }}
          isNonModal
          {...balancePosition}
        >
          <BalanceMovementMenu
            categoryId={category.id}
            month={month}
            onBudgetAction={onBudgetAction}
            onClose={() => setBalanceMenuOpen(false)}
          />
        </Popover>
      </Field>
    </View>
  );
});

type IncomeGroupMonthProps = {
  month: string;
};
export function IncomeGroupMonth({ month }: IncomeGroupMonthProps) {
  return (
    <View style={{ flex: 1 }}>
      <EnvelopeSheetCell
        name="received"
        width="flex"
        textAlign="right"
        style={{
          fontWeight: 600,
          paddingRight: styles.monthRightPadding,
          ...styles.tnum,
          backgroundColor: monthUtils.isCurrentMonth(month)
            ? theme.budgetHeaderCurrentMonth
            : theme.budgetHeaderOtherMonth,
        }}
        valueProps={{
          binding: envelopeBudget.groupIncomeReceived,
          type: 'financial',
        }}
      />
    </View>
  );
}

export function IncomeCategoryMonth({
  category,
  isLast,
  month,
  onShowActivity,
  onBudgetAction,
}: CategoryMonthProps) {
  const incomeMenuTriggerRef = useRef(null);
  const [incomeMenuOpen, setIncomeMenuOpen] = useState(false);
  const [incomePosition, setIncomePosition] = useState({
    crossOffset: 0,
    offset: 0,
  });
  const resetIncomePosition = (crossOffset = 0, offset = 0) =>
    setIncomePosition({ crossOffset, offset });

  const handleIncomeContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setIncomePosition({
      crossOffset: e.clientX - rect.left,
      offset: e.clientY - rect.bottom,
    });
    setIncomeMenuOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Field
        name="received"
        width="flex"
        truncate={false}
        ref={incomeMenuTriggerRef}
        style={{
          textAlign: 'right',
          ...(isLast && { borderBottomWidth: 0 }),
          backgroundColor: monthUtils.isCurrentMonth(month)
            ? theme.budgetCurrentMonth
            : theme.budgetOtherMonth,
        }}
      >
        <View
          name="received"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            position: 'relative',
          }}
        >
          <Button
            variant="bare"
            onPress={() => {
              resetIncomePosition(-6, -4);
              setIncomeMenuOpen(true);
            }}
            onContextMenu={e => {
              handleIncomeContextMenu(e);
              // We need to calculate differently from the hook due to being aligned to the right
              const rect = e.currentTarget.getBoundingClientRect();
              resetIncomePosition(
                e.clientX - rect.right + 200 - 8,
                e.clientY - rect.bottom - 8,
              );
            }}
            style={{
              background: 'transparent',
              padding: 0,
              paddingRight: styles.monthRightPadding,
            }}
          >
            <BalanceWithCarryover
              isIncome
              carryover={envelopeBudget.catCarryover(category.id)}
              balance={envelopeBudget.catSumAmount(category.id)}
              goal={envelopeBudget.catGoal(category.id)}
              budgeted={envelopeBudget.catBudgeted(category.id)}
              longGoal={envelopeBudget.catLongGoal(category.id)}
            />
          </Button>
          <Popover
            triggerRef={incomeMenuTriggerRef}
            placement="bottom end"
            isOpen={incomeMenuOpen}
            onOpenChange={() => setIncomeMenuOpen(false)}
            style={{ margin: 1 }}
            isNonModal
            {...incomePosition}
          >
            <IncomeMenu
              categoryId={category.id}
              month={month}
              onBudgetAction={onBudgetAction}
              onShowActivity={onShowActivity}
              onClose={() => setIncomeMenuOpen(false)}
            />
          </Popover>
        </View>
      </Field>
    </View>
  );
}

export { BudgetSummary } from './budgetsummary/BudgetSummary';
