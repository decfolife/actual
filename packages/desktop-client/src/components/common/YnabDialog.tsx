import React from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { OverlayArrow } from 'react-aria-components';

import { Popover } from '@actual-app/components/popover';
import { View } from '@actual-app/components/view';

/** Pieces shared by the YNAB 4-style popouts (Edit Account, Edit category). */

export const YNAB_GRAY_BUTTON: CSSProperties = {
  font: 'inherit',
  fontWeight: 700,
  fontSize: 15,
  color: '#3a3a3a',
  padding: '7px 18px',
  border: '1px solid #8a8a8a',
  borderRadius: 5,
  background: 'linear-gradient(#f4f4f4, #cfcfcf)',
  cursor: 'pointer',
  textShadow: '0 1px 0 rgba(255,255,255,0.7)',
  boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
};

export const YNAB_GREEN_BUTTON: CSSProperties = {
  ...YNAB_GRAY_BUTTON,
  border: '1px solid #5f8f2d',
  background: 'linear-gradient(#d9f0a8, #8cc63f)',
};

export const YNAB_BLUE_BUTTON: CSSProperties = {
  ...YNAB_GRAY_BUTTON,
  color: '#fff',
  textShadow: '0 -1px 0 rgba(0,0,0,0.4)',
  border: '1px solid #0b3d6b',
  background: 'linear-gradient(#2c82c9, #0a4f8a)',
};

type YnabPopoverProps = {
  triggerRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
  width: number;
  children: ReactNode;
};

export function YnabPopover({
  triggerRef,
  isOpen,
  onClose,
  width,
  children,
}: YnabPopoverProps) {
  return (
    <Popover
      triggerRef={triggerRef}
      placement="bottom start"
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
      style={{
        width,
        padding: 0,
        background: '#e8e8e8',
        border: '1px solid #9a9a9a',
        borderRadius: 6,
        overflow: 'visible',
        boxShadow: '0 6px 22px rgba(0,0,0,0.45)',
      }}
      offset={10}
    >
      <OverlayArrow>
        <svg
          width="28"
          height="14"
          viewBox="0 0 28 14"
          style={{ display: 'block', marginLeft: 20, marginTop: -13 }}
        >
          <path
            d="M0 14 L14 1 L28 14"
            fill="#e8e8e8"
            stroke="#9a9a9a"
            strokeWidth="1"
          />
          <rect x="1" y="13" width="26" height="2" fill="#e8e8e8" />
        </svg>
      </OverlayArrow>
      {isOpen && children}
    </Popover>
  );
}

type YnabDialogProps = {
  title: ReactNode;
  children: ReactNode;
  footerLeft?: ReactNode;
  footerRight: ReactNode;
  bodyBackground?: string;
};

export function YnabDialog({
  title,
  children,
  footerLeft,
  footerRight,
  bodyBackground = '#ececec',
}: YnabDialogProps) {
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
        {title}
      </View>
      <View style={{ background: bodyBackground }}>{children}</View>
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
        <View>{footerLeft}</View>
        <View style={{ flexDirection: 'row', gap: 8 }}>{footerRight}</View>
      </View>
    </View>
  );
}
