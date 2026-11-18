import { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheckCircle1 } from '@actual-app/components/icons/v2';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';
import * as monthUtils from '@actual-app/core/shared/months';
import type {
  AccountEntity,
  TransactionEntity,
} from '@actual-app/core/types/models';
import { v4 as uuidv4 } from 'uuid';

import { useAccounts } from '#hooks/useAccounts';
import { useCategories } from '#hooks/useCategories';
import { useFormat } from '#hooks/useFormat';
import { usePayees } from '#hooks/usePayees';
import { pushModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';

// YNAB 4's iPhone colors
const colors = {
  bar: '#24414e',
  barText: '#ffffff',
  barLink: '#35c0e0',
  amountBackground: '#02202a',
  expense: '#dc3545',
  income: '#28a745',
  key: '#d6d8da',
  keyText: '#163646',
  keyGap: '#ffffff',
  next: '#2ab0d4',
  rowLabel: '#1a1a1a',
  rowValue: '#1a1a1a',
  placeholder: '#9a9a9a',
  divider: '#dcdcdc',
  section: '#e2e2e2',
  sectionText: '#7a7a7a',
};

/**
 * Lets the register (on touch devices) open a transaction in this screen.
 */
export const TouchEditContext = createContext<
  ((transaction: TransactionEntity) => void) | null
>(null);

type TouchTransactionEntryProps = {
  account?: AccountEntity;
  kind: 'transaction' | 'transfer';
  // An existing transaction to edit (or delete) instead of adding one
  transaction?: TransactionEntity;
  onClose: () => void;
};

/**
 * YNAB 4's phone screen for entering a transaction: first the amount on a
 * keypad (expense or income), then the payee, category, account, date,
 * memo and cleared, and Save. Used on touch devices instead of the inline
 * register row, which the on-screen keyboard and small columns make hard to
 * use.
 */
export function TouchTransactionEntry({
  account,
  kind,
  transaction: existing,
  onClose,
}: TouchTransactionEntryProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const format = useFormat();
  const { data: accounts = [] } = useAccounts();
  const { data: payees = [] } = usePayees();
  const { data: categoryData } = useCategories();

  const [step, setStep] = useState<'amount' | 'details'>(
    existing ? 'details' : 'amount',
  );
  // The amount in cents, typed digit by digit like YNAB ("4446" = 44.46)
  const [cents, setCents] = useState(Math.abs(existing?.amount ?? 0));
  const [isIncome, setIsIncome] = useState((existing?.amount ?? 0) > 0);
  const [payeeId, setPayeeId] = useState<string | null>(
    existing?.payee ?? null,
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    existing?.category ?? null,
  );
  const [accountId, setAccountId] = useState<string | null>(
    existing?.account ??
      account?.id ??
      accounts.find(a => !a.closed && !a.offbudget)?.id ??
      null,
  );
  const [date, setDate] = useState(existing?.date ?? monthUtils.currentDay());
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [cleared, setCleared] = useState(existing?.cleared ?? false);
  const [isSaving, setIsSaving] = useState(false);

  const payee = payees.find(p => p.id === payeeId);
  const selectedAccount = accounts.find(a => a.id === accountId);
  const category = categoryData?.list.find(c => c.id === categoryId);
  const categoryGroup = categoryData?.grouped.find(
    g => g.id === category?.group,
  );
  const transferAccount = payee?.transfer_acct
    ? accounts.find(a => a.id === payee.transfer_acct)
    : undefined;
  // A transfer between two on-budget accounts has no category
  const needsCategory =
    !transferAccount ||
    !!selectedAccount?.offbudget !== !!transferAccount.offbudget;

  const amountColor = isIncome ? colors.income : colors.expense;
  const amountText =
    (isIncome || cents === 0 ? '' : '-') +
    '$' +
    format(cents, 'financial').replace('-', '');

  function pressDigit(digit: number) {
    setCents(value => (value >= 100_000_000_00 ? value : value * 10 + digit));
  }

  function pickPayee() {
    dispatch(
      pushModal({
        modal: {
          name: 'payee-autocomplete',
          options: {
            onSelect: id => setPayeeId(id),
            showTransfersFirst: kind === 'transfer',
          },
        },
      }),
    );
  }

  function pickCategory() {
    dispatch(
      pushModal({
        modal: {
          name: 'category-autocomplete',
          options: {
            month: monthUtils.monthFromDate(date),
            onSelect: id => setCategoryId(id),
          },
        },
      }),
    );
  }

  function pickAccount() {
    dispatch(
      pushModal({
        modal: {
          name: 'account-autocomplete',
          options: { onSelect: id => setAccountId(id) },
        },
      }),
    );
  }

  async function save() {
    if (!accountId || isSaving) {
      return;
    }
    setIsSaving(true);
    const transaction = {
      ...(existing ?? {}),
      id: existing?.id ?? uuidv4(),
      account: accountId,
      date,
      amount: isIncome ? cents : -cents,
      payee: payeeId,
      category: needsCategory ? categoryId : null,
      notes: notes || null,
      cleared,
    } as TransactionEntity;
    await send(
      'transactions-batch-update',
      existing ? { updated: [transaction] } : { added: [transaction] },
    );
    onClose();
  }

  async function remove() {
    if (!existing || isSaving) {
      return;
    }
    // oxlint-disable-next-line no-alert
    if (!window.confirm(t('Delete this transaction?'))) {
      return;
    }
    setIsSaving(true);
    await send('transactions-batch-update', { deleted: [{ id: existing.id }] });
    onClose();
  }

  return (
    <View
      role="dialog"
      aria-label={
        kind === 'transfer' ? t('Make a transfer') : t('Add transaction')
      }
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-family)',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 520,
          height: '100%',
          maxHeight: 900,
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Title bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.bar,
            paddingTop: 'calc(10px + env(safe-area-inset-top))',
            paddingBottom: 10,
            paddingLeft: 12,
            paddingRight: 12,
            flexShrink: 0,
          }}
        >
          <Button
            variant="bare"
            onPress={onClose}
            style={{ color: colors.barLink, fontSize: 18, padding: 4 }}
          >
            <Trans>Cancel</Trans>
          </Button>
          <View
            style={{
              flex: 1,
              textAlign: 'center',
              color: colors.barText,
              fontSize: 20,
              marginRight: 60,
            }}
          >
            {existing ? (
              <Trans>Edit Transaction</Trans>
            ) : kind === 'transfer' ? (
              <Trans>Make a Transfer</Trans>
            ) : (
              <Trans>Add Transaction</Trans>
            )}
          </View>
        </View>

        {/* Amount */}
        <View
          role="button"
          aria-label={t('Change the amount')}
          onClick={() => setStep('amount')}
          style={{
            backgroundColor: colors.amountBackground,
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0 20px',
            height: step === 'amount' ? 150 : 120,
            flexShrink: 0,
            cursor: step === 'details' ? 'pointer' : 'default',
          }}
        >
          <View
            style={{
              color: amountColor,
              fontSize: 64,
              fontWeight: 200,
              letterSpacing: -1,
              whiteSpace: 'nowrap',
            }}
          >
            {amountText}
          </View>
        </View>

        {step === 'amount' ? (
          <>
            {/* Expense / Income */}
            <View style={{ flexDirection: 'row', flexShrink: 0 }}>
              <ToggleHalf
                label={t('Expense')}
                color={colors.expense}
                isActive={!isIncome}
                onPress={() => setIsIncome(false)}
              />
              <ToggleHalf
                label={t('Income')}
                color={colors.income}
                isActive={isIncome}
                onPress={() => setIsIncome(true)}
              />
            </View>

            {/* Keypad */}
            <View
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2,
                backgroundColor: colors.keyGap,
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                <Key key={digit} onPress={() => pressDigit(digit)}>
                  {digit}
                </Key>
              ))}
              <Key
                label={t('Delete')}
                onPress={() => setCents(value => Math.floor(value / 10))}
              >
                ⌫
              </Key>
              <Key onPress={() => pressDigit(0)}>0</Key>
              <Key
                background={colors.next}
                color="#ffffff"
                onPress={() => setStep('details')}
              >
                <Trans>NEXT ›</Trans>
              </Key>
            </View>
          </>
        ) : (
          <>
            <View style={{ flex: 1, overflowY: 'auto' }}>
              <DetailRow
                label={transferAccount ? t('Transfer:') : t('Payee:')}
                value={
                  transferAccount
                    ? transferAccount.name
                    : (payee?.name ??
                      (kind === 'transfer'
                        ? t('Choose an account')
                        : t('Choose a payee')))
                }
                isPlaceholder={!payee}
                onPress={pickPayee}
              />
              {needsCategory && (
                <DetailRow
                  label={t('Category:')}
                  value={
                    category
                      ? categoryGroup
                        ? `${categoryGroup.name}: ${category.name}`
                        : category.name
                      : t('Choose a category')
                  }
                  isPlaceholder={!category}
                  onPress={pickCategory}
                />
              )}
              <DetailRow
                label={t('Account:')}
                value={selectedAccount?.name ?? t('Choose an account')}
                isPlaceholder={!selectedAccount}
                onPress={pickAccount}
              />
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: `1px solid ${colors.divider}`,
                  fontSize: 18,
                }}
              >
                <span style={{ fontWeight: 700, color: colors.rowLabel }}>
                  <Trans>Date:</Trans>
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={e => e.target.value && setDate(e.target.value)}
                  data-lpignore="true"
                  style={{
                    flex: 1,
                    textAlign: 'right',
                    border: 0,
                    background: 'transparent',
                    fontSize: 18,
                    color: colors.rowValue,
                    fontFamily: 'inherit',
                  }}
                />
              </label>

              <View
                style={{
                  backgroundColor: colors.section,
                  color: colors.sectionText,
                  padding: '18px 20px 8px',
                  fontSize: 16,
                }}
              >
                <Trans>OPTIONAL</Trans>
              </View>
              <textarea
                aria-label={t('Memo')}
                placeholder={t('Enter a memo')}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                data-lpignore="true"
                style={{
                  border: 0,
                  borderBottom: `1px solid ${colors.divider}`,
                  padding: '16px 20px',
                  fontSize: 18,
                  fontFamily: 'inherit',
                  fontStyle: notes ? 'normal' : 'italic',
                  resize: 'none',
                  outline: 'none',
                }}
              />
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: `1px solid ${colors.divider}`,
                  fontSize: 18,
                }}
              >
                <span style={{ fontWeight: 700, color: colors.rowLabel }}>
                  <Trans>Cleared:</Trans>
                </span>
                <input
                  type="checkbox"
                  checked={cleared}
                  onChange={e => setCleared(e.target.checked)}
                  style={{ width: 24, height: 24 }}
                />
              </label>
            </View>

            <View
              style={{
                padding: 14,
                flexShrink: 0,
                flexDirection: 'row',
                gap: 10,
              }}
            >
              {existing && (
                <Button
                  variant="bare"
                  isDisabled={isSaving}
                  onPress={() => void remove()}
                  style={{
                    backgroundColor: colors.expense,
                    backgroundImage: 'none',
                    color: '#ffffff',
                    fontSize: 22,
                    padding: '14px 20px',
                    borderRadius: 6,
                  }}
                >
                  <Trans>Delete</Trans>
                </Button>
              )}
              <Button
                variant="bare"
                isDisabled={!accountId || isSaving}
                onPress={() => void save()}
                style={{
                  flex: 1,
                  backgroundColor: colors.next,
                  backgroundImage: 'none',
                  color: '#ffffff',
                  fontSize: 22,
                  padding: '14px 0',
                  borderRadius: 6,
                  gap: 10,
                }}
              >
                <SvgCheckCircle1 style={{ width: 24, height: 24 }} />
                <Trans>Save Transaction</Trans>
              </Button>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

