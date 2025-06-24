import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Component to test and diagnose background color issues
 * Remove this after testing
 */
export function BackgroundTester() {
  const [appliedStyles, setAppliedStyles] = useState<string[]>([]);

  const testBackground = () => {
    const body = document.body;
    const html = document.documentElement;
    const results: string[] = [];

    // Check current computed styles
    const bodyStyles = window.getComputedStyle(body);
    const htmlStyles = window.getComputedStyle(html);
    
    results.push(`Body background: ${bodyStyles.backgroundColor}`);
    results.push(`Body background-image: ${bodyStyles.backgroundImage}`);
    results.push(`HTML background: ${htmlStyles.backgroundColor}`);
    
    // Force apply background
    body.style.setProperty('background-color', '#111827', 'important');
    body.style.setProperty('background-image', 'none', 'important');
    html.style.setProperty('background-color', '#111827', 'important');
    html.style.setProperty('background-image', 'none', 'important');
    
    results.push('Force applied: #111827');
    
    setAppliedStyles(results);
  };

  useEffect(() => {
    testBackground();
  }, []);

  return (
    <Card className="fixed top-4 right-4 p-4 z-50 max-w-sm bg-white border-2 border-red-500">
      <h3 className="font-bold mb-2 text-black">Background Tester</h3>
      <div className="text-xs text-black mb-2">
        {appliedStyles.map((style, i) => (
          <div key={i}>{style}</div>
        ))}
      </div>
      <Button onClick={testBackground} size="sm">
        Retest
      </Button>
    </Card>
  );
}