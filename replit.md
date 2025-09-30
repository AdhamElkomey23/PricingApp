# Egypt Itinerary Operations App

## Overview

The Egypt Itinerary Operations App is a professional web application designed to transform free-text Egypt travel itineraries into structured operational breakdowns and detailed pricing quotations. The system intelligently parses itinerary text, detects services across multiple categories (accommodation, transportation, tours, meals, etc.), and generates comprehensive pricing with configurable markup, tax, and package options. Built for travel operations teams, it streamlines the quotation process from input to export-ready documents.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (September 30, 2025)

**Database Schema Update for Alexandria Format:**
- Updated prices table schema to match Alexandria CSV format
- New fields: route_name, cost_basis, unit, notes, vehicle_type, passenger_capacity
- Removed old fields: description, unit_type
- CSV format now accepts: "Service Name, Category, Route Name, Cost Basis, Unit, Base Cost, Notes, Vehicle Type, Passenger Capacity"
- Base Cost parsing: Automatically extracts price and currency from formats like "20 €" or "45 $"
- Location auto-detection: Extracts city/region from service name or route name (Alexandria, Cairo, Luxor, Aswan, etc.)
- Default currency changed from USD to EUR to match Alexandria pricing

**Database Simplification:**
- Removed complex multi-table pricing structure (service_categories, service_items, pricing_rates, tours, tour_versions, tour_services, excel_uploads)
- Implemented streamlined 4-table schema: users, prices, quotations, csv_uploads
- Added CSV file upload functionality for automatic price import instead of manual entry
- Users can now upload CSV files to bulk-add pricing data to the database
- CSV validation ensures data quality with Zod schema validation

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing
- **TanStack Query (React Query)** for server state management and data fetching
- **React Hook Form** with Zod validation for form handling
- **Shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for utility-first styling with Material Design principles

**Design System:**
- Material Design approach chosen for professional polish and operational clarity
- Custom color palette: Professional blue primary (210 100% 50% light, 210 80% 60% dark)
- Typography: Inter font family for data-heavy interfaces
- Consistent spacing system using Tailwind units (2, 4, 6, 8, 12, 16)
- Theme support (light/dark mode) via next-themes

**Component Architecture:**
- Modular component structure with separated concerns:
  - **Core workflow components:** ItineraryInputForm, DailyBreakdownCard, PricingConfigPanel, PricingSummaryPanel
  - **Service-level components:** ServiceCard for granular service editing
  - **Layout components:** AppHeader with stepper navigation
  - **Shared UI components:** Extensive Shadcn/ui library (40+ components)

**State Management Strategy:**
- React Hook Form for local form state with Zod schema validation
- TanStack Query for server data fetching, caching, and synchronization
- Component-level useState for UI interactions (expand/collapse, editing modes)
- Props drilling for parent-child communication (quotation workflow)

**Routing Structure:**
- `/` - HomePage: Dashboard with navigation cards
- `/database` - DatabasePage: CSV upload interface and pricing data management
  - CSV Upload tab: File upload, sample template download, upload history
  - View Prices tab: Browse all prices with search and filter capabilities
- `/tours` - ToursPage: List view of saved quotations
- `/new` - NewTourPage: Main quotation workflow (input → breakdown → pricing → export)

### Backend Architecture

**Technology Stack:**
- **Express.js** server with TypeScript
- **Drizzle ORM** for type-safe database queries
- **Neon Serverless PostgreSQL** as the database (with WebSocket support)
- **Multer** for CSV file upload handling
- **csv-parse** for parsing uploaded pricing data
- **Connect-pg-simple** for session management

**API Design:**
- RESTful endpoints under `/api` prefix
- Error handling middleware with standardized JSON responses
- Request/response logging for debugging
- File upload support with size limits (10MB) and validation

**Data Models (Simplified):**
- **Users:** Basic user authentication structure
- **Prices:** Simple pricing table with all service pricing data
  - Fields: service_name, category, description, unit_type, unit_price, currency, location, is_active
  - Unit types: per_person, per_group, per_night, per_day, flat_rate
  - No complex relationships or versioning - single source of truth
- **Quotations:** Saved itinerary breakdowns and pricing calculations (JSONB storage)
  - Stores: itinerary input, parsed breakdown, pricing config, totals
- **CSV Uploads:** Audit trail for CSV file imports
  - Tracks: filename, upload status, processing results, error logs
  - Statuses: pending → processing → completed/failed

**Business Logic:**
- Service detection engine: Parses free-text itineraries to identify:
  - Accommodation (hotels, Dahabiya, Nile cruises)
  - Transportation (airport transfers, train stations, day tours)
  - Meals and entrance fees
  - City/region detection (CAI, LXR, ASW, ABS, HRG, SSH)
- Pricing calculation engine:
  - Configurable profiles: Base, +Tickets, +Tickets+Lunch
  - Tax and markup application
  - Rounding to specified increments
  - Per-person and per-group totals
  - Daily breakdown aggregation

### Database Design

**Schema Management:**
- Drizzle ORM with schema-first approach
- Migration system via drizzle-kit
- Type generation from schema for end-to-end type safety

**Tables (Simplified Schema):**
- `users` - Authentication and user profiles
- `prices` - Simplified pricing data (no complex relationships)
  - Direct service pricing with optional category, location filtering
  - Bulk import via CSV upload
- `quotations` - Complete quotation records with JSONB for flexible data storage
- `csv_uploads` - CSV upload history and processing status
  - Automatic validation and error reporting

**Indexing Strategy:**
- Active prices filtered by `is_active` boolean
- Location and service name for quick price lookups
- User ID for quotation ownership queries

### External Dependencies

**Core Infrastructure:**
- **Neon Database:** Serverless PostgreSQL with WebSocket support for real-time connections
- **Replit Platform:** Development environment with custom plugins (cartographer, dev-banner, runtime error overlay)

**UI Component Libraries:**
- **Radix UI:** 20+ primitive components for accessible UI (accordion, dialog, dropdown, popover, select, tabs, toast, etc.)
- **Lucide React:** Icon library for consistent iconography

**Data Processing:**
- **csv-parse:** CSV file parsing for bulk pricing imports
- **date-fns:** Date manipulation and formatting

**Developer Tools:**
- **TypeScript:** Type safety across full stack
- **ESBuild:** Fast production bundling
- **Zod:** Runtime schema validation and type inference
- **class-variance-authority:** Type-safe variant styling
- **clsx + tailwind-merge:** Conditional CSS class composition

**Form & Validation:**
- **React Hook Form:** Performant form state management
- **@hookform/resolvers:** Zod integration for form validation

**Build & Development:**
- **Vite:** Fast HMR and optimized production builds
- **PostCSS + Autoprefixer:** CSS processing pipeline
- **Tailwind CSS:** Utility-first styling framework