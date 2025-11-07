import { useEffect, useState } from 'react';

/**
 * Hook to detect if the browser window is visible and focused
 * @returns { isVisible: boolean, isFocused: boolean }
 */
export function useWindowVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [isFocused, setIsFocused] = useState(document.hasFocus());

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return { isVisible, isFocused, isVisibleAndFocused: isVisible && isFocused };
}
