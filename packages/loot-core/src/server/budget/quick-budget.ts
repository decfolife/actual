import { aqlQuery } from '#server/aql';
import * as monthUtils from '#shared/months';
import { q } from '#shared/query';
import {
  extractScheduleConds,
  getOccurrencesBetween,
  getScheduledAmount,
} from '#shared/schedules';

import { getCategoryAverage, getSheetValue } from './actions';

export type QuickBudgetValues = {
  budgetedLastMonth: number;
  outflowsLastMonth: number;
  averageOutflows3Months: number;
  averageOutflows12Months: number;
  scheduledOutflowsThisMonth: number;
  balanceToZero: number;
};

type ScheduleRow = {
  _conditions: Array<{ op: string; field: string; value: unknown }> | null;
  _actions: Array<{
    op: string;
    field?: string;
    value?: unknown;
    options?: { splitIndex?: number };
  }> | null;
  _amount: number | { num1: number; num2: number } | null;
};

/**
 * The amounts YNAB 4 offered when budgeting a category: last month's budget
 * and outflows, average outflows, this month's scheduled outflows, and the
 * budget that would bring the balance to zero. Outflows are positive numbers.
 */
export async function getQuickBudgetValues({
  month,
  category,
}: {
  month: string;
  category: string;
}): Promise<QuickBudgetValues> {
  const sheetName = monthUtils.sheetForMonth(month);
  const prevSheetName = monthUtils.sheetForMonth(monthUtils.prevMonth(month));

  const budgetedLastMonth = await getSheetValue(
    prevSheetName,
    'budget-' + category,
  );
  const spentLastMonth = await getSheetValue(
    prevSheetName,
    'sum-amount-' + category,
  );
  const average3 = await getCategoryAverage({
    month,
    maxMonths: 3,
    categoryId: category,
  });
  const average12 = await getCategoryAverage({
    month,
    maxMonths: 12,
    categoryId: category,
  });
  const budgeted = await getSheetValue(sheetName, 'budget-' + category);
  const balance = await getSheetValue(sheetName, 'leftover-' + category);

  return {
    budgetedLastMonth,
    outflowsLastMonth: toOutflow(spentLastMonth),
    averageOutflows3Months: toOutflow(average3),
    averageOutflows12Months: toOutflow(average12),
    scheduledOutflowsThisMonth: await getScheduledOutflows(month, category),
    balanceToZero: budgeted - balance,
  };
}

async function getScheduledOutflows(
  month: string,
  category: string,
): Promise<number> {
  const { data } = await aqlQuery(
    q('schedules')
      .filter({ completed: false })
      .select(['_conditions', '_actions', '_amount']),
  );
  const schedules = data as ScheduleRow[];

  const start = monthUtils.firstDayOfMonth(month);
  const end = monthUtils.firstDayOfMonth(monthUtils.nextMonth(month));

  let total = 0;
  for (const schedule of schedules) {
    const setsCategory = (schedule._actions ?? []).some(
      action =>
        action.op === 'set' &&
        action.field === 'category' &&
        action.value === category &&
        action.options?.splitIndex == null,
    );
    if (!setsCategory || schedule._amount == null) {
      continue;
    }

    const { date } = extractScheduleConds(schedule._conditions ?? []);
    if (!date) {
      continue;
    }

    const occurrences = getOccurrencesBetween(date, start, end).length;
    total += getScheduledAmount(schedule._amount) * occurrences;
  }

  return toOutflow(total);
}

// Spending is stored as negative amounts; outflows are shown positive
function toOutflow(amount: number): number {
  return amount === 0 ? 0 : -amount;
}
