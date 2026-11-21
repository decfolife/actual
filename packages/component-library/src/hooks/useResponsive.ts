import { useWindowSize } from 'usehooks-ts';

import { breakpoints } from '#tokens';

export function useResponsive() {
  const { height, width } = useWindowSize({
    debounceDelay: 250,
  });

  // Possible view modes: narrow, small, medium, wide
  // To check if we're at least small width, check !isNarrowWidth
  return {
    // atLeastMediumWidth is provided to avoid checking (isMediumWidth || isWideWidth)
    atLeastMediumWidth: width >= breakpoints.medium,
    // This fork has no separate phone UI: the YNAB layout is used at every
    // width, so the narrow (Actual mobile) layout is never selected.
    isNarrowWidth: false,
    isSmallWidth: width < breakpoints.medium,
    isMediumWidth: width >= breakpoints.medium && width < breakpoints.wide,
    // No atLeastWideWidth because that's identical to isWideWidth
    isWideWidth: width >= breakpoints.wide,
    height,
    width,
  };
}
