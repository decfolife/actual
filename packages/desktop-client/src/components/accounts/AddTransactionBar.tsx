import type { ComponentType, ReactNode, Ref, SVGProps } from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd } from '@actual-app/components/icons/v1';
import { SvgArrowsSynchronize } from '@actual-app/components/icons/v2';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { AccountEntity } from '@actual-app/core/types/models';

type AddTransactionBarProps = {
  account?: AccountEntity;
  onAddTransaction: (kind?: 'transfer') => void;
};

/**
 * YNAB 4's strip under the register: "Add a new transaction" and "Make a
 * transfer". Both open a new row at once; a transfer starts on the payee,
 * which lists the accounts to transfer to/from.
 */
export function AddTransactionBar({
  account,
  onAddTransaction,
}: AddTransactionBarProps) {
  if (account?.closed) {
    return null;
  }

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
          // The theme's button look (YNAB's gray bevel)
          backgroundColor: theme.buttonNormalBackground,
          backgroundImage: 'var(--button-gradient, none)',
          borderTop: `1px solid ${theme.buttonNormalBorder}`,
          borderBottom: `1px solid ${theme.buttonNormalBorder}`,
        }}
      >
        <StripButton
          Icon={SvgAdd}
          onPress={() => onAddTransaction()}
          label={<Trans>Add a new transaction</Trans>}
        />
        {account && (
          <StripButton
            Icon={SvgArrowsSynchronize}
            onPress={() => onAddTransaction('transfer')}
            label={<Trans>Make a transfer</Trans>}
          />
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
        borderRight: `1px solid ${theme.buttonNormalBorder}`,
        alignItems: 'stretch',
        color: theme.buttonNormalText,
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
