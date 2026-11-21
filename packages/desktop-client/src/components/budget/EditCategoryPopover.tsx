import React, { useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { SvgViewShow } from '@actual-app/components/icons/v2';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { View } from '@actual-app/components/view';
import type { CategoryEntity } from '@actual-app/core/types/models';

import {
  YNAB_BLUE_BUTTON,
  YNAB_GRAY_BUTTON,
  YnabDialog,
  YnabPopover,
} from '#components/common/YnabDialog';

type EditCategoryPopoverProps = {
  category: CategoryEntity;
  triggerRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  canHide: boolean;
  onClose: () => void;
  onSave: (category: CategoryEntity) => void;
  onDelete: (id: CategoryEntity['id']) => void;
};

const LINK = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 17,
  textDecoration: 'underline',
  padding: 0,
} as const;

function Dot({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        background: color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
      }}
    >
      {children}
    </span>
  );
}

/** YNAB 4's "Edit category" popout: rename, hide/show, delete. */
export function EditCategoryPopover({
  category,
  triggerRef,
  isOpen,
  canHide,
  onClose,
  onSave,
  onDelete,
}: EditCategoryPopoverProps) {
  return (
    <YnabPopover
      triggerRef={triggerRef}
      isOpen={isOpen}
      onClose={onClose}
      width={420}
    >
      <EditCategoryForm
        category={category}
        canHide={canHide}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    </YnabPopover>
  );
}

function EditCategoryForm({
  category,
  canHide,
  onClose,
  onSave,
  onDelete,
}: Omit<EditCategoryPopoverProps, 'triggerRef' | 'isOpen'>) {
  const { t } = useTranslation();
  const [name, setName] = useState(category.name);

  function done() {
    if (name.trim() !== '' && name !== category.name) {
      onSave({ ...category, name });
    }
    onClose();
  }

  return (
    <YnabDialog
      title={<Trans>Edit category</Trans>}
      bodyBackground="#fff"
      footerRight={
        <>
          <button type="button" style={YNAB_GRAY_BUTTON} onClick={onClose}>
            <Trans>Cancel</Trans>
          </button>
          <button type="button" style={YNAB_BLUE_BUTTON} onClick={done}>
            <Trans>Done</Trans>
          </button>
        </>
      }
    >
      <View style={{ padding: '24px 16px 20px', gap: 16, color: '#555' }}>
        <InitialFocus>
          <input
            aria-label={t('Category name')}
            value={name}
            onChange={e => setName(e.target.value)}
            onFocus={e => e.currentTarget.select()}
            onKeyDown={e => {
              if (e.key === 'Enter') done();
            }}
            style={{
              boxSizing: 'border-box',
              font: 'inherit',
              fontSize: 22,
              fontWeight: 700,
              color: '#222',
              padding: '7px 10px',
              border: '2px solid #8fcbee',
              borderRadius: 6,
              background: '#fff',
            }}
          />
        </InitialFocus>
        {canHide && (
          <button
            type="button"
            style={{ ...LINK, color: '#1a1ab3' }}
            onClick={() => {
              onSave({ ...category, hidden: !category.hidden });
              onClose();
            }}
          >
            <Dot color="#3b97d3">
              <SvgViewShow width={14} height={14} />
            </Dot>
            {category.hidden ? (
              <Trans>Show this category</Trans>
            ) : (
              <Trans>Hide this category</Trans>
            )}
          </button>
        )}
        <button
          type="button"
          style={{ ...LINK, color: '#a3150f' }}
          onClick={() => {
            onClose();
            onDelete(category.id);
          }}
        >
          <Dot color="#d0312d">
            <span style={{ width: 12, height: 3, background: '#fff' }} />
          </Dot>
          <Trans>Delete this category</Trans>
        </button>
      </View>
    </YnabDialog>
  );
}
