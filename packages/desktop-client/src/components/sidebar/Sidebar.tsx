import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd, SvgLibrary } from '@actual-app/components/icons/v1';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { TitlebarActions } from '#components/Titlebar';
import { useGlobalPref } from '#hooks/useGlobalPref';
import { replaceModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';
import * as bindings from '#spreadsheet/bindings';

import { Account } from './Account';
import { Accounts } from './Accounts';
import { BudgetName } from './BudgetName';
import { MoreButtons, PrimaryButtons } from './PrimaryButtons';
import { useSidebar } from './SidebarProvider';
import { SidebarShell } from './SidebarShell';
import { ToggleButton } from './ToggleButton';

// Laid out like YNAB 4: a box with Budget, Reports and All Accounts, the
// account boxes and Add Account. Everything YNAB 4 didn't have sits at the
// bottom.
export function Sidebar() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const sidebar = useSidebar();
  const [isFloating = false, setFloatingSidebarPref] =
    useGlobalPref('floatingSidebar');

  const onFloat = () => {
    setFloatingSidebarPref(!isFloating);
  };

  const onAddAccount = () => {
    dispatch(replaceModal({ modal: { name: 'add-account', options: {} } }));
  };

  return (
    <SidebarShell>
      <View
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: 10,
          textShadow: 'var(--sidebar-text-shadow, none)',
        }}
      >
        <View
          style={{
            flexShrink: 0,
            margin: '0 6px',
            // YNAB 4 leaves room above Budget and below All Accounts
            padding: '10px 0 9px',
            borderRadius: 6,
            overflow: 'hidden',
            backgroundColor: theme.sidebarAccountGroupBackground,
          }}
        >
          <PrimaryButtons />
          <Account
            name={t('All Accounts')}
            to="/accounts"
            query={bindings.allAccountBalance()}
            style={{
              fontSize: 16.5,
              fontWeight: 700,
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 6,
              marginTop: 0,
              marginBottom: 0,
            }}
            Icon={SvgLibrary}
            iconColor="#5fd3f3"
            isExactPathMatch
            showCurrencySymbol
            // YNAB 4 showed the total smaller than the label
            balanceStyle={{ fontSize: 13.5, fontWeight: 700 }}
            balanceTestId="sidebar-all-accounts-balance"
          />
        </View>

        <Accounts />

        <View style={{ flexShrink: 0, alignItems: 'flex-start' }}>
          <Button
            variant="bare"
            data-testid="sidebar-add-account"
            onPress={onAddAccount}
            style={{
              margin: '10px 8px',
              padding: '4px 14px 4px 8px',
              borderRadius: 14,
              color: theme.sidebarItemText,
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              fontSize: 14,
            }}
          >
            <SvgAdd width={12} height={12} style={{ marginRight: 7 }} />
            {t('Add Account')}
          </Button>
        </View>

        {/* Scrolls with the accounts (pinned to the bottom only when there's
          room), so a short screen shows the accounts rather than these */}
        <View
          style={{
            flexShrink: 0,
            marginTop: 'auto',
            paddingTop: 6,
            borderTop: '1px solid ' + theme.sidebarBorder,
          }}
        >
          <MoreButtons />

          <BudgetName
            style={{
              paddingTop: 0,
              height: 'auto',
              margin: '4px 8px 0 19px',
            }}
          >
            {!sidebar.alwaysFloats && (
              <ToggleButton isFloating={isFloating} onFloat={onFloat} />
            )}
          </BudgetName>

          <TitlebarActions
            style={{
              flexShrink: 0,
              padding: '6px 12px 10px',
              // Recolor the title bar controls for the sidebar
              '--color-pageText': theme.sidebarItemText,
              '--color-pageTextLight': theme.sidebarItemText,
              '--color-buttonBareText': theme.sidebarItemText,
              '--color-buttonBareTextHover': theme.sidebarItemText,
              '--color-buttonBareBackgroundHover':
                theme.sidebarItemBackgroundHover,
              '--color-buttonBareBackgroundActive':
                theme.sidebarItemBackgroundHover,
            }}
          />
        </View>
      </View>
    </SidebarShell>
  );
}
