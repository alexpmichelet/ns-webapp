# Time & Materials Project Management System - Architecture

## Project Overview

A comprehensive Time & Materials workflow management application built with Next.js 15, Payload CMS v3, Better Auth, and PostgreSQL (Supabase).

**Primary Use Case:** Streamline project management between agencies and clients with transparent time tracking, estimation workflows, and automated billing cycles.

---

## Technology Stack

### Core Framework
- **Next.js 15.4.4** - App Router with React 19.1.0
- **TypeScript 5.7.3** - Strict mode enabled
- **Tailwind CSS 4.1.15** - Utility-first styling

### Backend & Data
- **Payload CMS 3.60.0** - Headless CMS and API layer
- **PostgreSQL** - Via Supabase (with Drizzle ORM)
- **Better Auth 1.3.28** - Authentication system
- **payload-auth 1.6.5** - Better Auth + Payload integration

### UI Components
- **shadcn/ui** - 53+ pre-built atomic components
- **Radix UI** - Accessible component primitives
- **Framer Motion 12.23.24** - Animations
- **lucide-react** - Icon system
- **dnd-kit** - Drag and drop (for Kanban)

### State & Data Fetching
- **TanStack React Query 5.90.5** - Server state management
- **Zustand 5.0.8** - Client state management
- **React Hook Form 7.65.0** - Form handling
- **Zod 4.1.12** - Schema validation

### Future Integrations
- **Stripe** - Payment processing (configured, not yet implemented)
- **React Email + Resend** - Email notifications
- **Slack** - Webhook notifications (planned)

---

## System Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
├─────────────────────────────────────────────────────────────┤
│  Frontend Routes          │  Backend Routes                  │
│  (frontend)               │  (payload)                       │
│  ├─ Dashboard             │  ├─ Admin Panel                  │
│  ├─ Kanban Board          │  ├─ REST API                     │
│  ├─ Invoices              │  ├─ GraphQL API                  │
│  ├─ Settings              │  └─ Auth Routes                  │
│  └─ Auth Pages            │                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Payload CMS Layer                       │
│  ├─ Collections (Tickets, TimeLogs, Invoices, Users)        │
│  ├─ Access Control (Role-based permissions)                 │
│  ├─ Hooks (Business logic, validation)                      │
│  └─ Server Actions (CRUD operations)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database (Supabase)              │
│  ├─ Tables (tickets, time_logs, invoices, users)            │
│  ├─ Row Level Security (RLS policies)                       │
│  └─ Real-time Subscriptions                                 │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
ns-webapp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (frontend)/               # User-facing routes
│   │   │   ├── (auth)/               # Auth pages
│   │   │   │   ├── sign-in/
│   │   │   │   └── sign-up/
│   │   │   ├── dashboard/            # [TO BUILD] Main dashboard
│   │   │   ├── kanban/               # [TO BUILD] Kanban board
│   │   │   ├── invoices/             # [TO BUILD] Invoice management
│   │   │   ├── settings/             # [TO BUILD] User settings
│   │   │   └── api/auth/[...all]/    # Better Auth API routes
│   │   └── (payload)/                # Payload CMS routes
│   │       ├── admin/                # CMS admin panel
│   │       └── api/                  # REST & GraphQL APIs
│   │
│   ├── collections/                  # Payload CMS collections
│   │   ├── Users.ts                  # User collection (existing)
│   │   ├── Media.ts                  # Media collection (existing)
│   │   ├── Tickets.ts                # [TO BUILD] Ticket collection
│   │   ├── TimeLogs.ts               # [TO BUILD] Time log collection
│   │   └── Invoices.ts               # [TO BUILD] Invoice collection
│   │
│   ├── components/                   # React components
│   │   ├── atoms/                    # Shadcn/ui components (53 existing)
│   │   │   ├── sidebar.tsx           # ✓ Full sidebar system
│   │   │   ├── card.tsx              # ✓ Card components
│   │   │   ├── button.tsx            # ✓ Button component
│   │   │   └── ...                   # 50+ more components
│   │   ├── ui/shadcn-io/
│   │   │   └── kanban/               # ✓ Complete Kanban system
│   │   └── molecules/                # [TO BUILD] Composite components
│   │       ├── auth/                 # Login/signup forms
│   │       ├── tickets/              # Ticket cards, forms
│   │       ├── invoices/             # Invoice components
│   │       └── dashboard/            # Dashboard widgets
│   │
│   ├── lib/
│   │   ├── auth/                     # Authentication
│   │   │   ├── server.ts             # ✓ Server-side auth helpers
│   │   │   └── client.ts             # ✓ Client-side auth hooks
│   │   ├── data/                     # Data layer
│   │   │   ├── payload/              # ✓ 24+ server actions + hooks
│   │   │   └── stripe/               # [TO BUILD] Payment logic
│   │   ├── utils.ts                  # ✓ Utility functions (cn)
│   │   └── types/                    # Type definitions
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-mobile.ts             # ✓ Responsive detection
│   │   ├── use-tickets.ts            # [TO BUILD] Ticket management
│   │   ├── use-time-logs.ts          # [TO BUILD] Time tracking
│   │   └── use-invoices.ts           # [TO BUILD] Invoice management
│   │
│   ├── migrations/                   # Database migrations
│   └── payload.config.ts             # ✓ Payload CMS configuration
│
├── supabase/                         # Supabase configuration
│   ├── config.toml
│   └── migrations/                   # SQL migrations
│
├── docs/                             # Project documentation
│   ├── PROJECT_ARCHITECTURE.md       # This file
│   ├── IMPLEMENTATION_PLAN.md        # [TO CREATE] Phase-by-phase plan
│   ├── DATA_MODELS.md                # [TO CREATE] Database schemas
│   ├── WORKFLOW_LOGIC.md             # [TO CREATE] Business rules
│   └── API_REFERENCE.md              # [TO CREATE] API documentation
│
└── .claude/                          # Claude Code configuration
    └── commands/                     # Custom slash commands
