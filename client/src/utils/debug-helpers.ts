/**
 * Utility functions for debugging and problem-solving in the application
 */

// Enhanced logging with color coding and type indicators
export const debugLog = (
  message: string, 
  data?: any, 
  type: 'info' | 'warning' | 'error' | 'success' = 'info'
) => {
  // Only log in development mode
  if (process.env.NODE_ENV !== 'development') return;
  
  const styles = {
    info: 'color: #3b82f6; font-weight: bold;',     // Blue
    warning: 'color: #f59e0b; font-weight: bold;',  // Orange/Amber
    error: 'color: #ef4444; font-weight: bold;',    // Red
    success: 'color: #22c55e; font-weight: bold;',  // Green
  };
  
  const prefix = `[${type.toUpperCase()}]`;
  
  if (data !== undefined) {
    console.log(`%c${prefix} ${message}`, styles[type], data);
  } else {
    console.log(`%c${prefix} ${message}`, styles[type]);
  }
};

// Check for multiple UI element references with the same ID
export const checkDuplicateIds = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const elementsWithIds = document.querySelectorAll('[id]');
  const ids: Record<string, number> = {};
  
  elementsWithIds.forEach(el => {
    const id = el.getAttribute('id') || '';
    ids[id] = (ids[id] || 0) + 1;
  });
  
  const duplicates = Object.entries(ids)
    .filter(([_, count]) => count > 1)
    .map(([id]) => id);
  
  if (duplicates.length > 0) {
    debugLog(`Found ${duplicates.length} duplicate IDs in the DOM:`, duplicates, 'warning');
  }
  
  return duplicates;
};

// Check for memory leaks - components that may cause memory issues
export const memoryCheck = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  // Check for large arrays/objects in local storage
  try {
    let totalSize = 0;
    const largeItems: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const value = localStorage.getItem(key);
      if (!value) continue;
      
      const size = new Blob([value]).size;
      totalSize += size;
      
      if (size > 50000) { // 50KB threshold
        largeItems.push(`${key}: ${(size / 1024).toFixed(2)}KB`);
      }
    }
    
    if (largeItems.length > 0) {
      debugLog(`Found ${largeItems.length} large items in localStorage (total: ${(totalSize / 1024).toFixed(2)}KB):`, largeItems, 'warning');
    }
  } catch (e) {
    debugLog('Error checking localStorage:', e, 'error');
  }
};

// Performance monitoring for specific components or functions
export interface PerfTimer {
  start: () => void;
  end: (label: string) => void;
}

export const createPerfTimer = (): PerfTimer => {
  let startTime = 0;
  
  return {
    start: () => {
      startTime = performance.now();
    },
    end: (label: string) => {
      if (process.env.NODE_ENV !== 'development') return;
      const duration = performance.now() - startTime;
      if (duration > 100) { // Only warn about operations taking more than 100ms
        debugLog(`Performance: ${label} took ${duration.toFixed(2)}ms`, null, 'warning');
      } else {
        debugLog(`Performance: ${label} took ${duration.toFixed(2)}ms`, null, 'info');
      }
    }
  };
};

// Inspect the state of drag and drop operations
export const logDragDropState = (
  event: React.DragEvent, 
  stage: 'start' | 'over' | 'drop' | 'end',
  elementInfo: string
) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  debugLog(`DragDrop [${stage}] on ${elementInfo}`, {
    x: event.clientX,
    y: event.clientY,
    dataTransfer: event.dataTransfer.getData('text/plain'),
    target: event.target
  });
};

// Helper to debug pointer events and event propagation
export const checkPointerEvents = (element: HTMLElement, label: string) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const computedStyle = window.getComputedStyle(element);
  const pointerEvents = computedStyle.getPropertyValue('pointer-events');
  const zIndex = computedStyle.getPropertyValue('z-index');
  const position = computedStyle.getPropertyValue('position');
  
  if (pointerEvents === 'none') {
    debugLog(`Element "${label}" has pointer-events: none and may not receive mouse events!`, {
      element,
      pointerEvents,
      zIndex,
      position
    }, 'warning');
  }
  
  return {
    pointerEvents,
    zIndex,
    position
  };
};

// Check if an element is properly visible and clickable
export const elementVisibilityCheck = (selector: string) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  const element = document.querySelector(selector);
  if (!element) {
    debugLog(`Element not found: ${selector}`, null, 'error');
    return null;
  }
  
  const rect = (element as HTMLElement).getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element as HTMLElement);
  
  const issues = [];
  
  // Check if element has zero size
  if (rect.width === 0 || rect.height === 0) {
    issues.push('Element has zero width or height');
  }
  
  // Check if element is outside viewport
  if (
    rect.bottom < 0 ||
    rect.top > window.innerHeight ||
    rect.right < 0 ||
    rect.left > window.innerWidth
  ) {
    issues.push('Element is outside viewport');
  }
  
  // Check visibility
  if (computedStyle.display === 'none') {
    issues.push('Element has display: none');
  }
  
  if (computedStyle.visibility === 'hidden') {
    issues.push('Element has visibility: hidden');
  }
  
  if (parseFloat(computedStyle.opacity) === 0) {
    issues.push('Element has opacity: 0');
  }
  
  // Check pointer events
  if (computedStyle.pointerEvents === 'none') {
    issues.push('Element has pointer-events: none');
  }
  
  if (issues.length > 0) {
    debugLog(`Visibility issues with ${selector}:`, issues, 'warning');
  } else {
    debugLog(`Element ${selector} is visible and should be interactive`, {
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    }, 'success');
  }
  
  return { element, issues, rect };
};

// Use this function when debugging KC30-A layout issues
export const debugKC30ALayout = (pallets: any[], elements: Record<string, HTMLElement>) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  debugLog('KC30-A Layout Debug Info:', {
    cargoAreaPallets: pallets.filter(p => p.location === "cargo").length,
    palletsByPosition: pallets
      .filter(p => p.location === "cargo")
      .map(p => `${p.positionLabel}: ${p.weight || 'no weight'} kg`)
  });
  
  // Check if important elements have pointer-events: none
  Object.entries(elements).forEach(([key, element]) => {
    checkPointerEvents(element, key);
  });
};