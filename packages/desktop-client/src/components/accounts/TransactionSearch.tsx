import { useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode, Ref } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { SvgCalendar3 } from '@actual-app/components/icons/v2';
import { Popover } from '@actual-app/components/popover';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { RuleConditionEntity } from '@actual-app/core/types/models';
import type { TransObjectLiteral } from '@actual-app/core/types/util';
import { format as formatDate, isValid, parse } from 'date-fns';

import { Search } from '#components/common/Search';
import { useCategories } from '#hooks/useCategories';
import { useDateFormat } from '#hooks/useDateFormat';
import { usePayees } from '#hooks/usePayees';

type Suggestion = {
  key: string;
  prefix: string;
  label: ReactNode;
  // null searches every field (the plain search)
  condition: RuleConditionEntity | null;
};

type TransactionSearchProps = {
  ref?: Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  onApplyFilter: (condition: RuleConditionEntity) => void;
};

const MAX_NAME_MATCHES = 4;

/**
 * Like YNAB 4's search box: typing searches every field, and a list under
 * it offers narrower searches (a date, a payee or category by name, or the
 * text in just the payee, category or memo).
 */
export function TransactionSearch({
  ref,
  value,
  onChange,
  onApplyFilter,
}: TransactionSearchProps) {
  const { t } = useTranslation();
  const dateFormat = useDateFormat() || 'MM/dd/yyyy';
  const { data: payees = [] } = usePayees();
  const { data: categories } = useCategories();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const isClosingWithEscape = useRef(false);

  // What's typed; the search only runs on Enter or when a suggestion is
  // picked, not on every keystroke
  const [draft, setDraft] = useState(value);
  const [appliedValue, setAppliedValue] = useState(value);
  if (value !== appliedValue) {
    // The search changed elsewhere, e.g. Clear Search or another account
    setAppliedValue(value);
    setDraft(value);
  }

  const text = draft.trim();
  const lower = text.toLowerCase();
  const suggestions: Suggestion[] = [];

  if (text !== '') {
    const date = parseSearchDate(text, dateFormat);
    if (date) {
      suggestions.push({
        key: 'date',
        prefix: t('Date:'),
        label: formatDate(date, dateFormat),
        condition: {
          field: 'date',
          op: 'is',
          value: formatDate(date, 'yyyy-MM-dd'),
          type: 'date',
        } as RuleConditionEntity,
      });
    }

    for (const payee of payees
      .filter(p => !p.transfer_acct && p.name.toLowerCase().includes(lower))
      .slice(0, MAX_NAME_MATCHES)) {
      suggestions.push({
        key: `payee-${payee.id}`,
        prefix: t('Payee:'),
        label: payee.name,
        condition: {
          field: 'payee',
          op: 'is',
          value: payee.id,
          type: 'id',
        } as RuleConditionEntity,
      });
    }

    for (const category of (categories?.list ?? [])
      .filter(c => !c.hidden && c.name.toLowerCase().includes(lower))
      .slice(0, MAX_NAME_MATCHES)) {
      const group = categories?.grouped.find(g => g.id === category.group);
      suggestions.push({
        key: `category-${category.id}`,
        prefix: t('Category:'),
        label: group ? `${group.name}: ${category.name}` : category.name,
        condition: {
          field: 'category',
          op: 'is',
          value: category.id,
          type: 'id',
        } as RuleConditionEntity,
      });
    }

    const find = (field: string) => (
      <Trans>
        Find "<strong>{{ text } as TransObjectLiteral}</strong>" in{' '}
        {{ field } as TransObjectLiteral}
      </Trans>
    );
    suggestions.push(
      {
        key: 'any',
        prefix: '',
        label: find(t('any field')),
        condition: null,
      },
      {
        key: 'in-payee',
        prefix: t('Payee:'),
        label: find(t('the payee')),
        condition: {
          field: 'payee',
          op: 'contains',
          value: text,
          type: 'id',
        } as RuleConditionEntity,
      },
      {
        key: 'in-category',
        prefix: t('Category:'),
        label: find(t('the category')),
        condition: {
          field: 'category',
          op: 'contains',
          value: text,
          type: 'id',
        } as RuleConditionEntity,
      },
      {
        key: 'in-memo',
        prefix: t('Memo:'),
        label: find(t('the memo')),
        condition: {
          field: 'notes',
          op: 'contains',
          value: text,
          type: 'string',
        } as RuleConditionEntity,
      },
    );
  }

  const isOpen = isFocused && !isDismissed && suggestions.length > 0;
  // Enter searches every field unless another suggestion is highlighted
  const highlightedIndex = suggestions.findIndex(
    s => s.key === (highlightedKey ?? 'any'),
  );
  const current =
    highlightedIndex === -1
      ? suggestions.findIndex(s => s.key === 'any')
      : highlightedIndex;

  function search(newValue: string) {
    setAppliedValue(newValue);
    onChange(newValue);
  }

  function choose(suggestion: Suggestion) {
    setIsDismissed(true);
    if (suggestion.condition) {
      // Apply first: applying a filter re-runs the current search
      onApplyFilter(suggestion.condition);
      setDraft('');
      if (value !== '') {
        search('');
      }
    } else {
      search(text);
    }
  }

  function onKeyDownCapture(e: KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'Enter') {
        e.preventDefault();
        search(text);
      }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setHighlightedKey(
        suggestions[(current + step + suggestions.length) % suggestions.length]
          .key,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      choose(suggestions[current]);
    } else if (e.key === 'Escape' && draft !== '') {
      e.stopPropagation();
      setIsDismissed(true);
      // The search box clears itself on Escape's keyup; this Escape only
      // closes the list
      isClosingWithEscape.current = true;
    }
  }

  return (
    <View
      innerRef={triggerRef}
      onKeyDownCapture={onKeyDownCapture}
      onKeyUpCapture={e => {
        if (e.key === 'Escape' && isClosingWithEscape.current) {
          isClosingWithEscape.current = false;
          e.stopPropagation();
        }
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <Search
        ref={ref}
        placeholder={t('Search')}
        value={draft}
        width={230}
        onChange={newValue => {
          setIsDismissed(false);
          setHighlightedKey(null);
          setDraft(newValue);
          // Clearing the box (× or Escape) clears the search right away
          if (newValue === '' && value !== '') {
            search('');
          }
        }}
      />
      <Popover
        triggerRef={triggerRef}
        placement="bottom end"
        isOpen={isOpen}
        isNonModal
        onOpenChange={open => {
          if (!open) {
            setIsDismissed(true);
          }
        }}
        style={{ minWidth: 400, padding: '4px 0' }}
      >
        <View role="listbox" aria-label={t('Search suggestions')}>
          {!suggestions.some(s => s.key === 'date') && (
            <SuggestionRow prefix={t('Dates')} isDisabled>
              <SvgCalendar3 style={{ width: 12, height: 12, marginRight: 4 }} />
              <em>
                <Trans>
                  (Enter dates as{' '}
                  {{ dateHint: dateFormat.toUpperCase() } as TransObjectLiteral}
                  )
                </Trans>
              </em>
            </SuggestionRow>
          )}
          {suggestions.map((suggestion, index) => (
            <SuggestionRow
              key={suggestion.key}
              prefix={suggestion.prefix}
              isHighlighted={index === current}
              onHover={() => setHighlightedKey(suggestion.key)}
              onChoose={() => choose(suggestion)}
            >
              {suggestion.label}
            </SuggestionRow>
          ))}
        </View>
      </Popover>
    </View>
  );
}

type SuggestionRowProps = {
  prefix: string;
  children: ReactNode;
  isHighlighted?: boolean;
  isDisabled?: boolean;
  onHover?: () => void;
  onChoose?: () => void;
};

function SuggestionRow({
  prefix,
  children,
  isHighlighted = false,
  isDisabled = false,
  onHover,
  onChoose,
}: SuggestionRowProps) {
  return (
    <View
      role="option"
      aria-selected={isHighlighted}
      aria-disabled={isDisabled}
      onMouseEnter={onHover}
      // Keep focus in the search box
      onMouseDown={e => e.preventDefault()}
      onClick={isDisabled ? undefined : onChoose}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: '4px 12px',
        cursor: isDisabled ? 'default' : 'pointer',
        color: isDisabled ? theme.pageTextSubdued : theme.menuItemText,
        backgroundColor: isHighlighted
          ? theme.menuItemBackgroundHover
          : 'transparent',
      }}
    >
      <View
        style={{
          width: 80,
          flexShrink: 0,
          textAlign: 'right',
          marginRight: 8,
          color: theme.pageTextSubdued,
        }}
      >
        {prefix}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
        }}
      >
        {children}
      </View>
    </View>
  );
}

function parseSearchDate(text: string, dateFormat: string): Date | null {
  if (!/^\d{1,4}[/.-]\d{1,2}([/.-]\d{1,4})?$/.test(text)) {
    return null;
  }
  const formats = [dateFormat, dateFormat.replace('yyyy', 'yy'), 'yyyy-MM-dd'];
  for (const format of formats) {
    const date = parse(text, format, new Date());
    if (isValid(date) && date.getFullYear() > 1900) {
      return date;
    }
  }
  return null;
}
