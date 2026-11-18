import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCloseOutline } from '@actual-app/components/icons/v1';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { TransObjectLiteral } from '@actual-app/core/types/util';

type SearchBannerProps = {
  search: string;
  count: number;
  onClear: () => void;
};

/** YNAB 4's striped "Showing N results" bar, with Clear Search */
export function SearchBanner({ search, count, onClear }: SearchBannerProps) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        ...styles.pageContent,
        paddingTop: 0,
        paddingBottom: 0,
        flexShrink: 0,
      }}
    >
      <View
        role="status"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 10px',
          fontWeight: 600,
          color: theme.accountSearchBannerText,
          background: `repeating-linear-gradient(135deg, ${theme.accountSearchBannerBackground} 0 10px, ${theme.accountSearchBannerStripe} 10px 20px)`,
        }}
      >
        <View>
          <Trans count={count}>
            Showing {{ count } as TransObjectLiteral} results for "
            {{ search } as TransObjectLiteral}"
          </Trans>
        </View>
        <Button
          variant="bare"
          aria-label={t('Clear search')}
          onPress={onClear}
          style={{
            color: theme.accountSearchBannerText,
            fontWeight: 600,
            gap: 5,
          }}
        >
          <Trans>Clear Search</Trans>
          <SvgCloseOutline
            style={{ width: 14, height: 14, color: theme.errorText }}
          />
        </Button>
      </View>
    </View>
  );
}
