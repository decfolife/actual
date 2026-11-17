import React, { memo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import {
  SvgBolt,
  SvgDotsHorizontalTriple,
} from '@actual-app/components/icons/v1';
import {
  SvgArrowButtonDown1,
  SvgArrowButtonUp1,
} from '@actual-app/components/icons/v2';
import { Popover } from '@actual-app/components/popover';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import { css } from '@emotion/css';

import { useEnvelopeBudget } from '#components/budget/envelope/EnvelopeBudgetContext';
import { NotesButton } from '#components/NotesButton';
import { useLocale } from '#hooks/useLocale';
import { SheetNameProvider } from '#hooks/useSheetName';
import { useUndo } from '#hooks/useUndo';

import { BudgetMonthMenu } from './BudgetMonthMenu';
import { ToBudget } from './ToBudget';
import { TotalsList } from './TotalsList';

// Lines between the month, the amount and the icons on a collapsed card
const cardDivider = '1px solid var(--budget-card-divider, transparent)';

type BudgetSummaryProps = {
  month: string;
};
export const BudgetSummary = memo(({ month }: BudgetSummaryProps) => {
  const locale = useLocale();
  const {
    currentMonth,
    summaryCollapsed: collapsed,
    onBudgetAction,
    onToggleSummaryCollapse,
  } = useEnvelopeBudget();

  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef(null);
  const { showUndoNotification } = useUndo();

  function onMenuOpen() {
    setMenuOpen(true);
  }

  function onMenuClose() {
    setMenuOpen(false);
  }

  const prevMonthName = monthUtils.format(
    monthUtils.prevMonth(month),
    'MMM',
    locale,
  );

  const ExpandOrCollapseIcon = collapsed
    ? SvgArrowButtonDown1
    : SvgArrowButtonUp1;

  const displayMonth = monthUtils.format(month, "MMMM ''yy", locale);
  const { t } = useTranslation();

  const toggleButton = (
    <Button
      variant="bare"
      aria-label={
        collapsed ? t('Expand month summary') : t('Collapse month summary')
      }
      className="hover-visible"
      onPress={onToggleSummaryCollapse}
    >
      <ExpandOrCollapseIcon
        width={collapsed ? 10 : 13}
        height={collapsed ? 10 : 13}
        // The margin is to make it the exact same size as the dots button
        style={{ color: theme.budgetSummaryText, margin: 1 }}
      />
    </Button>
  );

  const iconSize = collapsed ? 12 : 15;

  const notesButton = (
    <NotesButton
      id={`budget-${month}`}
      width={iconSize}
      height={iconSize}
      tooltipPosition="bottom right"
      defaultColor={theme.budgetSummaryText}
    />
  );

  const menuButton = (
    <>
      <Button
        ref={triggerRef}
        variant="bare"
        aria-label={t('Menu')}
        onPress={onMenuOpen}
        style={collapsed ? { padding: 1 } : undefined}
      >
        {collapsed ? (
          <SvgBolt
            width={iconSize}
            height={iconSize}
            style={{ color: theme.budgetSummaryText }}
          />
        ) : (
          <SvgDotsHorizontalTriple
            width={iconSize}
            height={iconSize}
            style={{ color: theme.budgetSummaryText }}
          />
        )}
      </Button>

      <Popover
        triggerRef={triggerRef}
        isOpen={menuOpen}
        onOpenChange={onMenuClose}
      >
        <BudgetMonthMenu
          onCopyLastMonthBudget={() => {
            onBudgetAction(month, 'copy-last');
            onMenuClose();
            showUndoNotification({
              message: t(
                "{{displayMonth}} budgets have all been set to last month's budgeted amounts.",
                { displayMonth },
              ),
            });
          }}
          onSetBudgetsToZero={() => {
            onBudgetAction(month, 'set-zero');
            onMenuClose();
            showUndoNotification({
              message: t(
                '{{displayMonth}} budgets have all been set to zero.',
                { displayMonth },
              ),
            });
          }}
          onSetMonthsAverage={numberOfMonths => {
            onBudgetAction(month, `set-${numberOfMonths}-avg`);
            onMenuClose();
            showUndoNotification({
              message:
                numberOfMonths === 12
                  ? t(
                      `${displayMonth} budgets have all been set to yearly average.`,
                    )
                  : t(
                      `${displayMonth} budgets have all been set to ${numberOfMonths} month average.`,
                    ),
            });
          }}
          onCheckTemplates={() => {
            onBudgetAction(month, 'check-templates');
            onMenuClose();
          }}
          onApplyBudgetTemplates={() => {
            onBudgetAction(month, 'apply-goal-template');
            onMenuClose();
            showUndoNotification({
              message: t(
                '{{displayMonth}} budget templates have been applied.',
                { displayMonth },
              ),
            });
          }}
          onOverwriteWithBudgetTemplates={() => {
            onBudgetAction(month, 'overwrite-goal-template');
            onMenuClose();
            showUndoNotification({
              message: t(
                '{{displayMonth}} budget templates have been overwritten.',
                { displayMonth },
              ),
            });
          }}
          onEndOfMonthCleanup={() => {
            onBudgetAction(month, 'cleanup-goal-template');
            onMenuClose();
            showUndoNotification({
              message: t(
                '{{displayMonth}} end-of-month cleanup templates have been applied.',
                { displayMonth },
              ),
            });
          }}
        />
      </Popover>
    </>
  );

  return (
    <View
      data-testid="budget-summary"
      data-month={month}
      style={{
        position: 'relative',
        backgroundColor:
          month === currentMonth
            ? theme.budgetSummaryCurrentMonth
            : theme.budgetSummaryOtherMonth,
        color: theme.budgetSummaryText,
        backgroundImage: 'var(--budget-card-gradient, none)',
        border: '1px solid var(--budget-card-edge, transparent)',
        boxShadow: styles.cardShadow,
        borderRadius: collapsed ? 4 : 6,
        marginLeft: 0,
        marginRight: 0,
        marginTop: collapsed ? 4 : 5,
        marginBottom: collapsed ? 4 : 5,
        flex: 1,
        cursor: 'default',
        overflow: 'hidden',
        '& .hover-visible': {
          opacity: 0,
          transition: 'opacity .25s',
        },
        '&:hover .hover-visible': {
          opacity: 1,
        },
      }}
    >
      <SheetNameProvider name={monthUtils.sheetForMonth(month)}>
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
        {collapsed ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'stretch',
              minHeight: 54,
            }}
          >
            <View style={{ position: 'absolute', left: 0, bottom: 0 }}>
              {toggleButton}
            </View>
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '0 10px',
                minWidth: 64,
                borderRight: cardDivider,
              }}
            >
              <div
                className={css({
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1,
                })}
              >
                {monthUtils.format(month, 'MMM', locale).toUpperCase()}
              </div>
              <div
                className={css({
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.3,
                })}
              >
                {monthUtils.format(month, 'yyyy', locale)}
              </div>
            </View>
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ToBudget
                prevMonthName={prevMonthName}
                month={month}
                onBudgetAction={onBudgetAction}
                isCollapsed
                labelPosition="below"
                amountStyle={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}
              />
            </View>
            <View
              style={{
                width: 24,
                padding: '3px 0',
                justifyContent: 'space-between',
                alignItems: 'center',
                userSelect: 'none',
                borderLeft: cardDivider,
              }}
            >
              <View>{notesButton}</View>
              <View>{menuButton}</View>
            </View>
          </View>
        ) : (
          <>
            <View style={{ padding: '0 13px', marginTop: 16 }}>
              <View style={{ position: 'absolute', left: 10, top: 0 }}>
                {toggleButton}
              </View>

              <div
                className={css([
                  {
                    textAlign: 'center',
                    marginTop: 3,
                    fontSize: 18,
                    fontWeight: 500,
                    textDecorationSkip: 'ink',
                  },
                  currentMonth === month && { fontWeight: 'bold' },
                ])}
              >
                {monthUtils.format(month, 'MMMM', locale)}
              </div>

              <View
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View>{notesButton}</View>
                <View style={{ userSelect: 'none', marginLeft: 2 }}>
                  {menuButton}
                </View>
              </View>
            </View>
            <TotalsList
              prevMonthName={prevMonthName}
              style={{
                padding: '5px 0',
                marginTop: 17,
                backgroundColor: theme.budgetHeaderCurrentMonth,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: theme.tableBorder,
              }}
            />
            <View style={{ margin: '23px 0' }}>
              <ToBudget
                prevMonthName={prevMonthName}
                month={month}
                onBudgetAction={onBudgetAction}
              />
            </View>
          </>
        )}
      </SheetNameProvider>
    </View>
  );
});

BudgetSummary.displayName = 'EnvelopeBudgetSummary';
