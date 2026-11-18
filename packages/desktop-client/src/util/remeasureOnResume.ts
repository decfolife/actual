// iOS can resize an installed app while it's in the app switcher (to the
// card's narrow size) and not send a resize event when it comes back, so
// the app would stay in its phone layout. When the app is shown again (or
// rotated), re-send the resize event a few times so everything measuring
// the window (e.g. `useResponsive`, which debounces) sees the real size.

const DELAYS_MS = [0, 300, 800];

function remeasure() {
  for (const delay of DELAYS_MS) {
    setTimeout(() => window.dispatchEvent(new Event('resize')), delay);
  }
}

export function remeasureOnResume() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      remeasure();
    }
  });
  window.addEventListener('pageshow', remeasure);
  window.addEventListener('focus', remeasure);
  window.addEventListener('orientationchange', remeasure);
}