```

---

## Core Data Models

### Collections Overview

#### 1. Users Collection (Existing - To Extend)
- **Purpose:** User authentication and profile management
- **Extensions Needed:**
  - `role` field: 'client' | 'agency'
  - `hourlyRate` field: number (for agency users)
  - `organization` field: relation to organization
  - `isActive` field: boolean (for payment suspension)

#### 2. Tickets Collection (To Build)
- **Purpose:** Feature requests and task management
- **Key Fields:**
  - Status workflow (7 states)
  - Priority levels (4 levels)
  - Time tracking (estimated vs actual)
  - Revision tracking (max 3)
  - Parent/child relationships

#### 3. TimeLogs Collection (To Build)
- **Purpose:** Granular time tracking for billing
- **Key Fields:**
  - Ticket reference
  - User reference
  - Hours worked
  - Work description
  - Date/timestamp

#### 4. Invoices Collection (To Build)
- **Purpose:** Billing cycle management
- **Key Fields:**
  - Billing period
  - Associated tickets
  - Total hours/amount
  - Payment status
  - Due dates

**Detailed schemas documented in:** [docs/DATA_MODELS.md](./DATA_MODELS.md)

---

## Authentication & Authorization

### Better Auth Integration

**Current Setup:**
- Better Auth configured with Payload CMS via `payload-auth` plugin
- Server-side helpers: `getServerSidePayloadAuth()`
- Client hooks: `useSession()`, `signIn()`, `signUp()`, `signOut()`
- API routes: `/api/auth/[...all]`

**Implementation Requirements:**
1. Enable email/password authentication (simple, no email verification)
2. Add user role assignment during signup
3. Implement role-based access control (RBAC)
4. Configure session management

### Role-Based Access Control (RBAC)

#### Client Role
**Permissions:**
- Create tickets
- View own tickets
- Approve/reject estimates
- Test completed features
- Accept/request revisions
- Reorder ticket priorities (non-started tickets only)
- View invoices

**Restrictions:**
- Cannot edit time logs
- Cannot move tickets between development states
- Cannot access other clients' data

#### Agency Role
**Permissions:**
- View all tickets
- Provide estimates
- Move tickets through workflow states
- Log time on tickets
- Generate invoices
- View billing reports

**Restrictions:**
- Cannot create tickets for clients
- Cannot approve own estimates

---

## Workflow State Machine

### Ticket Lifecycle

```
┌─────────────────┐
│  To Estimate    │ ← Client creates ticket
└────────┬────────┘
         │ Agency provides estimate (1 business day SLA)
         ↓
