import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Trans, useTranslation } from 'react-i18next';
import { matchPath, Route, Routes, useLocation } from 'react-router';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { SvgArrowLeft } from '@actual-app/components/icons/v1';
import {
  SvgAlertTriangle,
  SvgNavigationMenu,
  SvgViewHide,
  SvgViewShow,
} from '@actual-app/components/icons/v2';
import { SpaceBetween } from '@actual-app/components/space-between';
import type { CSSProperties } from '@actual-app/components/styles';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { Tooltip } from '@actual-app/components/tooltip';
import { View } from '@actual-app/components/view';
import { isDevelopmentEnvironment } from '@actual-app/core/shared/environment';
import * as Platform from '@actual-app/core/shared/platform';
import { css } from '@emotion/css';

import { isAccountFailedSync } from '#accounts/syncStatus';
import { sync } from '#app/appSlice';
import { SharedArrayBufferWarning } from '#components/SharedArrayBufferWarning';
import { useAccounts } from '#hooks/useAccounts';
import { useGlobalPref } from '#hooks/useGlobalPref';
import { useIsTestEnv } from '#hooks/useIsTestEnv';
import { useNavigate } from '#hooks/useNavigate';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { useSyncStatus } from '#hooks/useSyncStatus';
import { useDispatch } from '#redux';
import * as bindings from '#spreadsheet/bindings';

import { AccountSyncCheck } from './accounts/AccountSyncCheck';
import { AnimatedRefresh } from './AnimatedRefresh';
import { MonthCountSelector } from './budget/MonthCountSelector';
import { Link } from './common/Link';
import { HelpMenu } from './HelpMenu';
import { LoggedInUser } from './LoggedInUser';
import { NotificationsButton } from './news/NotificationsButton';
import { useServerURL } from './ServerContext';
import { useSidebar } from './sidebar/SidebarProvider';
import { ThemeSelector } from './ThemeSelector';

function UncategorizedButton() {
  const count: number | null = useSheetValue(bindings.uncategorizedCount());
  if (count === null || count <= 0) {
    return null;
  }

  return (
    <Link
      variant="button"
      buttonVariant="bare"
      to="/categories/uncategorized"
      style={{
        color: theme.errorText,
      }}
    >
      <Trans count={count}>{{ count }} uncategorized transactions</Trans>
    </Link>
  );
}

type PrivacyButtonProps = {
  style?: CSSProperties;
};

function PrivacyButton({ style }: PrivacyButtonProps) {
  const { t } = useTranslation();
  const [isPrivacyEnabledPref, setPrivacyEnabledPref] =
    useSyncedPref('isPrivacyEnabled');
  const isPrivacyEnabled = String(isPrivacyEnabledPref) === 'true';

  const privacyIconStyle = { width: 15, height: 15 };

  useHotkeys(
    'shift+ctrl+p, shift+cmd+p, shift+meta+p',
    () => {
      setPrivacyEnabledPref(String(!isPrivacyEnabled));
    },
    {
      preventDefault: true,
      scopes: ['app'],
    },
    [setPrivacyEnabledPref, isPrivacyEnabled],
  );

  return (
    <Tooltip
      placement="bottom end"
      content={
        isPrivacyEnabled ? (
          <Trans>Disable privacy mode</Trans>
        ) : (
          <Trans>Enable privacy mode</Trans>
        )
      }
    >
      <Button
        variant="bare"
        aria-label={
          isPrivacyEnabled
            ? t('Disable privacy mode')
            : t('Enable privacy mode')
        }
        onPress={() => setPrivacyEnabledPref(String(!isPrivacyEnabled))}
        style={style}
      >
        {isPrivacyEnabled ? (
          <SvgViewHide style={privacyIconStyle} />
        ) : (
          <SvgViewShow style={privacyIconStyle} />
        )}
      </Button>
    </Tooltip>
  );
}

type ServerSyncButtonProps = {
  style?: CSSProperties;
  isMobile?: boolean;
  /** A larger icon and click target (used in the budget header). */
  large?: boolean;
};

/** Cmd/Ctrl+S syncs, wherever the sync button happens to be shown. */
function SyncHotkey() {
  const dispatch = useDispatch();
  const onSync = () => dispatch(sync());

  useHotkeys(
    'ctrl+s, cmd+s, meta+s',
    onSync,
    {
      enableOnFormTags: true,
      preventDefault: true,
      scopes: ['app'],
    },
    [onSync],
  );

  return null;
}

