# Military Logistics Training Platform - Design Guidelines
## Mission Management Section

## Design Approach
**System-Based with Military Precision**: Drawing from Carbon Design System (enterprise data-heavy applications) and Fluent Design principles, adapted for military context. Focus: hierarchical clarity, information density without clutter, operational efficiency.

---

## Typography System

**Primary Font**: Inter or IBM Plex Sans (military-grade clarity)
- **Mission Headers**: 24px, font-weight 600, tracking -0.02em
- **Section Titles**: 18px, font-weight 600, uppercase, tracking 0.05em
- **Form Labels**: 13px, font-weight 500, uppercase, tracking 0.08em
- **Input Text**: 15px, font-weight 400
- **Table Headers**: 12px, font-weight 600, uppercase, tracking 0.1em
- **Table Data**: 14px, font-weight 400, tabular-nums (for numerical consistency)
- **Dialog Titles**: 20px, font-weight 600
- **Helper Text**: 13px, font-weight 400, reduced opacity

---

## Spacing System
**Core Units**: Tailwind 2, 4, 6, 8, 12 units (0.5rem increments)
- Form field vertical spacing: `space-y-6`
- Section padding: `p-8` (desktop), `p-6` (mobile)
- Card/Panel padding: `p-6`
- Table cell padding: `px-4 py-3`
- Modal content padding: `p-8`
- Button padding: `px-6 py-3` (primary), `px-4 py-2` (secondary)

---

## Layout Architecture

### Mission Form Structure
**Two-Column Grid Layout** (desktop):
- Left column (60%): Primary mission details, aircraft selection, load configuration
- Right column (40%): Mission summary card, validation checklist, quick actions
- Mobile: Stack to single column with summary card sticky at bottom

**Form Field Organization**:
- Group related fields in bordered panels with subtle backgrounds
- Each panel has section header with icon (aircraft, cargo, timeline, personnel)
- Required fields marked with orange indicator (not asterisk - use badge/dot)
- Critical fields (mission ID, aircraft type, departure time) get prominent treatment with increased size/weight

### Data Tables
**Dense Information Layout**:
- Fixed header with shadow on scroll
- Alternating row treatment for scan-ability
- Minimum column widths defined per data type
- Action column always right-aligned, width 120px minimum
- Row height: 52px (comfortable for touch/click targets)
- Include expandable rows for detailed mission data
- Sticky columns for mission ID and status on horizontal scroll

**Column Hierarchy**:
1. Status indicator (icon + badge) - 80px
2. Mission ID - 120px, monospace
3. Aircraft Type - 140px
4. Departure/Arrival - 180px each
5. Cargo Weight - 100px, right-aligned
6. Actions - 120px

### Modal Dialogs
**Three-Tier Dialog System**:

1. **Small Dialogs** (480px): Confirmations, quick actions
   - Single focused message
   - Two-button footer (cancel left, action right)
   
2. **Medium Dialogs** (720px): Form edits, mission adjustments
   - Header with title and close button
   - Scrollable content area
   - Sticky footer with actions
   
3. **Large Dialogs** (960px): Mission creation, comprehensive planning
   - Multi-step wizard layout
   - Progress indicator at top
   - Navigation between steps
   - Validation summary before submission

**Dialog Backdrop**: Deep overlay with backdrop-blur for forms over tables

---

## Component Specifications

### Input Fields
- **Height**: 44px (touch-friendly)
- **Border**: 2px solid, increased to 3px on focus
- **Corner Radius**: 4px (sharp, military precision)
- **Label Position**: Above input with 8px gap
- **Error States**: Red left border (4px), error icon right-aligned, message below
- **Success States**: Green left border (4px), checkmark icon
- **Disabled**: Reduced opacity (0.4), cursor not-allowed

### Select Dropdowns
- Match input height (44px)
- Chevron icon right-aligned with 12px margin
- Dropdown panel: max-height 320px, scrollable
- Options: 40px height, hover highlight
- Multi-select: Show selected count badge, expandable chips

### Buttons
**Primary (Mission Actions)**:
- Height: 44px
- Border radius: 4px
- Font: 14px, font-weight 600, uppercase, tracking 0.05em
- Icon left-aligned when present, 16px with 8px gap
- Loading state: Spinner replaces icon, text remains

**Secondary (Cancel/Auxiliary)**:
- Transparent background, bordered
- Same dimensions as primary
- Hover: Subtle background fill

**Icon Buttons** (table actions):
- 36px × 36px
- Circular (rounded-full)
- Icon 20px
- Tooltip on hover

### Cards & Panels
- Border radius: 6px
- Subtle border (1px)
- Shadow: none (flat military aesthetic)
- Hover state for interactive cards: brightness increase, not shadow
- Header section with bottom border separator

### Status Indicators
**Badge System**:
- Pill-shaped (rounded-full)
- Height: 24px
- Padding: px-3
- Font: 11px, font-weight 600, uppercase
- States: Active, Pending, Completed, Cancelled, Critical
- Include dot indicator (8px circle) before text

### Data Visualization
**Mission Summary Cards**:
- Large metric display: 32px, font-weight 700
- Label below: 13px, uppercase, reduced opacity
- Icon 24px above metric
- 4-column grid on desktop, 2-column on tablet, stacked on mobile

**Progress Indicators**:
- Linear bars: 8px height, rounded ends
- Include percentage text right-aligned
- Segmented for multi-phase missions

---

## Navigation & Hierarchy

### Page Header
- Height: 72px
- Breadcrumb navigation (top-left)
- Page title (large, 28px)
- Primary action button (top-right)
- Tab navigation below if multiple views

### Section Headers
- Divider line above and below
- Icon + title + action button grouped
- Collapsible sections with chevron indicator

---

## Interaction Patterns

### Form Validation
- Real-time validation on blur (not on typing)
- Inline error messages appear below field
- Summary error box at top of form for multiple errors
- Prevent submission with visual shake animation + error focus

### Table Interactions
- Row hover: Brightness increase
- Row selection: Checkbox left column, visual highlight
- Bulk actions toolbar appears on selection
- Sort indicators: Arrows in header, active state highlighted
- Filter dropdowns: Inline above table, collapsible panel

### Loading States
- Skeleton screens for tables (pulse animation)
- Spinner overlay for form submissions (modal blocks interaction)
- Progressive loading: Header first, then data rows

---

## Images

**No hero images required** - this is an application interface, not a marketing page. Focus on functional clarity and data presentation.

**Icon Usage**:
- Use Font Awesome (military/tactical icon set) via CDN
- Consistent 20px size for form section icons
- 16px for inline icons
- 24px for card/panel headers
- Always maintain icon-text alignment

---

## Accessibility Standards
- Minimum contrast ratio: 4.5:1 for all text
- Focus indicators: 3px offset outline
- Keyboard navigation: Logical tab order through forms
- ARIA labels for all icon buttons
- Screen reader announcements for loading states and errors
- Form field associations with labels (explicit for/id)