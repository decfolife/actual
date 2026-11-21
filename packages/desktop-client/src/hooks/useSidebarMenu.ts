import { matchPath, useLocation } from 'react-router';

import type { SyncedPrefs } from '@actual-app/core/types/prefs';

import {
  getSidebarMenuItemPath,
  isSettingsSection,
  parseSidebarMenuItems,
  parseSidebarStartPage,
} from '#components/sidebar/sidebarMenu';
import type {
  SidebarMenuItem,
  SidebarMenuItemId,
} from '#components/sidebar/sidebarMenu';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { mergeSyncedPrefs, saveSyncedPrefs } from '#prefs/prefsSlice';
import { useDispatch } from '#redux';

export function useSidebarMenu() {
  const dispatch = useDispatch();
  const [itemsPref] = useSyncedPref('sidebar-menu-items');
  const [startPagePref] = useSyncedPref('sidebar-start-page');

  // Bank sync providers are switched off in this fork.
  const isItemAvailable = (id: SidebarMenuItemId) => id !== 'bank-sync';

  const items = parseSidebarMenuItems(itemsPref);
  const availableItems = items.filter(item => isItemAvailable(item.id));
  // A hidden page with no settings page stays in the sidebar while it is open
  const { pathname } = useLocation();
  const isItemOpen = (id: SidebarMenuItemId) =>
    matchPath(`/${id}/*`, pathname) !== null;
  const sidebarItems = availableItems.filter(
    item =>
      !item.hidden || (!isSettingsSection(item.id) && isItemOpen(item.id)),
  );
  const settingsItems = availableItems.filter(
    item => item.hidden && isSettingsSection(item.id),
  );

  const startPage = parseSidebarStartPage(startPagePref, availableItems);
  const startPath = getSidebarMenuItemPath(
    startPage,
    sidebarItems.some(item => item.id === startPage),
  );

  const savePrefs = (prefs: Partial<SyncedPrefs>) => {
    dispatch(mergeSyncedPrefs(prefs));
    void dispatch(saveSyncedPrefs({ prefs }));
  };

  const saveItems = (newItems: SidebarMenuItem[]) => {
    savePrefs({ 'sidebar-menu-items': JSON.stringify(newItems) });
  };

  const saveStartPage = (newStartPage: SidebarMenuItemId) => {
    savePrefs({ 'sidebar-start-page': newStartPage });
  };

  return {
    items,
    availableItems,
    sidebarItems,
    settingsItems,
    startPage,
    startPath,
    isItemAvailable,
    saveItems,
    saveStartPage,
  };
}
