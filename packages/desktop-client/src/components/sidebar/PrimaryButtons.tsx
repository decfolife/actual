import React from 'react';
import { useTranslation } from 'react-i18next';

import { SvgCog } from '@actual-app/components/icons/v1';
import { View } from '@actual-app/components/view';

import { useSidebarMenu } from '#hooks/useSidebarMenu';

import { Item } from './Item';
import { getSidebarMenuItemPath } from './sidebarMenu';
import { useSidebarMenuItemDetails } from './useSidebarMenuItemDetails';

// The pages YNAB 4 had in its sidebar, shown at the top with colored icons
const YNAB_ITEM_COLORS: Partial<Record<string, string>> = {
  budget: '#d4e02a',
  reports: '#f5b52e',
};

/** Budget and Reports, the pages YNAB 4 had at the top of its sidebar. */
export function PrimaryButtons() {
  const { sidebarItems } = useSidebarMenu();
  const itemDetails = useSidebarMenuItemDetails();

  return (
    <View data-testid="sidebar-primary-buttons" style={{ flexShrink: 0 }}>
      {sidebarItems
        .filter(item => item.id in YNAB_ITEM_COLORS)
        .map(item => (
          <Item
            key={item.id}
            title={itemDetails[item.id].title}
            Icon={itemDetails[item.id].Icon}
            iconColor={YNAB_ITEM_COLORS[item.id]}
            to={getSidebarMenuItemPath(item.id, true)}
          />
        ))}
    </View>
  );
}

/** The other pages and Settings, kept small at the bottom of the sidebar. */
export function MoreButtons() {
  const { t } = useTranslation();
  const { sidebarItems } = useSidebarMenu();
  const itemDetails = useSidebarMenuItemDetails();

  return (
    <View data-testid="sidebar-more-buttons" style={{ flexShrink: 0 }}>
      {sidebarItems
        .filter(item => !(item.id in YNAB_ITEM_COLORS))
        .map(item => (
          <Item
            key={item.id}
            title={itemDetails[item.id].title}
            Icon={itemDetails[item.id].Icon}
            to={getSidebarMenuItemPath(item.id, true)}
            compact
          />
        ))}
      <Item title={t('Settings')} Icon={SvgCog} to="/settings" compact />
    </View>
  );
}
