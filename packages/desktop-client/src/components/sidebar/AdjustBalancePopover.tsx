import React, { useState } from 'react';
import type { RefObject } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { Input } from '@actual-app/components/input';
import { Popover } from '@actual-app/components/popover';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { AccountEntity } from '@actual-app/core/types/models';

import { createReconciliationTransaction } from '#accounts/reconciliation';
import { useFormat } from '#hooks/useFormat';
import { useSheetValue } from '#hooks/useSheetValue';
import * as bindings from '#spreadsheet/bindings';

type AdjustBalancePopoverProps = {
  account: AccountEntity;
  triggerRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * YNAB 4's Adjust Balance: enter what the account's balance should be, and
 * a balance adjustment transaction makes up the difference.
 */
export function AdjustBalancePopover({
  account,
  triggerRef,
  isOpen,
  onClose,
}: AdjustBalancePopoverProps) {
  return (
    <Popover
      triggerRef={triggerRef}
      placement="right top"
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      {isOpen && <AdjustBalanceForm account={account} onClose={onClose} />}
    </Popover>
  );
}

type AdjustBalanceFormProps = {
  account: AccountEntity;
  onClose: () => void;
};

function AdjustBalanceForm({ account, onClose }: AdjustBalanceFormProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const balance =
    useSheetValue<'account', 'balance'>(bindings.accountBalance(account.id)) ??
    0;
  // Show the balance until something is typed (it may still be loading)
  const [typed, setTyped] = useState<string | null>(null);
  const text = typed ?? format.forEdit(balance);
  const newBalance = format.fromEdit(text, null);

  async function adjust() {
    if (newBalance == null) {
      return;
    }
    const diff = newBalance - balance;
    if (diff !== 0) {
      await createReconciliationTransaction(account.id, diff);
    }
    onClose();
  }

  return (
    <View style={{ padding: 12, width: 240, gap: 8 }}>
      <View style={{ fontWeight: 600 }}>
        <Trans>Adjust balance</Trans>
      </View>
      <View style={{ fontSize: 12, color: theme.pageTextSubdued }}>
        <Trans>
          Enter the account's current balance. A balance adjustment transaction
          will be added for the difference.
        </Trans>
      </View>
      <InitialFocus>
        <Input
          aria-label={t('Current balance')}
          value={text}
          onChangeValue={setTyped}
          onEnter={() => void adjust()}
          onEscape={onClose}
          onFocus={e => e.currentTarget.select()}
          style={{ textAlign: 'right' }}
        />
      </InitialFocus>
      <View
        style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}
      >
        <Button onPress={onClose}>
          <Trans>Cancel</Trans>
        </Button>
        <Button
          variant="primary"
          isDisabled={newBalance == null}
          onPress={() => void adjust()}
        >
          <Trans>Adjust</Trans>
        </Button>
      </View>
    </View>
  );
}
