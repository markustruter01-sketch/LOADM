import { useEffect } from 'react';
import { BackgroundColor, setPageBackground, resetPageBackground } from '@/utils/background-helper';

/**
 * Hook to reliably set page background color
 * Automatically cleans up on component unmount
 */
export function usePageBackground(color: BackgroundColor) {
  useEffect(() => {
    setPageBackground(color);
    
    return () => {
      resetPageBackground();
    };
  }, [color]);
}

/**
 * Hook to force background color with emergency override
 * Use this when standard methods fail
 */
export function useForcePageBackground(color: BackgroundColor) {
  useEffect(() => {
    const applyBackground = () => {
      setPageBackground(color);
      
      // Additional DOM manipulation for stubborn cases
      const body = document.body;
      const html = document.documentElement;
      
      [body, html].forEach(element => {
        element.classList.add('emergency-bg-override');
        element.style.setProperty('background-color', color === 'gray-900' ? '#111827' : '#f1f5f9', 'important');
      });
    };
    
    applyBackground();
    
    // Reapply after a short delay to catch any late-loading styles
    const timeoutId = setTimeout(applyBackground, 100);
    
    return () => {
      clearTimeout(timeoutId);
      resetPageBackground();
      
      document.body.classList.remove('emergency-bg-override');
      document.documentElement.classList.remove('emergency-bg-override');
    };
  }, [color]);
}