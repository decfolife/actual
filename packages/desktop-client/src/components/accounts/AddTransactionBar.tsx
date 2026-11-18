import { useRef, useState } from 'react';
import type { ComponentType, ReactNode, Ref, SVGProps } from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd } from '@actual-app/components/icons/v1';
import { SvgArrowsSynchronize } from '@actual-app/components/icons/v2';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { AccountEntity, PayeeEntity } from '@actual-app/core/types/models';

type AddTransactionBarProps = {
  account?: AccountEntity;
  accounts: AccountEntity[];
  payees: PayeeEntity[];
  onAddTransaction: (payeeId?: PayeeEntity['id']) => void;
};

/**
 * YNAB 4's strip under the register: "Add a new transaction" and "Make a
 * transfer" (which starts a transaction paid to another account).
 */
export function AddTransactionBar({
  account,
  accounts,
  payees,
  onAddTransaction,
}: AddTransactionBarProps) {
  const transferRef = useRef<HTMLButtonElement>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  if (account?.closed) {
    return null;
  }

  // Accounts this one can transfer to, each with its transfer payee
  const transferTargets = accounts
    .filter(a => !a.closed && a.id !== account?.id)
    .map(a => ({
      account: a,
      payee: payees.find(p => p.transfer_acct === a.id),
    }))
    .filter(target => target.payee != null);

  return (
    <View
      style={{
        ...styles.pageContent,
        paddingTop: 0,
        paddingBottom: 0,
        flexShrink: 0,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.tableHeaderBackground,
          borderTop: `1px solid ${theme.tableBorder}`,
          borderBottom: `1px solid ${theme.tableBorder}`,
        }}
      >
        <StripButton
          Icon={SvgAdd}
          onPress={() => onAddTransaction()}
          label={<Trans>Add a new transaction</Trans>}
        />
        {account && transferTargets.length > 0 && (
          <>
            <StripButton
              ref={transferRef}
              Icon={SvgArrowsSynchronize}
              onPress={() => setIsTransferOpen(true)}
              label={<Trans>Make a transfer</Trans>}
            />
            <Popover
              triggerRef={transferRef}
              placement="top start"
              isOpen={isTransferOpen}
              onOpenChange={() => setIsTransferOpen(false)}
              style={{ maxHeight: 400 }}
            >
              <Menu
                header={
                  <View
                    style={{
                      padding: '6px 10px',
                      fontWeight: 600,
                      color: theme.menuItemTextHeader,
                    }}
                  >
                    <Trans>Transfer with…</Trans>
                  </View>
                }
                onMenuSelect={id => {
                  setIsTransferOpen(false);
                  const target = transferTargets.find(
                    tt => tt.account.id === id,
                  );
                  if (target?.payee) {
                    onAddTransaction(target.payee.id);
                  }
                }}
                items={transferTargets.map(({ account: a }) => ({
                  name: a.id,
                  text: a.name,
                }))}
              />
            </Popover>
          </>
        )}
      </View>
    </View>
  );
}

type StripButtonProps = {
  ref?: Ref<HTMLButtonElement>;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: ReactNode;
  onPress: () => void;
};

function StripButton({ ref, Icon, label, onPress }: StripButtonProps) {
  return (
    <Button
      ref={ref}
      variant="bare"
      onPress={onPress}
      style={{
        padding: 0,
        borderRadius: 0,
        borderRight: `1px solid ${theme.tableBorder}`,
        alignItems: 'stretch',
        color: theme.pageText,
      }}
    >
      <View
        style={{
          width: 30,
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.registerClearedText,
          backgroundColor: theme.registerClearedBackground,
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0.1))',
        }}
      >
        <Icon style={{ width: 11, height: 11 }} />
      </View>
      <View style={{ padding: '4px 12px' }}>{label}</View>
    </Button>
  );
}
