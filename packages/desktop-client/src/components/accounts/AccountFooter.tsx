import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCalendar3 } from '@actual-app/components/icons/v2';
import { Popover } from '@actual-app/components/popover';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { Query } from '@actual-app/core/shared/query';
import type { AccountEntity } from '@actual-app/core/types/models';

import { withTotalSymbol } from '#components/budget/util';
import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { useFormat } from '#hooks/useFormat';
import { useNavigate } from '#hooks/useNavigate';
import { useSelectedItems } from '#hooks/useSelected';
import { useSheetValue } from '#hooks/useSheetValue';

import { useSelectedTotal } from './Balance';
import { ReconcileMenu } from './Reconcile';

type AccountFooterProps = {
  account?: AccountEntity;
  balanceQuery: { name: `balance-query-${string}`; query: Query };
  // Shown as the search total while searching or filtering
  filteredAmount?: number | null;
  filteredCount: number | null;
  onReconcile: (amount: number | null) => void;
};

/**
 * The bar at the bottom of a YNAB 4 register: scheduled transactions on the
 * left, then the balances and the Reconcile Account button.
 */
export function AccountFooter({
  account,
  balanceQuery,
  filteredAmount,
  filteredCount,
  onReconcile,
}: AccountFooterProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reconcileRef = useRef<HTMLButtonElement>(null);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);

  const selectedItems = useSelectedItems();
  const { total: selectedTotal } = useSelectedTotal(selectedItems, account);
  const working = useSheetValue<'balance', `balance-query-${string}`>({
    name: balanceQuery.name,
    query: balanceQuery.query,
  });
  const cleared = useSheetValue<'balance', `balance-query-${string}-cleared`>({
    name: (balanceQuery.name + '-cleared') as `balance-query-${string}-cleared`,
    query: balanceQuery.query.filter({ cleared: true }),
  });
  const uncleared = useSheetValue<
    'balance',
    `balance-query-${string}-uncleared`
  >({
    name: (balanceQuery.name +
      '-uncleared') as `balance-query-${string}-uncleared`,
    query: balanceQuery.query.filter({ cleared: false }),
  });

  return (
    <View
      style={{
        ...styles.pageContent,
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 10,
        paddingTop: 8,
        paddingBottom: 8,
        flexShrink: 0,
      }}
    >
      <Button
        style={{ padding: '6px 14px', gap: 8 }}
        onPress={() => navigate('/schedules')}
      >
        <SvgCalendar3 style={{ width: 22, height: 22 }} />
        <View style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <Trans>
            Scheduled
            <br />
            Transactions
          </Trans>
        </View>
      </Button>

      <View style={{ flex: 1 }} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: '4px 18px',
          backgroundColor: theme.accountFooterBox,
          border: `1px solid ${theme.tableBorder}`,
          borderRadius: 4,
        }}
      >
        {selectedItems.size > 0 ? (
          // Like YNAB 4: the selected total in place of cleared/uncleared
          <>
            <Total
              label={t('Selected Total ({{count}})', {
                count: selectedItems.size,
              })}
              amount={selectedTotal ?? 0}
            />
            <Divider />
          </>
        ) : (
          <>
            {filteredCount != null && (
              <>
                <Total
                  label={t('Search Total ({{count}})', {
                    count: filteredCount,
                  })}
                  amount={filteredAmount ?? 0}
                />
                <Divider />
              </>
            )}
            <Total label={t('Cleared Balance')} amount={cleared ?? 0} />
            <Operator>+</Operator>
            <Total
              label={t('Uncleared Transactions')}
              amount={uncleared ?? 0}
              isNegativeRed
            />
            <Operator>=</Operator>
          </>
        )}
        <Total label={t('Working Balance')} amount={working ?? 0} />
      </View>

      {account && !account.closed && (
        <>
          <Button
            ref={reconcileRef}
            style={{ padding: '6px 14px', lineHeight: 1.2 }}
            onPress={() => setIsReconcileOpen(true)}
          >
            <Trans>
              Reconcile
              <br />
              Account
            </Trans>
          </Button>
          <Popover
            placement="top end"
            triggerRef={reconcileRef}
            style={{ width: 275 }}
            isOpen={isReconcileOpen}
            onOpenChange={() => setIsReconcileOpen(false)}
          >
            <ReconcileMenu
              account={account}
              onClose={() => setIsReconcileOpen(false)}
              onReconcile={onReconcile}
            />
          </Popover>
        </>
      )}
    </View>
  );
}

type TotalProps = {
  label: string;
  amount: number;
  isNegativeRed?: boolean;
};

function Total({ label, amount, isNegativeRed = false }: TotalProps) {
  const format = useFormat();
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ fontSize: 13, color: theme.pageTextLight }}>{label}</View>
      <PrivacyFilter>
        <FinancialText
          style={{
            fontSize: 16,
            fontWeight: 700,
            color:
              isNegativeRed && amount < 0
                ? theme.errorText
                : theme.pageTextDark,
          }}
        >
          {withTotalSymbol(format(amount, 'financial'), format.currency)}
        </FinancialText>
      </PrivacyFilter>
    </View>
  );
}

function Operator({ children }: { children: ReactNode }) {
  return (
    <View style={{ fontSize: 20, fontWeight: 700, color: theme.pageTextLight }}>
      {children}
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        alignSelf: 'stretch',
        width: 1,
        backgroundColor: theme.tableBorder,
      }}
    />
  );
}
