import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AlignedText } from '@actual-app/components/aligned-text';
import { Button } from '@actual-app/components/button';
import {
  SvgCheveronDown,
  SvgCheveronRight,
} from '@actual-app/components/icons/v1';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { AccountEntity } from '@actual-app/core/types/models';

import { useMoveAccountMutation } from '#accounts';
import { isAccountFailedSync } from '#accounts/syncStatus';
import { withTotalSymbol } from '#components/budget/util';
import { CellValue, CellValueText } from '#components/spreadsheet/CellValue';
import { useAccounts } from '#hooks/useAccounts';
import { useClosedAccounts } from '#hooks/useClosedAccounts';
import { useFormat } from '#hooks/useFormat';
import { useLocalPref } from '#hooks/useLocalPref';
import { useOffBudgetAccounts } from '#hooks/useOffBudgetAccounts';
import { useOnBudgetAccounts } from '#hooks/useOnBudgetAccounts';
import { useUpdatedAccounts } from '#hooks/useUpdatedAccounts';
import { useSelector } from '#redux';
import * as bindings from '#spreadsheet/bindings';

import { Account, accountNameStyle } from './Account';

const fontWeight = 600;

export function Accounts() {
  const { t } = useTranslation();
  const format = useFormat();
  const [isDragging, setIsDragging] = useState(false);
  const { data: accounts = [] } = useAccounts();
  const updatedAccounts = useUpdatedAccounts();
  const { data: offbudgetAccounts = [] } = useOffBudgetAccounts();
  const { data: onBudgetAccounts = [] } = useOnBudgetAccounts();
  const { data: closedAccounts = [] } = useClosedAccounts();
  const syncingAccountIds = useSelector(state => state.account.accountsSyncing);

  const getAccountPath = (account: AccountEntity) => `/accounts/${account.id}`;

  const [showClosedAccounts, setShowClosedAccountsPref] = useLocalPref(
    'ui.showClosedAccounts',
  );

  function onDragChange(drag: { state: string }) {
    setIsDragging(drag.state === 'start');
  }

  const moveAccount = useMoveAccountMutation();

  const makeDropPadding = (i: number) => {
    if (i === 0) {
      return {
        paddingTop: isDragging ? 15 : 0,
        marginTop: isDragging ? -15 : 0,
      };
    }
    return undefined;
  };

  async function onReorder(
    id: string,
    dropPos: 'top' | 'bottom' | null,
    targetId: string,
  ) {
    let targetIdToMove: string | null = targetId;
    if (dropPos === 'bottom') {
      const idx = accounts.findIndex(a => a.id === targetId) + 1;
      targetIdToMove = idx < accounts.length ? accounts[idx].id : null;
    }

    moveAccount.mutate({ id, targetId: targetIdToMove });
  }

  const onToggleClosedAccounts = () => {
    setShowClosedAccountsPref(!showClosedAccounts);
  };

  const [collapsedGroups = {}, setCollapsedGroupsPref] = useLocalPref(
    'ui.collapsedAccountGroups',
  );

  const toggleGroup = (group: string) => {
    setCollapsedGroupsPref({
      ...collapsedGroups,
      [group]: !collapsedGroups[group],
    });
  };

  return (
    <View style={{ flexShrink: 0 }}>
      <View>
        {onBudgetAccounts.length > 0 && (
          <AccountGroupBox
            isCollapsed={!!collapsedGroups.onbudget}
            onToggle={() => toggleGroup('onbudget')}
            toggleLabel={t('Toggle budget accounts')}
            header={
              <Account
                name={t('Budget Accounts')}
                showCurrencySymbol
                to="/accounts/onbudget"
                query={bindings.onBudgetAccountBalance()}
                style={{ fontWeight, paddingLeft: 2, paddingRight: 8 }}
                titleAccount
                balanceTestId="sidebar-on-budget-balance"
              />
            }
          >
            {onBudgetAccounts.map((account, i) => (
              <Account
                key={account.id}
                name={account.name}
                account={account}
                connected={!!account.bank}
                pending={syncingAccountIds.includes(account.id)}
                failed={isAccountFailedSync(account)}
                updated={updatedAccounts.includes(account.id)}
                to={getAccountPath(account)}
                query={bindings.accountBalance(account.id)}
                onDragChange={onDragChange}
                onDrop={onReorder}
                outerStyle={makeDropPadding(i)}
              />
            ))}
          </AccountGroupBox>
        )}

        {offbudgetAccounts.length > 0 && (
          <AccountGroupBox
            isCollapsed={!!collapsedGroups.offbudget}
            onToggle={() => toggleGroup('offbudget')}
            toggleLabel={t('Toggle off-budget accounts')}
            header={
              <Account
                name={t('Off-Budget Accounts')}
                showCurrencySymbol
                to="/accounts/offbudget"
                query={bindings.offBudgetAccountBalance()}
                style={{ fontWeight, paddingLeft: 2, paddingRight: 8 }}
                titleAccount
                balanceTestId="sidebar-off-budget-balance"
              />
            }
          >
            {offbudgetAccounts.map((account, i) => (
              <Account
                key={account.id}
                name={account.name}
                account={account}
                connected={!!account.bank}
                pending={syncingAccountIds.includes(account.id)}
                failed={isAccountFailedSync(account)}
                updated={updatedAccounts.includes(account.id)}
                to={getAccountPath(account)}
                query={bindings.accountBalance(account.id)}
                onDragChange={onDragChange}
                onDrop={onReorder}
                outerStyle={makeDropPadding(i)}
              />
            ))}
          </AccountGroupBox>
        )}

        {closedAccounts.length > 0 && (
          <AccountGroupBox
            isCollapsed={!showClosedAccounts}
            onToggle={onToggleClosedAccounts}
            toggleLabel={t('Toggle closed accounts')}
            header={
              <View
                onClick={onToggleClosedAccounts}
                style={{
                  ...accountNameStyle,
                  fontWeight,
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  paddingLeft: 2,
                  paddingRight: 8,
                  borderLeft: '4px solid transparent',
                }}
              >
                <AlignedText
                  left={t('Closed Accounts')}
                  right={
                    <CellValue<'account', 'closed-accounts-balance'>
                      binding={bindings.closedAccountBalance()}
                      type="financial"
                    >
                      {props => (
                        <CellValueText
                          {...props}
                          formatter={(value, valueType) =>
                            withTotalSymbol(
                              format(value, valueType),
                              format.currency,
                            )
                          }
                        />
                      )}
                    </CellValue>
                  }
                />
              </View>
            }
          >
            {closedAccounts.map(account => (
              <Account
                key={account.id}
                name={account.name}
                account={account}
                to={getAccountPath(account)}
                query={bindings.accountBalance(account.id)}
                onDragChange={onDragChange}
                onDrop={onReorder}
              />
            ))}
          </AccountGroupBox>
        )}
      </View>
    </View>
  );
}

type AccountGroupBoxProps = {
  header: ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  toggleLabel: string;
  children: ReactNode;
};

function AccountGroupBox({
  header,
  isCollapsed,
  onToggle,
  toggleLabel,
  children,
}: AccountGroupBoxProps) {
  const ToggleIcon = isCollapsed ? SvgCheveronRight : SvgCheveronDown;

  return (
    <View
      style={{
        flexShrink: 0,
        margin: '10px 8px 0',
        padding: '3px 0',
        borderRadius: 6,
        backgroundColor: theme.sidebarAccountGroupBackground,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Button
          variant="bare"
          aria-label={toggleLabel}
          aria-expanded={!isCollapsed}
          onPress={onToggle}
          style={{ padding: 2, marginLeft: 2, color: theme.sidebarItemText }}
        >
          <ToggleIcon width={12} height={12} />
        </Button>
        <View style={{ flex: 1, minWidth: 0 }}>{header}</View>
      </View>
      {!isCollapsed && children}
    </View>
  );
}