export function ServerSyncButton({
  style,
  isMobile = false,
  large = false,
}: ServerSyncButtonProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  // Give the layout some time to apply the starting animation so we
  // always finish it correctly even if the sync is almost instant
  const { isSyncing: syncing, syncState } = useSyncStatus({
    syncingEndDelayMs: 200,
  });

  const mobileColor =
    syncState === 'error'
      ? theme.errorText
      : syncState === 'disabled' ||
          syncState === 'offline' ||
          syncState === 'local'
        ? theme.mobileHeaderTextSubdued
        : theme.mobileHeaderText;
  const desktopColor =
    syncState === 'error'
      ? theme.errorTextDark
      : syncState === 'disabled' ||
          syncState === 'offline' ||
          syncState === 'local'
        ? theme.buttonBareDisabledText
        : theme.buttonBareText;

  const activeStyle = isMobile
    ? {
        color: mobileColor,
      }
    : {};

  const hoveredStyle = isMobile
    ? {
        color: mobileColor,
        background: theme.mobileHeaderTextHover,
      }
    : {};

  const mobileIconStyle = {
    color: mobileColor,
    justifyContent: 'center',
    margin: 10,
    paddingLeft: 5,
    paddingRight: 3,
  };

  const mobileTextStyle = {
    ...styles.text,
    fontWeight: 500,
    marginLeft: 2,
    marginRight: 5,
  };

  const onSync = () => dispatch(sync());

  const tooltipContent =
    syncState === 'error' ? (
      <Trans>Sync error — click to retry</Trans>
    ) : syncState === 'offline' ? (
      <Trans>Offline — will sync when reconnected</Trans>
    ) : syncState === 'local' ? (
      <Trans>Local file, not connected to a server</Trans>
    ) : syncState === 'disabled' ? (
      <Trans>Syncing disabled for this file</Trans>
    ) : (
      <Trans>
        Sync with your server to back up this file and access it on other
        devices
      </Trans>
    );

  return (
    <Tooltip placement="bottom end" content={tooltipContent}>
      <Button
        variant="bare"
        aria-label={t('Server Sync')}
        className={css({
          ...(isMobile
            ? {
                ...style,
                WebkitAppRegion: 'none',
                ...mobileIconStyle,
              }
            : {
                ...style,
                WebkitAppRegion: 'none',
                color: desktopColor,
                ...(large && { minWidth: 36, minHeight: 32, padding: '0 8px' }),
              }),
          '&[data-hovered]': hoveredStyle,
          '&[data-pressed]': activeStyle,
        })}
        onPress={onSync}
        isDisabled={syncState === 'offline'}
        aria-disabled={syncState === 'offline'}
      >
        {isMobile ? (
          syncState === 'error' ? (
            <SvgAlertTriangle width={14} height={14} />
          ) : (
            <AnimatedRefresh width={18} height={18} animating={syncing} />
          )
        ) : syncState === 'error' ? (
          <SvgAlertTriangle width={large ? 20 : 13} />
        ) : (
          <AnimatedRefresh
            animating={syncing}
            {...(large && { width: 20, height: 20 })}
          />
        )}
        <Text style={isMobile ? { ...mobileTextStyle } : null}>
          {syncState === 'disabled' ? ` ${t('Disabled')}` : null}
        </Text>
      </Button>
    </Tooltip>
  );
}

export function BudgetMonthCountSelector() {
  const [maxMonths, setMaxMonthsPref] = useGlobalPref('maxMonths');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <MonthCountSelector
        maxMonths={maxMonths || 1}
        onChange={value => setMaxMonthsPref(value)}
      />
    </View>
  );
}

type TitlebarProps = {
  style?: CSSProperties;
};

export function Titlebar({ style }: TitlebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebar = useSidebar();
  const { isNarrowWidth } = useResponsive();
  const [floatingSidebar] = useGlobalPref('floatingSidebar');
  const isTitlebarHidden = useIsTitlebarHidden();

  return isNarrowWidth || isTitlebarHidden ? null : (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0 10px 0 15px',
        height: 36,
        pointerEvents: 'none',
        '& *': {
          pointerEvents: 'auto',
        },
        ...(!Platform.isBrowser && Platform.OS === 'mac' && floatingSidebar
          ? { paddingLeft: 80 }
          : {}),
        ...style,
      }}
    >
      {(floatingSidebar || sidebar.alwaysFloats) && (
        <Button
          aria-label={t('Sidebar menu')}
          variant="bare"
          style={{ marginRight: 8 }}
          onHoverStart={e => {
            if (e.pointerType === 'mouse') {
              sidebar.setHidden(false);
            }
          }}
          onPress={e => {
            if (e.pointerType !== 'mouse') {
              sidebar.setHidden(!sidebar.hidden);
            }
          }}
        >
          <SvgNavigationMenu
            className="menu"
            style={{ width: 15, height: 15, left: 0 }}
          />
        </Button>
      )}

      <Routes>
        <Route
          path="*"
          element={
            location.state?.goBack ? (
              <Button variant="bare" onPress={() => navigate(-1)}>
                <SvgArrowLeft
                  width={10}
                  height={10}
                  style={{ marginRight: 5 }}
                />{' '}
                <Trans>Back</Trans>
              </Button>
            ) : null
          }
        />

        <Route path="/accounts/:id" element={<AccountSyncCheck />} />
      </Routes>
    </View>
  );
}

/**
 * Like YNAB 4, pages have no title bar. It is still shown when it has
 * something in it: the button that shows a floating sidebar, a Back button,
 * or the open account's bank sync error.
 */
export function useIsTitlebarHidden() {
  const location = useLocation();
  const sidebar = useSidebar();
  const [floatingSidebar] = useGlobalPref('floatingSidebar');
  const { data: accounts = [] } = useAccounts();

  if (floatingSidebar || sidebar.alwaysFloats || location.state?.goBack) {
    return false;
  }

  const accountId = matchPath('/accounts/:id', location.pathname)?.params.id;
  const account = accountId && accounts.find(a => a.id === accountId);
  return !(account && isAccountFailedSync(account));
}

type TitlebarActionsProps = {
  style?: CSSProperties;
};

/** The app-wide controls (privacy, notifications, sync, help), shown in the sidebar. */
export function TitlebarActions({ style }: TitlebarActionsProps) {
  const serverURL = useServerURL();
  const isTestEnv = useIsTestEnv();

  return (
    <SpaceBetween gap={6} style={{ flexWrap: 'wrap', ...style }}>
      <UncategorizedButton />
      {isDevelopmentEnvironment() && !isTestEnv && <ThemeSelector />}
      <PrivacyButton />
      <NotificationsButton />
      {serverURL ? <SyncHotkey /> : null}
      <SharedArrayBufferWarning />
      <LoggedInUser />
      <HelpMenu />
    </SpaceBetween>
  );
}
