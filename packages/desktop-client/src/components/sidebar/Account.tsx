// @ts-strict-ignore
import React, { useRef, useState } from 'react';
import type { ComponentType, CSSProperties, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

import { AlignedText } from '@actual-app/components/aligned-text';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { Input } from '@actual-app/components/input';
import { Menu } from '@actual-app/components/menu';
import type { MenuItem } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import type { CSSProperties as StyleProperties } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';
import type { AccountEntity } from '@actual-app/core/types/models';
import { css, cx } from '@emotion/css';

import { useReopenAccountMutation, useUpdateAccountMutation } from '#accounts';
import { withTotalSymbol } from '#components/budget/util';
import { Link } from '#components/common/Link';
import { DropHighlight, useDraggable, useDroppable } from '#components/sort';
import type { OnDragChangeCallback, OnDropCallback } from '#components/sort';
import { CellValue, CellValueText } from '#components/spreadsheet/CellValue';
import { useDragRef } from '#hooks/useDragRef';
import { useFormat } from '#hooks/useFormat';
import { useNotes } from '#hooks/useNotes';
import { useRefEventListener } from '#hooks/useRefEventListener';
import { openAccountCloseModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';
import type { Binding, SheetFields } from '#spreadsheet';
import { isTouchDevice } from '#util/isTouchDevice';

import { AdjustBalancePopover } from './AdjustBalancePopover';

export const accountNameStyle: StyleProperties = {
  marginTop: -2,
  marginBottom: 2,
  paddingTop: 3,
  paddingBottom: 3,
  paddingRight: 10,
  paddingLeft: 8,
  textDecoration: 'none',
  color: theme.sidebarItemText,
  ':hover': { backgroundColor: theme.sidebarItemBackgroundHover },
  fontSize: 14,
  fontWeight: 600,
};

type AccountProps<FieldName extends SheetFields<'account'>> = {
  name: string;
  to: string;
  query: Binding<'account', FieldName>;
  account?: AccountEntity;
  connected?: boolean;
  pending?: boolean;
  failed?: boolean;
  updated?: boolean;
  style?: CSSProperties;
  outerStyle?: CSSProperties;
  onDragChange?: OnDragChangeCallback<{ id: string }>;
  onDrop?: OnDropCallback;
  titleAccount?: boolean;
  showCurrencySymbol?: boolean;
  balanceStyle?: CSSProperties;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  iconColor?: string;
  isExactPathMatch?: boolean;
  balanceTestId?: string;
};

export function Account<FieldName extends SheetFields<'account'>>({
  name,
  account,
  connected,
  pending = false,
  failed,
  updated,
  to,
  query,
  style,
  outerStyle,
  onDragChange,
  onDrop,
  titleAccount,
  showCurrencySymbol = false,
  balanceStyle,
  Icon,
  iconColor,
  isExactPathMatch,
  balanceTestId,
}: AccountProps<FieldName>) {
  const { t } = useTranslation();
  const type = account
    ? account.closed
      ? 'account-closed'
      : account.offbudget
        ? 'account-offbudget'
        : 'account-onbudget'
    : 'title';

  const triggerRef = useRef(null);

  const { dragRef } = useDraggable({
    type,
    onDragChange,
    item: { id: account && account.id },
    canDrag: account != null,
  });
  const handleDragRef = useDragRef(dragRef);

  const { dropRef, dropPos } = useDroppable({
    types: account ? [type] : [],
    id: account && account.id,
    onDrop,
  });

  const dispatch = useDispatch();

  const [isEditing, setIsEditing] = useState(false);

  const accountNote = useNotes(`account-${account?.id}`);
  const needsTooltip = !!account?.id && !isTouchDevice();
  const reopenAccount = useReopenAccountMutation();
  const updateAccount = useUpdateAccountMutation();

  const format = useFormat();

  const balanceCell = (
    <CellValue<'account', FieldName> binding={query} type="financial">
      {props => (
        <CellValueText<'account', FieldName>
          {...props}
          formatter={
            showCurrencySymbol
              ? (value, valueType) =>
                  withTotalSymbol(format(value, valueType), format.currency)
              : undefined
          }
          style={{
            ...balanceStyle,
            ...(typeof props.value === 'number' &&
              props.value < 0 && { color: theme.sidebarItemTextNegative }),
          }}
        />
      )}
    </CellValue>
  );

  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);

  // Right-click: a small menu (Adjust Balance, Close/Reopen) with the full
  // account note underneath, editable in place. Nothing happens on hover.
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [noteDraft, setNoteDraft] = useState('');

  useRefEventListener(triggerRef, 'contextmenu', (e: MouseEvent) => {
    if (account == null || !needsTooltip) {
      return;
    }
    e.preventDefault();
    setNoteDraft(accountNote ?? '');
    setMenuPos({ x: e.clientX, y: e.clientY });
  });

  const closeMenu = () => {
    if (account && menuPos && noteDraft !== (accountNote ?? '')) {
      void send('notes-save', { id: `account-${account.id}`, note: noteDraft });
    }
    setMenuPos(null);
  };

  const menuItems: MenuItem[] = account?.closed
    ? [{ name: 'account-reopen', text: t('Reopen') }]
    : [
        { name: 'account-adjust-balance', text: t('Adjust Balance…') },
        { name: 'account-close', text: t('Close Account…') },
      ];

  const onMenuSelect = (name: string) => {
    if (!account) {
      return;
    }
    closeMenu();
    if (name === 'account-reopen') {
      reopenAccount.mutate({ id: account.id });
    } else if (name === 'account-adjust-balance') {
      setIsAdjustingBalance(true);
    } else if (name === 'account-close') {
      void dispatch(openAccountCloseModal({ accountId: account.id }));
    }
  };

  const accountRow = (
    <View innerRef={dropRef} style={{ flexShrink: 0, ...outerStyle }}>
      <div
        ref={anchorRef}
        style={{
          position: 'fixed',
          left: menuPos?.x ?? 0,
          top: menuPos?.y ?? 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
      />
      <Popover
        triggerRef={anchorRef}
        isOpen={menuPos != null}
        onOpenChange={open => {
          if (!open) {
            closeMenu();
          }
        }}
        placement="bottom start"
        style={{ width: 260 }}
      >
        <Menu items={menuItems} onMenuSelect={onMenuSelect} />
        <textarea
          aria-label={t('Account note')}
          placeholder={t('Add a note…')}
          value={noteDraft}
          onChange={e => setNoteDraft(e.target.value)}
          rows={Math.min(14, Math.max(4, noteDraft.split('\n').length + 1))}
          style={{
            display: 'block',
            boxSizing: 'border-box',
            width: 'calc(100% - 16px)',
            margin: '4px 8px 8px',
            padding: 6,
            resize: 'vertical',
            font: 'inherit',
            fontSize: 13,
            color: theme.menuItemText,
            background: theme.tableBackground,
            border: `1px solid ${theme.tableBorder}`,
            borderRadius: 3,
          }}
        />
      </Popover>
      {account && (
        <AdjustBalancePopover
          account={account}
          triggerRef={triggerRef}
          isOpen={isAdjustingBalance}
          onClose={() => setIsAdjustingBalance(false)}
        />
      )}
      <View innerRef={triggerRef}>
        <DropHighlight pos={dropPos} />
        <View innerRef={handleDragRef}>
          <Link
            variant="internal"
            to={to}
            isDisabled={isEditing}
            isExactPathMatch={isExactPathMatch}
            style={{
              ...accountNameStyle,
              ...style,
              position: 'relative',
              borderLeft: '4px solid transparent',
              ...(updated && {
                fontWeight: 700,
                color: theme.sidebarItemTextUpdated,
              }),
            }}
            activeStyle={{
              borderColor: theme.sidebarItemAccentSelected,
              color: theme.sidebarItemTextSelected,
              backgroundColor: theme.sidebarItemBackgroundSelected,
              // This is kind of a hack, but we don't ever want the account
              // that the user is looking at to be "bolded" which means it
              // has unread transactions. The system does mark is read and
              // unbolds it, but it still "flashes" bold so this just
              // ignores it if it's active
              fontWeight: 700,
              '& .dot': {
                backgroundColor: theme.sidebarItemAccentSelected,
                transform: 'translateX(-4.5px)',
              },
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <div
                className={cx(
                  'dot',
                  css({
                    marginRight: 3,
                    width: 5,
                    height: 5,
                    borderRadius: 5,
                    backgroundColor: pending
                      ? theme.sidebarItemBackgroundPending
                      : failed
                        ? theme.sidebarItemBackgroundFailed
                        : theme.sidebarItemBackgroundPositive,
                    marginLeft: 2,
                    transition: 'transform .3s',
                    opacity: connected ? 1 : 0,
                  }),
                )}
              />
            </View>

            <AlignedText
              style={titleAccount && { fontStyle: 'italic' }}
              left={
                isEditing ? (
                  <InitialFocus>
                    <Input
                      style={{
                        padding: 0,
                        width: '100%',
                      }}
                      onBlur={() => setIsEditing(false)}
                      onEnter={newAccountName => {
                        if (newAccountName.trim() !== '') {
                          updateAccount.mutate({
                            account: {
                              ...account,
                              name: newAccountName,
                            },
                          });
                        }
                        setIsEditing(false);
                      }}
                      onEscape={() => setIsEditing(false)}
                      defaultValue={name}
                    />
                  </InitialFocus>
                ) : Icon ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon
                      width={24}
                      height={24}
                      style={{
                        color: iconColor,
                        marginRight: 8,
                        flexShrink: 0,
                      }}
                    />
                    {name}
                  </View>
                ) : (
                  name
                )
              }
              right={
                balanceTestId ? (
                  <View data-testid={balanceTestId}>{balanceCell}</View>
                ) : (
                  balanceCell
                )
              }
            />
          </Link>
        </View>
      </View>
    </View>
  );

  return accountRow;
}
