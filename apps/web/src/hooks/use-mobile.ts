import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

const isSmallScreen = () => window.innerWidth < MOBILE_BREAKPOINT;

export function useIsMobile() {
  // Read at once: the app shell and the desktop layout must not swap on load
  const [isMobile, setIsMobile] = React.useState(isSmallScreen);

  React.useEffect(() => {
    const mql = window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    if (!mql) return;
    const onChange = () => setIsMobile(isSmallScreen());
    mql.addEventListener('change', onChange);
    onChange();
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
