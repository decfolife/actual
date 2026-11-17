import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { Input } from '@actual-app/components/input';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { evalArithmetic } from '@actual-app/core/shared/arithmetic';
import { amountToInteger, integerToAmount } from '@actual-app/core/shared/util';

type BudgetCalculatorProps = {
  initialAmount: number;
  onApply: (amount: number) => void;
  onCancel: () => void;
};

const KEYS = [
  ['7', '8', '9', '/'],
  ['4', '5', '6', '*'],
  ['1', '2', '3', '-'],
  ['0', '.', '=', '+'],
] as const;

/**
 * YNAB 4's budget calculator: work out an amount with a keypad (or by
 * typing), then use the result as the category's budget.
 */
export function BudgetCalculator({
  initialAmount,
  onApply,
  onCancel,
}: BudgetCalculatorProps) {
  const { t } = useTranslation();
  const [expression, setExpression] = useState(() =>
    initialAmount === 0 ? '' : String(integerToAmount(initialAmount)),
  );

  const result = evalArithmetic(expression, null);

  function press(key: string) {
    if (key === '=') {
      if (result != null) {
        setExpression(String(Math.round(result * 100) / 100));
      }
      return;
    }
    setExpression(current => current + key);
  }

  function apply() {
    if (result != null) {
      onApply(amountToInteger(result));
    }
  }

  return (
    <View style={{ padding: 8, width: 220, gap: 6 }}>
      <InitialFocus>
        <Input
          aria-label={t('Calculator')}
          value={expression}
          onChangeValue={setExpression}
          onEnter={apply}
          onEscape={onCancel}
          style={{ textAlign: 'right', fontSize: 15 }}
        />
      </InitialFocus>
      <View
        style={{
          textAlign: 'right',
          fontSize: 13,
          color: theme.pageTextSubdued,
          minHeight: 17,
        }}
      >
        {result == null ? '' : `= ${Math.round(result * 100) / 100}`}
      </View>
      {KEYS.map(row => (
        <View key={row.join('')} style={{ flexDirection: 'row', gap: 4 }}>
          {row.map(key => (
            <Button
              key={key}
              onPress={() => press(key)}
              style={{ flex: 1, padding: '6px 0', fontSize: 15 }}
            >
              {key === '*' ? '×' : key === '/' ? '÷' : key}
            </Button>
          ))}
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Button
          onPress={() => setExpression('')}
          style={{ flex: 1, padding: '6px 0' }}
        >
          <Trans>Clear</Trans>
        </Button>
        <Button
          onPress={() => setExpression(current => current.slice(0, -1))}
          aria-label={t('Delete last character')}
          style={{ flex: 1, padding: '6px 0' }}
        >
          ⌫
        </Button>
        <Button
          variant="primary"
          isDisabled={result == null}
          onPress={apply}
          style={{ flex: 2, padding: '6px 0' }}
        >
          <Trans>Use</Trans>
        </Button>
      </View>
    </View>
  );
}
