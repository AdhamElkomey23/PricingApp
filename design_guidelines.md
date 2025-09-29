# Egypt Itinerary Operations App - Design Guidelines

## Design Approach: Material Design System
**Justification**: This utility-focused business application requires efficiency, consistency, and professional polish. Material Design provides excellent form controls, data visualization components, and clear hierarchy patterns essential for operations teams.

## Core Design Principles
- **Operational Clarity**: Every element serves the business workflow
- **Professional Polish**: Clean, trustworthy interface for client-facing quotations  
- **Efficient Navigation**: Streamlined step-by-step process with clear progress indication
- **Data Transparency**: All calculations and business rules clearly visible and auditable

## Color Palette

**Primary Colors**:
- Light Mode: 210 100% 50% (Professional blue for trust and efficiency)
- Dark Mode: 210 80% 60% (Softer blue for reduced eye strain)

**Background & Surfaces**:
- Light Mode: Neutral grays (0 0% 98% backgrounds, 0 0% 100% cards)
- Dark Mode: Cool dark grays (210 15% 8% backgrounds, 210 12% 12% cards)

**Accent Colors** (minimal usage):
- Success: 140 60% 45% (for completed steps, included services)
- Warning: 35 90% 55% (for missing information, validation alerts)
- Error: 0 70% 50% (for critical issues, excluded services)

## Typography
**Font Family**: Inter (Google Fonts) - excellent readability for data-heavy interfaces
- **Headings**: 600 weight for section headers
- **Body**: 400 weight for content, 500 weight for emphasis
- **Data/Numbers**: 500 weight for pricing, quantities, totals
- **Captions**: 400 weight, smaller size for service reasons and notes

## Layout System
**Tailwind Spacing**: Consistent use of 2, 4, 6, 8, 12, 16 units
- Tight spacing (p-2, m-2) for data tables and compact lists
- Standard spacing (p-4, gap-4) for form elements and cards  
- Generous spacing (p-8, mb-12) for section separation and visual breathing room

## Component Library

**Navigation & Progress**:
- Horizontal stepper showing: Input → Breakdown → Pricing → Export
- Breadcrumb navigation for complex multi-step flows
- Progress indicators with clear completion states

**Forms & Input**:
- Material Design text fields with floating labels
- Number inputs with clear increment/decrement controls
- Large textarea for itinerary input with syntax highlighting
- Toggle switches for include/exclude service options
- Dropdown selectors for currencies, profiles, and settings

**Data Display**:
- Service cards with clear hierarchy: Service name (bold) → Reason (muted) → Quantity/Price
- Expandable daily breakdown cards with Per-Group first, then Per-Person sections
- Pricing tables with clear subtotals and grand totals
- Sticky pricing summary panel for constant visibility

**Business-Specific Components**:
- Service classification badges (Airport, Hotel, Tour, etc.)
- Pricing profile switcher (Base → +Tickets → +Tickets+Lunch)
- Currency converter with editable exchange rates
- Tax and markup adjustment controls with real-time updates

**Actions & CTAs**:
- Primary buttons for main workflow actions (Process Itinerary, Generate Quote)
- Secondary buttons for supporting actions (Edit, Override, Export)
- Icon buttons for inline actions (include/exclude toggles, quick edits)

## Data Visualization
- Clean pricing breakdowns with visual separation between categories
- Daily mini-totals with progressive disclosure
- Clear visual distinction between included/excluded services
- Highlight calculated fields vs. user-editable overrides

## Professional Polish
- Subtle shadows for card elevation following Material Design principles
- Consistent rounded corners (6px) for modern feel while maintaining professionalism
- Smooth transitions for state changes and data updates
- Loading states for parsing and calculation processes

## Responsive Behavior
- Desktop-first design optimized for operations teams
- Tablet adaptation with collapsible sidebar for pricing summary
- Mobile view prioritizes essential workflow steps with simplified data display

## Accessibility & Usability
- High contrast ratios for financial data readability
- Clear focus indicators for keyboard navigation
- Screen reader support for complex pricing calculations
- Consistent dark mode implementation across all components including form inputs

This design approach prioritizes operational efficiency while maintaining the professional polish required for client-facing quotation exports.