/**
 * BACKGROUND HELPER UTILITY
 * Provides programmatic background control for reliable styling
 */

export type BackgroundColor = 
  | 'gray-900' 
  | 'gray-800' 
  | 'gray-700' 
  | 'slate-100' 
  | 'white'

export const BACKGROUND_COLORS = {
  'gray-900': '#111827',
  'gray-800': '#1f2937', 
  'gray-700': '#374151',
  'slate-100': '#f1f5f9',
  'white': '#ffffff'
} as const

/**
 * Apply background color with maximum specificity
 * Use this when CSS classes aren't working
 */
export function forceBackgroundColor(element: HTMLElement, color: BackgroundColor) {
  const colorValue = BACKGROUND_COLORS[color]
  
  // Apply multiple properties to ensure override
  element.style.setProperty('background-color', colorValue, 'important')
  element.style.setProperty('background-image', 'none', 'important')
  element.style.setProperty('background', colorValue, 'important')
  
  // Add utility class as backup
  element.classList.add(`bg-force-${color}`)
}

/**
 * Apply background to page root
 * Call this in useEffect for pages that need specific backgrounds
 */
export function setPageBackground(color: BackgroundColor) {
  const body = document.body
  const html = document.documentElement
  
  [body, html].forEach(element => {
    forceBackgroundColor(element, color)
  })
}

/**
 * Reset background to default
 */
export function resetPageBackground() {
  const body = document.body
  const html = document.documentElement
  
  [body, html].forEach(element => {
    element.style.removeProperty('background-color')
    element.style.removeProperty('background-image') 
    element.style.removeProperty('background')
    
    // Remove force classes
    Object.keys(BACKGROUND_COLORS).forEach(color => {
      element.classList.remove(`bg-force-${color}`)
    })
  })
}

/**
 * Get CSS class names for reliable background application
 */
export function getBackgroundClasses(color: BackgroundColor, type: 'page' | 'component' = 'component') {
  const baseClasses = `bg-force-${color} no-gradient`
  
  if (type === 'page') {
    return `${baseClasses} ${color === 'gray-900' ? 'dark-page-background' : 'light-page-background'} page-training-module`
  }
  
  return baseClasses
}