┌─────────────────┐
│ Needs Client    │
│    Review       │
└────────┬────────┘
         │ Client approves/revises/cancels
         ├─ Cancel → [Archived]
         ├─ Revise → Back to "To Estimate"
         └─ Approve ↓
                    │
         ┌──────────┴──────────┐
         │  Ready to Develop   │
         └──────────┬──────────┘
                    │ Agency starts work
                    ↓
         ┌──────────────────────┐
         │ Development in       │
         │    Progress          │
         └──────────┬───────────┘
                    │ Agency completes + internal test
                    ↓
         ┌──────────────────────┐
         │  Ready to Test       │ ← 5 business day timer starts
         └──────────┬───────────┘
                    │
         ├─ Client accepts → Done
         ├─ Client requests revision (max 3) → Back to "Development in Progress"
         └─ 5 days no action → Auto-move to "Done"
                    ↓
         ┌──────────────────────┐
         │       Done           │ ← Ready for billing
         └──────────┬───────────┘
                    │ Invoice generated & paid
                    ↓
         ┌──────────────────────┐
         │   Paid & Closed      │ ← Archived
         └──────────────────────┘
```

**Business Rules:**
- Auto-approval after 5 business days in "Ready to Test"
- Maximum 3 revisions per ticket
- Time tracking required in "Development in Progress" and "Ready to Test"
- Payment suspension if invoice overdue > 5 business days

---

## Component Architecture

### Atomic Design Pattern

#### Atoms (53 existing components)
Pre-built shadcn/ui components including:
- Form controls: Button, Input, Textarea, Checkbox, Select, etc.
- Layout: Card, Separator, Accordion, Tabs, etc.
- Feedback: Alert, Dialog, Toast, Spinner, etc.
- Navigation: Sidebar (full system), Breadcrumb, Pagination, etc.
- Data display: Table, Badge, Avatar, etc.

#### Molecules (To Build)
Composite components combining atoms:
- `TicketCard` - Kanban card with ticket details
- `TicketForm` - Create/edit ticket form
- `TimeLogForm` - Log hours on ticket
- `EstimationForm` - Agency estimation interface
- `InvoiceCard` - Invoice summary card
- `DashboardWidget` - Reusable dashboard components
- `PriorityBadge` - Visual priority indicator
- `StatusBadge` - Ticket status display

#### Organisms (To Build)
Complex sections:
- `KanbanBoard` - Full drag-drop board (uses existing Kanban atoms)
- `TicketDetailPanel` - Comprehensive ticket view
- `InvoiceTable` - Billing cycle overview
- `DashboardLayout` - Main app layout with sidebar

### Existing Component Systems

#### Sidebar System (Complete)
Located: [src/components/atoms/sidebar.tsx](../src/components/atoms/sidebar.tsx)

**Features:**
- Full responsive sidebar with mobile support
- Collapsible modes: offcanvas, icon, none
- Cookie-based state persistence
- Keyboard shortcuts (Cmd/Ctrl+B)
- Context API with `useSidebar()` hook
- Components: SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarTrigger

**Usage in App:**
- Wrap app with `SidebarProvider`
- Add navigation items: Dashboard, Kanban Board, Invoices, Settings
- Include user profile in footer
- Add role-specific menu items

#### Kanban System (Complete)
Located: [src/components/ui/shadcn-io/kanban/index.tsx](../src/components/ui/shadcn-io/kanban/index.tsx)

**Features:**
- Built on dnd-kit library
- Drag-and-drop cards between columns
- Context-based active card tracking
- Accessibility announcements
- Portal-based drag overlay

**Usage in App:**
- 7 columns for ticket states
- Ticket cards as draggable items
- State transitions on drop
- Real-time updates via React Query

---

## Data Layer Architecture

### Payload Server Actions

**Existing Infrastructure:** [src/lib/data/payload/index.ts](../src/lib/data/payload/index.ts)

**24+ Pre-built Actions:**
- `payloadAction.create()` - Create new document
- `payloadAction.update()` - Update document
- `payloadAction.delete()` - Delete document
- `payloadAction.find()` - Query documents
- `payloadAction.findByID()` - Get single document
- `payloadAction.count()` - Count documents
- Auth actions: login, logout, forgotPassword, resetPassword, verifyEmail

**React Query Hooks:**
- `payloadHook.create()` - Mutation hook for create
- `payloadHook.find()` - Query hook for find
- `payloadHook.update()` - Mutation hook for update
- Auto-generated for all server actions

**Custom Actions Needed:**
- `moveTicketToState()` - Workflow state transitions
- `logTime()` - Create time log entry
- `generateInvoice()` - Create invoice from "Done" tickets
- `autoApproveTickets()` - Cron job for 5-day rule
- `checkPaymentStatus()` - Suspend activity if overdue

### Real-time Updates

**Supabase Subscriptions:**
- Subscribe to ticket changes (status, priority, comments)
- Subscribe to time log additions
- Subscribe to invoice status changes
- Optimistic updates for immediate UI feedback

---

## Business Logic Implementation

### Key Features to Implement

#### 1. Automatic Approval System
- **Trigger:** Cron job running every hour
- **Logic:** Find tickets in "Ready to Test" > 5 business days
- **Action:** Move to "Done", log event, notify both parties
- **Implementation:** Next.js API route + scheduled job (Vercel Cron or external)

#### 2. Revision Tracking
- **Rule:** Maximum 3 revisions per ticket
- **Logic:** Track `revisionCount` on ticket
- **UI:** Disable "Request Revision" button at limit
- **Enforcement:** Server-side validation in state transition

#### 3. Time Tracking
- **Requirement:** All hours logged with ticket reference
- **UI:** Time log form in ticket detail panel
- **Validation:** Agency role only, positive hours
- **Display:** Estimated vs actual hours comparison

#### 4. Invoice Generation
- **Trigger:** Manual action by agency (every 2 weeks)
- **Logic:**
  - Find tickets in "Done" state
  - Calculate total hours
  - Apply hourly rate
  - Create invoice document
  - Move tickets to "Paid & Closed" after payment
- **Prevention:** Prevent double-billing with state checks

#### 5. Payment Enforcement
- **Rule:** 5 business day payment window
- **Logic:**
  - Track invoice due date
  - Check payment status daily
  - Suspend client activity if overdue
  - Set `isActive: false` on user
- **UI:** Display warning banners, block ticket creation

#### 6. Priority Ordering
- **Client Capability:** Reorder tickets in "To Estimate" and "Needs Client Review"
- **Restriction:** Cannot reorder tickets in development states
- **UI:** Drag-drop within Kanban columns (restricted by state)
- **Storage:** `priority_order` field or explicit order field

---

## UI/UX Design Patterns

### Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│  App Header (Logo, User Menu, Notifications)              │
├──────────┬─────────────────────────────────────────────────┤
│          │                                                 │
│ Sidebar  │                                                 │
│          │                                                 │
│ ├─ Home  │          Main Content Area                     │
│ ├─ Kanban│          (Dashboard, Kanban, Invoices, etc.)   │
│ ├─ Bills │                                                 │
│ └─ Sett. │                                                 │
│          │                                                 │
│ [Profile]│                                                 │
└──────────┴─────────────────────────────────────────────────┘
```

