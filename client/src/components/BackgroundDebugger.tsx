import { useEffect, useState } from 'react';

/**
 * Debug component to understand background color issues
 * This will help us identify why backgrounds aren't updating
 */
export function BackgroundDebugger() {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const body = document.body;
      const html = document.documentElement;
      const bodyStyles = window.getComputedStyle(body);
      const htmlStyles = window.getComputedStyle(html);
      
      const info = [
        `Body BG: ${bodyStyles.backgroundColor}`,
        `Body BG-Image: ${bodyStyles.backgroundImage}`,
        `HTML BG: ${htmlStyles.backgroundColor}`,
        `Applied Classes: ${body.className.split(' ').slice(0, 3).join(', ')}`,
        `Time: ${new Date().toLocaleTimeString()}`
      ];
      
      setDebugInfo(info);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Apply background every second as a brute force approach
  useEffect(() => {
    const forceBackground = () => {
      const body = document.body;
      const html = document.documentElement;
      
      [body, html].forEach(element => {
        element.style.setProperty('background-color', '#111827', 'important');
        element.style.setProperty('background-image', 'none', 'important');
        element.style.setProperty('background', '#111827', 'important');
        element.classList.add('bg-force-gray-900');
      });
    };

    forceBackground();
    const interval = setInterval(forceBackground, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-2 right-2 z-50 bg-red-500 text-white p-2 text-xs rounded shadow-lg max-w-xs">
      <div className="font-bold mb-1">BG Debug</div>
      {debugInfo.map((info, i) => (
        <div key={i} className="truncate">{info}</div>
      ))}
    </div>
  );
}