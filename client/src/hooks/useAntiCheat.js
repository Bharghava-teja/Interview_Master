import { useEffect, useRef, useState } from 'react';

export default function useAntiCheat({ onFirstWarning, onSecondInfraction }) {
  const infractionCountRef = useRef(0);
  const [warningVisible, setWarningVisible] = useState(false);

  useEffect(() => {
    const inc = (reason) => {
      infractionCountRef.current += 1;
      if (infractionCountRef.current === 1) {
        setWarningVisible(true);
        if (onFirstWarning) onFirstWarning(reason);
      } else if (infractionCountRef.current >= 2) {
        if (onSecondInfraction) onSecondInfraction(reason);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        inc('Exited fullscreen');
      }
    };

    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'C' || e.key === 'V')) {
        e.preventDefault();
        inc('Clipboard use');
      }
    };

    const handleBlur = () => inc('Window blur/tab switch');
    const handleVisibility = () => {
      if (document.hidden) inc('Tab hidden');
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      inc('Right click');
    };
    const handleSelectStart = () => {
      inc('Text selection');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('selectstart', handleSelectStart, true);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
    };
  }, [onFirstWarning, onSecondInfraction]);

  return {
    warningVisible,
    hideWarning: () => setWarningVisible(false),
    getCount: () => infractionCountRef.current,
  };
}