### Priority Visual System

| Priority | Color | Badge Style | Use Case |
|----------|-------|-------------|----------|
| Low | Green | `bg-green-100 text-green-800` | Nice-to-have features |
| Medium | Yellow | `bg-yellow-100 text-yellow-800` | Standard features |
| High | Orange | `bg-orange-100 text-orange-800` | Important features |
| Absolute | Red | `bg-red-100 text-red-800` | Critical blockers |

### Status Visual System

| Status | Color | Icon | Display Text |
|--------|-------|------|--------------|
| To Estimate | Gray | Clock | "Awaiting Estimate" |
| Needs Client Review | Blue | Eye | "Review Estimate" |
| Ready to Develop | Purple | Inbox | "In Queue" |
| Development in Progress | Yellow | Code | "In Progress" |
| Ready to Test | Orange | TestTube | "Ready for Testing" |
| Done | Green | CheckCircle | "Completed" |
| Paid & Closed | Dark Gray | Archive | "Archived" |

### Responsive Design

- **Desktop (>1024px):** Sidebar always visible, full Kanban board
- **Tablet (768-1024px):** Collapsible sidebar, horizontal scroll on Kanban
- **Mobile (<768px):** Overlay sidebar (Sheet), vertical Kanban columns

---

## Performance Optimization

