// @ts-strict-ignore
import React, { useRef, useState } from 'react';
import type { ComponentType, CSSProperties, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

import { AlignedText } from '@actual-app/components/aligned-text';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { Input } from '@actual-app/components/input';
import { SpaceBetween } from '@actual-app/components/space-between';
import { styles } from '@actual-app/components/styles';
import type { CSSProperties as StyleProperties } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { Tooltip } from '@actual-app/components/tooltip';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';
import type { AccountEntity } from '@actual-app/core/types/models';
import { css, cx } from '@emotion/css';

import { useReopenAccountMutation, useUpdateAccountMutation } from '#accounts';
import { withTotalSymbol } from '#components/budget/util';
import { Link } from '#components/common/Link';
import { Notes } from '#components/Notes';
import { DropHighlight, useDraggable, useDroppable } from '#components/sort';
import type { OnDragChangeCallback, OnDropCallback } from '#components/sort';
import { CellValue, CellValueText } from '#components/spreadsheet/CellValue';
import { useContextMenu } from '#hooks/useContextMenu';
import { useDragRef } from '#hooks/useDragRef';
import { useFormat } from '#hooks/useFormat';
import { useIsTestEnv } from '#hooks/useIsTestEnv';
import { useNotes } from '#hooks/useNotes';
import { pushModal } from '#modals/modalsSlice';
import { useDispatch, useSelector } from '#redux';
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
  const isTestEnv = useIsTestEnv();
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

  const isContextMenuOpen = useSelector(state =>
    state.contextMenu.items.some(
      i =>
        typeof i === 'object' && 'name' in i && i.name.startsWith('account-'),
    ),
  );
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);

  const onEditNotes = () => {
    if (!account) {
      return;
    }
    dispatch(
      pushModal({
        modal: {
          name: 'notes',
          options: {
            id: `account-${account.id}`,
            name: account.name,
            onSave: (id, contents) => {
              void send('notes-save', { id, note: contents });
            },
          },
        },
      }),
    );
  };

  useContextMenu({
    triggerRef,
    enabled: account != null && needsTooltip,
    // Like YNAB 4: adjust the balance or add a note. Rename and Close are on
    // the account page.
    items: account?.closed
      ? [
          {
            name: 'account-notes',
            text: t('Note…'),
            onClick: onEditNotes,
          },
          {
            name: 'account-reopen',
            text: t('Reopen'),
            onClick: () => reopenAccount.mutate({ id: account.id }),
          },
        ]
      : [
          {
            name: 'account-adjust-balance',
            text: t('Adjust Balance…'),
            onClick: () => setIsAdjustingBalance(true),
          },
          {
            name: 'account-notes',
            text: t('Note…'),
            onClick: onEditNotes,
          },
        ],
  });

  const accountRow = (
    <View innerRef={dropRef} style={{ flexShrink: 0, ...outerStyle }}>
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
                      width={21}
                      height={21}
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

  if (!needsTooltip || isTestEnv) {
    return accountRow;
  }

  return (
    <Tooltip
      content={
        <View
          style={{
            padding: 10,
          }}
        >
          <SpaceBetween gap={5} style={{ justifyContent: 'space-between' }}>
            <Text>{name}</Text>
            <View style={{ flex: 1 }} />
            <CellValue<'account', FieldName> binding={query} type="financial">
              {props => (
                <CellValueText<'account', FieldName>
                  {...props}
                  formatter={(value, valueType) =>
                    withTotalSymbol(format(value, valueType), format.currency)
                  }
                  style={{ marginLeft: 20 }}
                />
              )}
            </CellValue>
          </SpaceBetween>
          {accountNote && (
            <Notes
              getStyle={() => ({
                padding: 0,
                marginTop: '0.75rem',
              })}
              notes={accountNote}
            />
          )}
        </View>
      }
      style={{
        ...styles.tooltip,
        backgroundColor: theme.accountTooltipBackground,
        borderColor: theme.accountTooltipBorder,
        color: theme.accountTooltipText,
        borderRadius: '0px 5px 5px 0px',
        maxWidth: 380,
      }}
      placement="right top"
      triggerProps={{
        delay: 500,
        closeDelay: 250,
        isDisabled: isContextMenuOpen,
      }}
    >
      {accountRow}
    </Tooltip>
  );
}
