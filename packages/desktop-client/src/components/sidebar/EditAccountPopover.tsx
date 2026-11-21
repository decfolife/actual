import React, { useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { InitialFocus } from '@actual-app/components/initial-focus';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';
import type { AccountEntity } from '@actual-app/core/types/models';

import { useReopenAccountMutation, useUpdateAccountMutation } from '#accounts';
import {
  YNAB_GRAY_BUTTON,
  YNAB_GREEN_BUTTON,
  YnabPopover,
} from '#components/common/YnabDialog';
import { openAccountCloseModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';

type EditAccountPopoverProps = {
  account: AccountEntity;
  triggerRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  note: string;
  onClose: () => void;
  onAdjustBalance: () => void;
};

const GRAY_BUTTON = YNAB_GRAY_BUTTON;
const GREEN_BUTTON = YNAB_GREEN_BUTTON;

const LABEL: CSSProperties = {
  width: 56,
  flexShrink: 0,
  fontWeight: 700,
  fontSize: 14,
  color: '#555',
};

const FIELD: CSSProperties = {
  flex: 1,
  boxSizing: 'border-box',
  font: 'inherit',
  fontSize: 16,
  color: '#555',
  padding: '7px 10px',
  border: '1px solid #9a9a9a',
  borderRadius: 6,
  background: '#fff',
  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
};

/**
 * YNAB 4's "Edit Account" dialog: name, note, Adjust Balance, and
 * Close/Reopen Account, with Cancel and Done.
 */
export function EditAccountPopover({
  account,
  triggerRef,
  isOpen,
  note,
  onClose,
  onAdjustBalance,
}: EditAccountPopoverProps) {
  return (
    <YnabPopover
      triggerRef={triggerRef}
      isOpen={isOpen}
      onClose={onClose}
      width={440}
    >
      <EditAccountForm
        account={account}
        note={note}
        onClose={onClose}
        onAdjustBalance={onAdjustBalance}
      />
    </YnabPopover>
  );
}

function EditAccountForm({
  account,
  note,
  onClose,
  onAdjustBalance,
}: Omit<EditAccountPopoverProps, 'triggerRef' | 'isOpen'>) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const updateAccount = useUpdateAccountMutation();
  const reopenAccount = useReopenAccountMutation();
  const [name, setName] = useState(account.name);
  const [noteDraft, setNoteDraft] = useState(note);

  function done() {
    if (name.trim() !== '' && name !== account.name) {
      updateAccount.mutate({ account: { ...account, name } });
    }
    if (noteDraft !== note) {
      void send('notes-save', { id: `account-${account.id}`, note: noteDraft });
    }
    onClose();
  }

  return (
    <View style={{ color: '#555', borderRadius: 6, overflow: 'hidden' }}>
      <View
        style={{
          padding: '10px 16px',
          fontSize: 28,
          background: 'linear-gradient(#f2f2f2, #dcdcdc)',
          borderBottom: '1px solid #b5b5b5',
        }}
      >
        <Trans>Edit Account</Trans>
      </View>

      <View style={{ padding: '18px 16px 14px', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={LABEL}>
            <Trans>Name:</Trans>
          </View>
          <InitialFocus>
            <input
              aria-label={t('Account name')}
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={e => e.currentTarget.select()}
              onKeyDown={e => {
                if (e.key === 'Enter') done();
              }}
              style={FIELD}
            />
          </InitialFocus>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ ...LABEL, paddingTop: 8 }}>
            <Trans>Note:</Trans>
          </View>
          <textarea
            aria-label={t('Account note')}
            value={noteDraft}
            onChange={e => setNoteDraft(e.target.value)}
            rows={Math.min(14, Math.max(5, noteDraft.split('\n').length + 1))}
            style={{
              ...FIELD,
              fontSize: 15,
              resize: 'vertical',
              color: '#555',
              background: 'linear-gradient(#e9e9e9, #fbfbfb 25%)',
            }}
          />
        </View>
      </View>

      {!account.closed && (
        <View
          style={{
            flexDirection: 'row',
            padding: '14px 16px',
            borderTop: '1px solid #c8c8c8',
          }}
        >
          <button
            type="button"
            style={GRAY_BUTTON}
            onClick={() => {
              onClose();
              onAdjustBalance();
            }}
          >
            <Trans>Adjust Balance</Trans>
          </button>
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'linear-gradient(#e6e6e6, #d6d6d6)',
          borderTop: '1px solid #b5b5b5',
        }}
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            if (account.closed) {
              reopenAccount.mutate({ id: account.id });
            } else {
              void dispatch(openAccountCloseModal({ accountId: account.id }));
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 15,
            color: '#d0312d',
            padding: 0,
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              background: '#d0312d',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ width: 12, height: 3, background: '#fff' }} />
          </span>
          {account.closed ? (
            <Trans>Reopen Account</Trans>
          ) : (
            <Trans>Close Account</Trans>
          )}
        </button>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <button type="button" style={GRAY_BUTTON} onClick={onClose}>
            <Trans>Cancel</Trans>
          </button>
          <button type="button" style={GREEN_BUTTON} onClick={done}>
            <Trans>Done</Trans>
          </button>
        </View>
      </View>
    </View>
  );
}