### Data Fetching Strategy

1. **Initial Page Load:**
   - Server-side fetch tickets for current user
   - Prefetch user session
   - Load critical data only (no eager loading)

2. **Kanban Board:**
   - Paginate tickets per column (show 10, load more on scroll)
   - Lazy load ticket details on card click
   - Debounce drag events

3. **Real-time Updates:**
   - Use Supabase subscriptions for live data
   - Optimistic updates for immediate feedback
   - Batch multiple changes to reduce re-renders

4. **Caching:**
   - React Query automatic caching
   - Stale-while-revalidate pattern
   - Cache invalidation on mutations

### Code Splitting

- Route-based splitting (automatic with Next.js)
- Lazy load heavy components (Kanban, Invoice table)
- Dynamic imports for modals and drawers

---

## Security Considerations

### Row-Level Security (RLS)

**Supabase Policies:**
- Users can only read/update their own profile
- Clients can only see their own tickets
- Agency can see all tickets
- Time logs visible to ticket participants only
- Invoices visible to associated client and agency

### API Security

- All mutations require authentication
- Role-based access control on server actions
- Input validation with Zod schemas
- CSRF protection (Better Auth built-in)
- Rate limiting on API routes

### Data Validation

- Client-side validation with React Hook Form + Zod
- Server-side validation in Payload hooks
- Sanitize user inputs (prevent XSS)
- Validate file uploads (Media collection)

---

## Testing Strategy

### Unit Tests (Vitest)
- Utility functions (utils.ts)
- Business logic (time calculations, state transitions)
- Form validation schemas

### Integration Tests (Vitest + Testing Library)
- Component rendering
- Form submissions
- Auth flows
- Kanban drag-drop

### End-to-End Tests (Playwright)
- Complete user workflows:
  - Client creates ticket → Agency estimates → Client approves → Development → Testing → Billing
  - Automatic approval after 5 days
  - Revision request flow
  - Invoice generation and payment

---

## Deployment Architecture

### Environment Variables

**Required:**
```env
# Database
DATABASE_URI=postgresql://user:pass@host:5432/dbname

# Payload CMS
PAYLOAD_SECRET=your-secret-key
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com

# Better Auth
BETTER_AUTH_SECRET=your-auth-secret
BETTER_AUTH_URL=https://yourdomain.com

# Email (Resend)
RESEND_API_KEY=your-resend-key
FROM_EMAIL=noreply@yourdomain.com

# Stripe (Future)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Hosting

**Recommended:** Vercel (optimized for Next.js)
- Automatic deployments from Git
- Edge functions for API routes
- Built-in cron jobs for automatic approval
- Environment variable management

**Database:** Supabase
- PostgreSQL hosting
- Real-time subscriptions
- Row-level security
- Automatic backups

---

## Future Enhancements

### Phase 2 (Post-MVP)
- [ ] Slack integration (webhooks for notifications)
- [ ] Email templates (React Email + Resend)
- [ ] Advanced reporting (time tracking analytics)
- [ ] Multi-organization support
- [ ] Custom hourly rates per client
- [ ] Time budget alerts

### Phase 3 (Advanced Features)
- [ ] Stripe payment integration
- [ ] Automated billing (charge cards on invoice generation)
- [ ] Time tracking widgets (start/stop timers)
- [ ] Mobile app (React Native)
- [ ] Zapier integration
- [ ] Advanced permissions (custom roles)

---

## Related Documentation

- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Phase-by-phase development guide
- [Data Models](./DATA_MODELS.md) - Detailed database schemas
- [Workflow Logic](./WORKFLOW_LOGIC.md) - Business rules and state transitions
- [API Reference](./API_REFERENCE.md) - Server actions and endpoints

---

**Last Updated:** 2025-10-22
**Version:** 1.0.0
**Maintained By:** Development Team
