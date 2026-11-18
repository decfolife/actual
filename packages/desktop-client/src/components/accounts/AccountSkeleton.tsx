import { useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { keyframes } from '@emotion/css';

const shimmer = keyframes({
  '0%': { opacity: 0.55 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.55 },
});

const ROW_HEIGHT = 25;
const HEADER_HEIGHT = 28;
const ROW_COUNT = 40;

// Placeholder bar widths per column, varied a little row to row
const COLUMNS: { width: number | string; bar: number[]; align?: 'right' }[] = [
  { width: 80, bar: [62, 62, 62] },
  { width: 205, bar: [120, 90, 150] },
  { width: 210, bar: [140, 110, 160] },
  { width: 'auto', bar: [180, 0, 120] },
  { width: 90, bar: [44, 52, 38], align: 'right' },
  { width: 90, bar: [0, 0, 46], align: 'right' },
];

/**
 * Shown while an account loads: the register's header and striped rows with
 * placeholder bars, so the page isn't blank.
 */
export function AccountSkeleton() {
  const { t } = useTranslation();
  return (
    <View
      role="status"
      aria-label={t('Loading transactions')}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        backgroundColor: theme.tableBackground,
      }}
    >
      <View
        style={{
          height: HEADER_HEIGHT,
          flexShrink: 0,
          background: `linear-gradient(${theme.registerHeaderBackground}, ${theme.registerHeaderBackgroundEnd})`,
          borderBottom: `1px solid ${theme.registerHeaderDivider}`,
        }}
      />
      <View
        style={{
          flex: 1,
          animation: `${shimmer} 1.4s ease-in-out infinite`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {Array.from({ length: ROW_COUNT }, (_, row) => (
          <View
            key={row}
            style={{
              height: ROW_HEIGHT,
              flexShrink: 0,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              padding: '0 16px 0 28px',
              backgroundColor:
                row % 2 === 0
                  ? theme.tableBackground
                  : theme.tableRowBackgroundAlternate,
            }}
          >
            {COLUMNS.map((column, index) => {
              const barWidth = column.bar[row % column.bar.length];
              return (
                <View
                  key={index}
                  style={{
                    width: column.width,
                    flex: column.width === 'auto' ? 1 : undefined,
                    flexShrink: 0,
                    alignItems:
                      column.align === 'right' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {barWidth > 0 && (
                    <View
                      style={{
                        width: barWidth,
                        height: 9,
                        borderRadius: 4,
                        backgroundColor: theme.tableBorder,
                      }}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