type ToggleHalfProps = {
  label: string;
  color: string;
  isActive: boolean;
  onPress: () => void;
};

function ToggleHalf({ label, color, isActive, onPress }: ToggleHalfProps) {
  return (
    <Button
      variant="bare"
      onPress={onPress}
      aria-pressed={isActive}
      style={{
        flex: 1,
        borderRadius: 0,
        padding: '22px 0',
        fontSize: 26,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: isActive ? '#ffffff' : color,
        backgroundColor: isActive ? color : '#ffffff',
        backgroundImage: 'none',
      }}
    >
      {label}
    </Button>
  );
}

type KeyProps = {
  children: ReactNode;
  label?: string;
  background?: string;
  color?: string;
  onPress: () => void;
};

function Key({ children, label, background, color, onPress }: KeyProps) {
  return (
    <Button
      variant="bare"
      aria-label={label}
      onPress={onPress}
      style={{
        borderRadius: 0,
        backgroundColor: background ?? colors.key,
        backgroundImage: 'none',
        color: color ?? colors.keyText,
        fontSize: 40,
        fontWeight: 300,
        minHeight: 64,
      }}
    >
      {children}
    </Button>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  isPlaceholder: boolean;
  onPress: () => void;
};

function DetailRow({ label, value, isPlaceholder, onPress }: DetailRowProps) {
  return (
    <Button
      variant="bare"
      onPress={onPress}
      style={{
        borderRadius: 0,
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: `1px solid ${colors.divider}`,
        fontSize: 18,
        backgroundImage: 'none',
      }}
    >
      <span style={{ fontWeight: 700, color: colors.rowLabel }}>{label}</span>
      <span
        style={{
          color: isPlaceholder ? colors.placeholder : colors.rowValue,
          fontStyle: isPlaceholder ? 'italic' : 'normal',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginLeft: 12,
        }}
      >
        {value} ›
      </span>
    </Button>
  );
}
