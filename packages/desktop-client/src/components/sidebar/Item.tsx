// @ts-strict-ignore
import React from 'react';
import type {
  ComponentProps,
  ComponentType,
  CSSProperties,
  ReactNode,
  SVGProps,
} from 'react';

import { Block } from '@actual-app/components/block';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { ItemContent } from './ItemContent';

type ItemProps = {
  title: string;
  Icon:
    | ComponentType<SVGProps<SVGElement>>
    | ComponentType<SVGProps<SVGSVGElement>>;
  to?: string;
  children?: ReactNode;
  style?: CSSProperties;
  indent?: number;
  onClick?: ComponentProps<typeof ItemContent>['onClick'];
  forceHover?: boolean;
  forceActive?: boolean;
  iconColor?: string;
  compact?: boolean;
};

export function Item({
  children,
  Icon,
  title,
  style,
  to,
  onClick,
  indent = 0,
  forceHover = false,
  forceActive = false,
  iconColor,
  compact = false,
}: ItemProps) {
  const hoverStyle = {
    backgroundColor: theme.sidebarItemBackgroundHover,
  };

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: compact ? 16 : 22,
      }}
    >
      <Icon
        width={compact ? 13 : 24}
        height={compact ? 13 : 24}
        style={iconColor ? { color: iconColor } : undefined}
      />
      <Block style={{ marginLeft: compact ? 7 : 8 }}>{title}</Block>
      <View style={{ flex: 1 }} />
    </View>
  );

  return (
    <View style={{ flexShrink: 0, ...style }}>
      <ItemContent
        style={{
          ...(compact
            ? { ...styles.smallText, paddingTop: 4, paddingBottom: 4 }
            : {
                fontSize: 16.5,
                fontWeight: 700,
                paddingTop: 7,
                paddingBottom: 7,
              }),
          paddingLeft: (compact ? 19 : 10) + indent,
          paddingRight: 10,
          textDecoration: 'none',
          color: theme.sidebarItemText,
          ...(forceHover ? hoverStyle : {}),
          ':hover': hoverStyle,
        }}
        forceActive={forceActive}
        activeStyle={{
          borderLeft: '4px solid ' + theme.sidebarItemAccentSelected,
          paddingLeft: (compact ? 19 : 10) + indent - 4,
          color: theme.sidebarItemTextSelected,
          backgroundColor: theme.sidebarItemBackgroundSelected,
        }}
        to={to}
        onClick={onClick}
      >
        {content}
      </ItemContent>
      {children ? <View style={{ marginTop: 5 }}>{children}</View> : null}
    </View>
  );
}
