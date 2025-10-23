# Time & Materials System - Implementation Plan

## Overview

This document outlines the phase-by-phase implementation strategy for building the Time & Materials project management system. Each phase builds upon the previous, ensuring a solid foundation before adding complexity.

---

## Development Phases

### Phase 1: Foundation & Authentication ⏱️ 2-3 days

#### 1.1 Better Auth Setup
**Goal:** Enable simple email/password authentication with user roles

**Tasks:**
- [ ] Configure Better Auth with email/password (no email verification)
- [ ] Extend Users collection with required fields:
  - `role: 'client' | 'agency'`
  - `hourlyRate: number` (for agency users)
  - `organization: string` (optional)
  - `isActive: boolean` (default: true)
- [ ] Update auth configuration in [src/lib/auth/server.ts](../src/lib/auth/server.ts)
- [ ] Test authentication flow (signup, login, logout)

**Files to Modify:**
- `src/collections/Users.ts` - Add role and profile fields
- `src/lib/auth/server.ts` - Configure Better Auth options
- `src/lib/auth/client.ts` - Ensure role typing in session

**Acceptance Criteria:**
- ✓ Users can sign up with email/password
- ✓ Role is assigned during signup (client/agency)
- ✓ Session includes role information
- ✓ No email verification required

---

#### 1.2 Authentication UI
**Goal:** Create functional sign-in and sign-up pages

**Tasks:**
- [ ] Build `SignInForm` molecule component
  - Email input
  - Password input
  - Sign-in button
  - Link to sign-up
  - Error handling
- [ ] Build `SignUpForm` molecule component
  - Email input
  - Password input
  - Role selection (client/agency)
  - Hourly rate input (agency only)
  - Sign-up button
  - Error handling
- [ ] Implement sign-in page at `/sign-in`
- [ ] Implement sign-up page at `/sign-up`
- [ ] Add loading states and validation

**Files to Create:**
- `src/components/molecules/auth/SignInForm.tsx`
- `src/components/molecules/auth/SignUpForm.tsx`
- `src/app/(frontend)/(auth)/sign-in/page.tsx`
- `src/app/(frontend)/(auth)/sign-up/page.tsx`

**Acceptance Criteria:**
- ✓ Forms validate inputs (email format, password length)
- ✓ Role-specific fields show/hide appropriately
- ✓ Successful auth redirects to dashboard
- ✓ Errors display clearly to users

---

### Phase 2: Application Shell & Navigation ⏱️ 1-2 days

#### 2.1 Main Layout with Sidebar
**Goal:** Create the application shell with responsive navigation

**Tasks:**
- [ ] Build `AppLayout` component using existing Sidebar system
- [ ] Configure navigation menu items:
  - Dashboard (Home icon)
  - Kanban Board (Columns icon)
  - Invoices (Receipt icon) - Agency only
  - Settings (Settings icon)
- [ ] Add user profile section in sidebar footer
- [ ] Implement role-based navigation (hide Invoices for clients)
- [ ] Add sign-out functionality
- [ ] Make sidebar responsive (mobile Sheet overlay)

**Files to Create:**
- `src/components/organisms/AppLayout.tsx`
- `src/components/molecules/UserProfile.tsx`
- `src/app/(frontend)/layout.tsx` (wrap with AppLayout)

**Files to Reference:**
- `src/components/atoms/sidebar.tsx` (existing system)

**Acceptance Criteria:**
- ✓ Sidebar displays on all authenticated pages
- ✓ Navigation items route correctly
- ✓ Role-specific items show/hide properly
- ✓ Mobile sidebar uses Sheet overlay
- ✓ Keyboard shortcut (Cmd+B) toggles sidebar

---

#### 2.2 Protected Routes & Middleware
**Goal:** Ensure only authenticated users access app pages

**Tasks:**
- [ ] Create middleware to check authentication
- [ ] Redirect unauthenticated users to `/sign-in`
- [ ] Redirect authenticated users from auth pages to `/dashboard`
- [ ] Implement role-based route protection
- [ ] Handle session expiration gracefully

**Files to Create:**
- `src/middleware.ts` (Next.js middleware)
- `src/lib/auth/middleware.ts` (helper functions)

**Acceptance Criteria:**
- ✓ Unauthenticated users cannot access app pages
- ✓ Authenticated users cannot access sign-in/sign-up
- ✓ Role restrictions enforced (e.g., clients can't access admin pages)

---

### Phase 3: Data Models & Collections ⏱️ 2-3 days

#### 3.1 Tickets Collection
**Goal:** Create comprehensive ticket management system

**Tasks:**
- [ ] Create Tickets collection schema
- [ ] Add fields (see detailed schema in DATA_MODELS.md):
  - title, description, priority, status
  - estimatedHours, actualHours
  - createdBy, assignedTo (relations to Users)
  - isRevision, revisionCount, parentTicket
  - testingStartDate, approvalDeadline
  - timestamps
- [ ] Configure access control:
  - Clients: read own, create new
  - Agency: read all, update all
- [ ] Add Payload hooks:
  - beforeChange: Validate status transitions
  - beforeChange: Enforce revision limits
  - afterChange: Set testingStartDate when moved to "Ready to Test"
  - afterChange: Trigger notifications
- [ ] Generate TypeScript types

**Files to Create:**
- `src/collections/Tickets.ts`
- `src/collections/Tickets/hooks/index.ts`
- `src/collections/Tickets/access/index.ts`

**Acceptance Criteria:**
- ✓ Collection appears in Payload admin panel
- ✓ CRUD operations work correctly
- ✓ Access control enforced
- ✓ Status transitions validated
- ✓ Types generated successfully

---

#### 3.2 TimeLogs Collection
**Goal:** Enable granular time tracking for billing

**Tasks:**
- [ ] Create TimeLogs collection schema
- [ ] Add fields:
  - ticket (relation to Tickets)
  - user (relation to Users)
  - hours (number, positive validation)
  - description (text)
  - date (timestamp)
- [ ] Configure access control:
  - Agency: create, read, update own
  - Clients: read logs on own tickets
- [ ] Add hooks:
  - afterChange: Update ticket actualHours
  - beforeChange: Validate positive hours
- [ ] Generate TypeScript types

**Files to Create:**
- `src/collections/TimeLogs.ts`
- `src/collections/TimeLogs/hooks/index.ts`
- `src/collections/TimeLogs/access/index.ts`

**Acceptance Criteria:**
- ✓ Time logs can be created and associated with tickets
- ✓ Ticket actualHours updates automatically
- ✓ Only agency users can log time
- ✓ Validation prevents negative/zero hours

---

#### 3.3 Invoices Collection
**Goal:** Manage billing cycles and payment tracking

**Tasks:**
- [ ] Create Invoices collection schema
- [ ] Add fields:
  - billingPeriodStart, billingPeriodEnd (dates)
  - tickets (relation to Tickets - has many)
  - totalHours, hourlyRate, totalAmount (numbers)
  - status: 'pending' | 'paid' | 'overdue'
  - dueDate, paidDate (dates)
  - createdBy (agency user)
  - clientUser (relation to Users)
- [ ] Configure access control:
  - Agency: create, read all, update all
  - Clients: read own invoices only
- [ ] Add hooks:
  - beforeChange: Calculate totalAmount
  - beforeChange: Set dueDate (5 business days from creation)
  - afterChange: Update ticket status to "Paid & Closed"
  - afterChange: Check for overdue and suspend client if needed
- [ ] Generate TypeScript types

**Files to Create:**
- `src/collections/Invoices.ts`
- `src/collections/Invoices/hooks/index.ts`
- `src/collections/Invoices/access/index.ts`

**Acceptance Criteria:**
- ✓ Invoices can be generated from "Done" tickets
- ✓ Total amount calculates correctly
- ✓ Due date set automatically
- ✓ Access control works (clients see own only)
- ✓ Payment status tracked

---

### Phase 4: Kanban Board Implementation ⏱️ 3-4 days

#### 4.1 Kanban Board Structure
**Goal:** Build the 7-column Kanban board UI

**Tasks:**
- [ ] Create Kanban page at `/kanban`
- [ ] Implement KanbanBoard component using existing dnd-kit system
- [ ] Create 7 columns for ticket states:
  1. To Estimate
  2. Needs Client Review
  3. Ready to Develop
  4. Development in Progress
  5. Ready to Test
  6. Done
  7. Paid & Closed
- [ ] Add column headers with ticket counts
- [ ] Configure column styling (different colors per state)
- [ ] Make responsive (horizontal scroll on mobile)

**Files to Create:**
- `src/app/(frontend)/kanban/page.tsx`
- `src/components/organisms/KanbanBoard.tsx`
- `src/components/molecules/kanban/KanbanColumn.tsx`

**Files to Reference:**
- `src/components/ui/shadcn-io/kanban/index.tsx` (existing system)

**Acceptance Criteria:**
- ✓ 7 columns display correctly
- ✓ Column headers show ticket counts
- ✓ Board is responsive
- ✓ Empty states show when no tickets in column

---

#### 4.2 Ticket Cards
**Goal:** Display ticket information in draggable cards

**Tasks:**
- [ ] Create TicketCard component
- [ ] Display ticket information:
  - Title (truncated if long)
  - Priority badge (colored)
  - Estimated vs actual hours
  - Testing deadline (if in "Ready to Test")
  - Revision count indicator
  - Assignee avatar
- [ ] Add priority visual system:
  - Low: Green badge
  - Medium: Yellow badge
  - High: Orange badge
  - Absolute: Red badge
- [ ] Make cards clickable (open detail modal)
- [ ] Add hover effects

**Files to Create:**
- `src/components/molecules/kanban/TicketCard.tsx`
- `src/components/atoms/PriorityBadge.tsx`
- `src/components/atoms/StatusBadge.tsx`

**Acceptance Criteria:**
- ✓ Cards display all required information
- ✓ Priority colors match specification
- ✓ Cards are visually distinct and readable
- ✓ Click opens ticket detail panel

---

#### 4.3 Drag & Drop Logic
**Goal:** Enable ticket movement between states with validation

**Tasks:**
- [ ] Integrate dnd-kit with ticket data
- [ ] Implement drag handlers:
  - onDragStart: Highlight valid drop zones
  - onDragOver: Show drop indicator
  - onDragEnd: Update ticket status
- [ ] Add state transition validation:
  - Client users: Cannot move tickets in development states
  - Agency users: Can move through workflow
  - Prevent invalid transitions (e.g., "To Estimate" → "Done")
- [ ] Implement optimistic updates
- [ ] Add error handling (rollback on failure)
- [ ] Show loading states during transition

**Files to Modify:**
- `src/components/organisms/KanbanBoard.tsx`
- `src/hooks/use-ticket-transitions.ts` (new)

**Acceptance Criteria:**
- ✓ Cards drag smoothly
- ✓ Only valid drop zones highlight
- ✓ State transitions work correctly
- ✓ Invalid moves prevented with error message
- ✓ Optimistic updates provide instant feedback
- ✓ Rollback works on server error

---

#### 4.4 Data Fetching & Real-time Updates
**Goal:** Load tickets efficiently with live updates

**Tasks:**
- [ ] Create React Query hooks for tickets:
  - `useTickets()` - Fetch all tickets for current user
  - `useTicketsByStatus()` - Fetch tickets by status
  - `useMoveTicket()` - Mutation for status change
- [ ] Implement pagination (10 per column, load more on scroll)
- [ ] Add Supabase real-time subscriptions:
  - Subscribe to ticket changes
  - Update UI when tickets added/updated/deleted
- [ ] Add loading skeletons for initial load
- [ ] Implement error states

**Files to Create:**
- `src/hooks/use-tickets.ts`
- `src/lib/data/payload/custom/ticket-actions.ts`
- `src/lib/data/payload/custom/ticket-hooks.ts`

**Acceptance Criteria:**
- ✓ Tickets load correctly for user role
- ✓ Real-time updates work (changes from other users appear)
- ✓ Pagination works smoothly
- ✓ Loading states display properly
- ✓ Errors handled gracefully

---

### Phase 5: Ticket Management Features ⏱️ 3-4 days

#### 5.1 Ticket Creation Flow
**Goal:** Allow clients to create tickets with priority

**Tasks:**
- [ ] Create TicketForm component
- [ ] Add form fields:
  - Title (text input, required)
  - Description (textarea, required, rich text optional)
  - Priority (select: low, medium, high, absolute)
- [ ] Implement form validation with Zod
- [ ] Add submit handler (create ticket via Payload)
- [ ] Show success/error notifications
- [ ] Redirect or update UI after creation
- [ ] Add "Create Ticket" button in Kanban toolbar

**Files to Create:**
- `src/components/molecules/tickets/TicketForm.tsx`
- `src/lib/validation/ticket-schema.ts`

**Acceptance Criteria:**
- ✓ Form validates inputs correctly
- ✓ Tickets created with status "To Estimate"
- ✓ Tickets appear in Kanban immediately (optimistic update)
- ✓ Success notification shown
- ✓ Form resets after submission

---

#### 5.2 Ticket Detail Panel
**Goal:** Comprehensive view and editing of ticket details

**Tasks:**
- [ ] Create TicketDetailPanel component (Drawer or Dialog)
- [ ] Display sections:
  - Header: Title, status, priority badges
  - Details: Description, timestamps, assigned users
  - Time tracking: Estimated vs actual hours, time logs list
  - Comments: (Future: comment thread)
  - Actions: Role-specific action buttons
- [ ] Implement role-specific editing:
  - Clients: Edit title, description, priority (if not started)
  - Agency: Edit all fields, add time logs
- [ ] Add time log form (agency only)
- [ ] Add status transition buttons (agency only)
- [ ] Add "Approve"/"Reject" buttons (client, if in "Needs Client Review")
- [ ] Add "Accept"/"Request Revision" buttons (client, if in "Ready to Test")
- [ ] Show revision count and limit

**Files to Create:**
- `src/components/organisms/TicketDetailPanel.tsx`
- `src/components/molecules/tickets/TicketActions.tsx`
- `src/components/molecules/tickets/TimeLogList.tsx`
- `src/components/molecules/tickets/TimeLogForm.tsx`

**Acceptance Criteria:**
- ✓ Panel opens when card clicked
- ✓ All ticket information displays correctly
- ✓ Role-based editing enforced
- ✓ Time logs display and can be added
- ✓ Action buttons work correctly
- ✓ Panel closes and updates Kanban

---

#### 5.3 Estimation Workflow
**Goal:** Agency provides estimates, client approves/rejects

**Tasks:**
- [ ] Create EstimationForm component
- [ ] Add to TicketDetailPanel (agency view, "To Estimate" status)
- [ ] Form fields:
  - Estimated hours (number input)
  - Notes (optional textarea)
- [ ] On submit:
  - Update ticket with estimated hours
  - Move to "Needs Client Review"
  - Notify client
- [ ] Client review actions:
  - Approve → Move to "Ready to Develop"
  - Request revision → Back to "To Estimate" (add comment)
  - Cancel → Archive ticket
- [ ] Track SLA (1 business day for estimate)
- [ ] Show overdue indicator if estimate late

**Files to Create:**
- `src/components/molecules/tickets/EstimationForm.tsx`
- `src/components/molecules/tickets/ClientReviewActions.tsx`

**Acceptance Criteria:**
- ✓ Agency can provide estimate within 1 day
- ✓ Client sees estimate in review column
- ✓ Approve/reject actions work correctly
- ✓ Ticket moves to appropriate state
- ✓ Notifications sent (future: email/Slack)

---

#### 5.4 Revision Tracking
**Goal:** Track and limit revision requests

**Tasks:**
- [ ] Add revision logic to ticket hooks
- [ ] When client requests revision:
  - Increment revisionCount
  - Create child ticket (or add to revision history)
  - Move to "Development in Progress"
  - Notify agency
- [ ] Disable "Request Revision" if revisionCount >= 3
- [ ] Display revision count in TicketCard and TicketDetailPanel
- [ ] Show warning when approaching limit
- [ ] Link parent/child tickets for history

**Files to Modify:**
- `src/collections/Tickets/hooks/index.ts`
- `src/components/molecules/tickets/TicketActions.tsx`

**Acceptance Criteria:**
- ✓ Revision count tracks correctly
- ✓ Maximum 3 revisions enforced
- ✓ UI disables button at limit
- ✓ Revision history visible in detail panel

---

### Phase 6: Time Tracking & Logging ⏱️ 2 days

#### 6.1 Time Log Interface
**Goal:** Agency logs hours worked on tickets

**Tasks:**
- [ ] Create TimeLogForm component
- [ ] Form fields:
  - Hours (number, required, positive validation)
  - Description (textarea, required)
  - Date (date picker, default today)
- [ ] Submit handler:
  - Create TimeLog document
  - Update ticket actualHours
  - Refresh ticket detail panel
- [ ] Add form to TicketDetailPanel (agency only)
- [ ] Display time log history:
  - List all logs for ticket
  - Show user, hours, description, date
  - Allow editing own logs (optional)

**Files to Create:**
- `src/components/molecules/tickets/TimeLogForm.tsx`
- `src/components/molecules/tickets/TimeLogList.tsx`

**Acceptance Criteria:**
- ✓ Form validates hours (positive only)
- ✓ Time logs save correctly
- ✓ Ticket actualHours updates automatically
- ✓ Time log history displays chronologically
- ✓ Only agency users can log time

---

#### 6.2 Time Tracking Display
**Goal:** Show estimated vs actual hours prominently

**Tasks:**
- [ ] Add time tracking section to TicketCard
  - Display: "5h / 8h" (actual / estimated)
  - Color code: Green if under, red if over
  - Progress bar visual
- [ ] Add time tracking section to TicketDetailPanel
  - Estimated hours (editable by agency)
  - Actual hours (calculated from logs)
  - Variance (actual - estimated)
  - Percentage (actual / estimated * 100)
- [ ] Add aggregate time tracking to Kanban columns
  - Total hours in column
  - Total tickets in column

**Files to Modify:**
- `src/components/molecules/kanban/TicketCard.tsx`
- `src/components/organisms/TicketDetailPanel.tsx`
- `src/components/molecules/kanban/KanbanColumn.tsx`

**Acceptance Criteria:**
- ✓ Time displays clearly on cards
- ✓ Color coding helps identify issues
- ✓ Detail panel shows comprehensive time breakdown
- ✓ Column totals calculate correctly

---

### Phase 7: Automatic Approval System ⏱️ 2-3 days

#### 7.1 Business Day Calculation
**Goal:** Accurately calculate 5 business days

**Tasks:**
- [ ] Create utility function: `addBusinessDays(date, days)`
  - Skip weekends (Saturday, Sunday)
  - Skip holidays (configurable list)
  - Return Date object
- [ ] Create utility function: `isOverdue(deadline)`
  - Compare deadline to current date
  - Return boolean
- [ ] Add tests for business day calculations

**Files to Create:**
- `src/lib/utils/date-utils.ts`
- `src/lib/utils/date-utils.test.ts`

**Acceptance Criteria:**
- ✓ Function correctly adds business days
- ✓ Weekends skipped
- ✓ Holidays skipped (if configured)
- ✓ Tests pass

---

#### 7.2 Automatic Approval Logic
**Goal:** Auto-approve tickets after 5 business days in "Ready to Test"

**Tasks:**
- [ ] Create cron job API route: `/api/cron/auto-approve`
- [ ] Logic:
  - Find tickets in "Ready to Test" status
  - Check if testingStartDate + 5 business days <= today
  - Move to "Done" status
  - Log auto-approval event
  - Send notifications
- [ ] Set up Vercel Cron job:
  - Run daily at midnight UTC
  - Configure in `vercel.json`
- [ ] Add manual trigger for testing
- [ ] Add logging and error handling

**Files to Create:**
- `src/app/api/cron/auto-approve/route.ts`
- `vercel.json` (cron configuration)

**Acceptance Criteria:**
- ✓ Cron job runs daily
- ✓ Tickets auto-approve after 5 business days
- ✓ Event logged in system
- ✓ Notifications sent (future: email)
- ✓ Manual trigger works for testing

---

#### 7.3 Testing Deadline Display
**Goal:** Show clients how much time remains for testing

**Tasks:**
- [ ] Calculate deadline: testingStartDate + 5 business days
- [ ] Display countdown in TicketCard (if in "Ready to Test")
  - "3 days remaining"
  - "1 day remaining" (yellow warning)
  - "Due today" (red warning)
  - "Auto-approved" (after deadline)
- [ ] Display deadline in TicketDetailPanel
  - Exact date and time
  - Countdown timer
  - Warning message about auto-approval
- [ ] Add visual urgency indicators

**Files to Modify:**
- `src/components/molecules/kanban/TicketCard.tsx`
- `src/components/organisms/TicketDetailPanel.tsx`

**Acceptance Criteria:**
- ✓ Deadline displays correctly
- ✓ Countdown updates in real-time
- ✓ Visual warnings appear appropriately
- ✓ Message explains auto-approval clearly

---

### Phase 8: Invoice Management ⏱️ 2-3 days

#### 8.1 Invoice Generation
**Goal:** Agency generates invoices from "Done" tickets

**Tasks:**
- [ ] Create invoice generation flow:
  - Find tickets in "Done" status
  - Filter by client user
  - Calculate total hours
  - Apply hourly rate
  - Create Invoice document
  - Set dueDate (5 business days)
- [ ] Create InvoiceForm component:
  - Date range selector (billing period)
  - Client selector
  - Ticket list (checkboxes to include)
  - Hourly rate input (default from user profile)
  - Preview total amount
  - Generate button
- [ ] Add invoice generation page at `/invoices/new`
- [ ] Add "Generate Invoice" button in main Invoices page

**Files to Create:**
- `src/app/(frontend)/invoices/new/page.tsx`
- `src/components/molecules/invoices/InvoiceForm.tsx`
- `src/lib/data/payload/custom/invoice-actions.ts`

**Acceptance Criteria:**
- ✓ Agency can select tickets for invoicing
- ✓ Total calculates correctly
- ✓ Invoice created with correct data
- ✓ Tickets remain in "Done" (don't move yet)

---

#### 8.2 Invoice Display & Management
**Goal:** View and manage invoices

**Tasks:**
- [ ] Create Invoices list page at `/invoices`
- [ ] Display invoice table:
  - Invoice number
  - Client name
  - Billing period
  - Total amount
  - Status (pending/paid/overdue)
  - Due date
  - Actions (view, mark paid, download PDF)
- [ ] Create InvoiceDetailPanel component:
  - Invoice header (client, dates, totals)
  - Ticket list (with hours and descriptions)
  - Payment status
  - Mark as paid button (agency only)
  - Download PDF button (future)
- [ ] Implement filters:
  - Status filter
  - Date range filter
  - Client filter (agency only)
- [ ] Add pagination

**Files to Create:**
- `src/app/(frontend)/invoices/page.tsx`
- `src/components/organisms/InvoiceTable.tsx`
- `src/components/organisms/InvoiceDetailPanel.tsx`

**Acceptance Criteria:**
- ✓ Invoices display in table
- ✓ Filters work correctly
- ✓ Detail panel shows comprehensive info
- ✓ Mark as paid updates status
- ✓ Clients see only their invoices

---

#### 8.3 Payment Enforcement
**Goal:** Suspend client activity if payment overdue

**Tasks:**
- [ ] Create cron job: `/api/cron/check-payments`
- [ ] Logic:
  - Find invoices with status "pending"
  - Check if dueDate + 5 business days <= today
  - Update invoice status to "overdue"
  - Set client user `isActive: false`
  - Send overdue notification
- [ ] Add middleware check:
  - Prevent clients with `isActive: false` from creating tickets
  - Show warning banner on all pages
- [ ] Add payment reminder notifications:
  - 2 days before due date
  - On due date
  - 2 days after due date
  - On suspension
- [ ] Implement reactivation:
  - When invoice marked paid, set `isActive: true`

**Files to Create:**
- `src/app/api/cron/check-payments/route.ts`
- `src/components/molecules/OverdueBanner.tsx`

**Acceptance Criteria:**
- ✓ Overdue invoices detected correctly
- ✓ Client activity suspended automatically
- ✓ Suspended clients cannot create tickets
- ✓ Warning banner displays
- ✓ Reactivation works when paid
- ✓ Notifications sent (future: email)

---

#### 8.4 Ticket Archival
**Goal:** Move paid tickets to "Paid & Closed"

**Tasks:**
- [ ] Add logic to "Mark as Paid" action:
  - Update invoice status to "paid"
  - Set paidDate
  - Find all associated tickets
  - Move tickets to "Paid & Closed" status
  - Reactivate client (set isActive: true)
- [ ] Add archive view in Kanban:
  - Toggle to show/hide "Paid & Closed" column
  - Default: hidden
  - Lazy load archived tickets
- [ ] Prevent editing archived tickets
- [ ] Add unarchive action (admin only, if needed)

**Files to Modify:**
- `src/lib/data/payload/custom/invoice-actions.ts`
- `src/components/organisms/KanbanBoard.tsx`

**Acceptance Criteria:**
- ✓ Tickets move to "Paid & Closed" when invoice paid
- ✓ Archived tickets not editable
- ✓ Archive column can be shown/hidden
- ✓ No double-billing possible

---

### Phase 9: Dashboard & Analytics ⏱️ 2 days

#### 9.1 Dashboard Layout
**Goal:** Create main dashboard with key metrics

**Tasks:**
- [ ] Create Dashboard page at `/dashboard` (set as home)
- [ ] Layout sections:
  - Welcome header with user name
  - Quick stats cards (4-6 cards)
  - Recent activity feed
  - Current billing cycle summary
  - Upcoming deadlines
  - Quick actions (Create ticket, View invoices)
- [ ] Make responsive (grid on desktop, stack on mobile)

**Files to Create:**
- `src/app/(frontend)/dashboard/page.tsx`
- `src/components/organisms/Dashboard.tsx`

**Acceptance Criteria:**
- ✓ Dashboard displays on login
- ✓ Layout is responsive
- ✓ Sections organize information clearly

---

#### 9.2 Dashboard Widgets (Client View)
**Goal:** Client-specific dashboard widgets

**Tasks:**
- [ ] Create StatCard component (reusable)
- [ ] Client widgets:
  - Total open tickets
  - Tickets awaiting your approval
  - Tickets in testing
  - Overdue actions (estimates, tests)
- [ ] Create RecentActivity component:
  - Tickets created/updated recently
  - Status changes
  - Comments (future)
- [ ] Create DeadlinesList component:
  - Testing deadlines approaching
  - Approval requests
  - Overdue items
- [ ] Add data fetching hooks

**Files to Create:**
- `src/components/molecules/dashboard/StatCard.tsx`
- `src/components/molecules/dashboard/RecentActivity.tsx`
- `src/components/molecules/dashboard/DeadlinesList.tsx`
- `src/hooks/use-dashboard-stats.ts`

**Acceptance Criteria:**
- ✓ Stats display correctly
- ✓ Recent activity shows latest changes
- ✓ Deadlines list is accurate
- ✓ Widgets update in real-time

---

#### 9.3 Dashboard Widgets (Agency View)
**Goal:** Agency-specific dashboard widgets

**Tasks:**
- [ ] Agency widgets:
  - Total active tickets
  - Tickets in development
  - Hours logged this period
  - Current period revenue
  - Pending invoices
  - Overdue payments
- [ ] Create BillingCycleSummary component:
  - Current cycle dates
  - Total hours worked
  - Estimated revenue
  - Ready to invoice (tickets in "Done")
- [ ] Create TimeTrackingSummary component:
  - Hours logged today/this week
  - Time by project/client
  - Billable vs non-billable (future)

**Files to Create:**
- `src/components/molecules/dashboard/BillingCycleSummary.tsx`
- `src/components/molecules/dashboard/TimeTrackingSummary.tsx`

**Acceptance Criteria:**
- ✓ Agency sees different widgets than clients
- ✓ Billing cycle data accurate
- ✓ Time tracking summarizes correctly
- ✓ Revenue calculations match invoices

---

### Phase 10: Notifications & Alerts ⏱️ 2 days

#### 10.1 In-App Notifications
**Goal:** Real-time notification system

**Tasks:**
- [ ] Create Notifications collection (optional):
  - user (recipient)
  - type (ticket_created, status_changed, etc.)
  - message (text)
  - read (boolean)
  - createdAt
- [ ] Add notification icon to app header (bell icon)
- [ ] Create NotificationDropdown component:
  - List recent notifications
  - Mark as read
  - Clear all
  - Link to related item
- [ ] Implement notification triggers:
  - Ticket created → notify agency
  - Estimate provided → notify client
  - Ticket approved → notify agency
  - Ticket ready to test → notify client
  - Auto-approval → notify both
  - Invoice generated → notify client
  - Payment overdue → notify client
- [ ] Add real-time updates (Supabase subscriptions)

**Files to Create:**
- `src/collections/Notifications.ts`
- `src/components/molecules/NotificationDropdown.tsx`
- `src/lib/notifications/triggers.ts`

**Acceptance Criteria:**
- ✓ Notifications appear in dropdown
- ✓ Badge shows unread count
- ✓ Clicking notification navigates to item
- ✓ Mark as read works
- ✓ Real-time updates work

---

#### 10.2 Toast Notifications
**Goal:** Immediate feedback for user actions

**Tasks:**
- [ ] Integrate existing Sonner toast system
- [ ] Add toasts for:
  - Ticket created (success)
  - Ticket updated (success)
  - Estimate submitted (success)
  - Time logged (success)
  - Invoice generated (success)
  - Errors (error toasts)
- [ ] Customize toast styling (match brand)
- [ ] Add toast position configuration

**Files to Modify:**
- `src/app/(frontend)/layout.tsx` (add Toaster component)

**Acceptance Criteria:**
- ✓ Toasts appear for key actions
- ✓ Success toasts are green, errors red
- ✓ Toasts auto-dismiss after 3-5 seconds
- ✓ Multiple toasts stack properly

---

### Phase 11: Polish & Optimization ⏱️ 2-3 days

#### 11.1 Loading States
**Goal:** Smooth loading experiences

**Tasks:**
- [ ] Add skeleton loaders:
  - Kanban board (card skeletons)
  - Dashboard widgets (stat card skeletons)
  - Invoice table (row skeletons)
- [ ] Add loading spinners:
  - Form submissions
  - Modal/drawer loading
  - Button loading states
- [ ] Implement React Suspense boundaries
- [ ] Add loading indicators for drag operations

**Files to Create:**
- `src/components/atoms/Skeleton.tsx` (if not exists)
- `src/components/molecules/kanban/TicketCardSkeleton.tsx`

**Acceptance Criteria:**
- ✓ Loading states prevent blank screens
- ✓ Skeletons match actual content layout
- ✓ Transitions feel smooth

---

#### 11.2 Error Handling
**Goal:** Graceful error handling and recovery

**Tasks:**
- [ ] Create error boundaries:
  - App-level error boundary
  - Page-level error boundaries
  - Component-level boundaries
- [ ] Create error pages:
  - 404 Not Found
  - 500 Server Error
  - 403 Forbidden
- [ ] Add error states to components:
  - Failed data fetches
  - Network errors
  - Validation errors
- [ ] Implement retry mechanisms
- [ ] Add error logging (future: Sentry)

**Files to Create:**
- `src/components/ErrorBoundary.tsx`
- `src/app/error.tsx`
- `src/app/not-found.tsx`

**Acceptance Criteria:**
- ✓ Errors don't crash entire app
- ✓ Users see helpful error messages
- ✓ Retry options available
- ✓ Errors logged for debugging

---

#### 11.3 Performance Optimization
**Goal:** Fast, responsive application

**Tasks:**
- [ ] Implement pagination:
  - Kanban cards (10 per column, infinite scroll)
  - Invoice table (25 per page)
  - Notification list (10 per page)
- [ ] Add React Query caching:
  - Configure stale times
  - Implement cache invalidation
  - Prefetch data on hover (optional)
- [ ] Optimize images:
  - Use Next.js Image component
  - Lazy load images
  - Optimize avatar images
- [ ] Code splitting:
  - Dynamic imports for heavy components
  - Route-based splitting (automatic)
- [ ] Debounce search inputs
- [ ] Throttle drag events

**Files to Modify:**
- `src/hooks/use-tickets.ts` (pagination)
- `src/components/organisms/KanbanBoard.tsx` (infinite scroll)

**Acceptance Criteria:**
- ✓ Initial page load < 2 seconds
- ✓ Kanban drag feels smooth (60fps)
- ✓ Large datasets don't slow down UI
- ✓ React Query caching reduces API calls

---

#### 11.4 Accessibility (a11y)
**Goal:** WCAG 2.1 AA compliance

**Tasks:**
- [ ] Keyboard navigation:
  - Tab through all interactive elements
  - Escape to close modals
  - Enter to submit forms
  - Arrow keys in Kanban (optional)
- [ ] Screen reader support:
  - Proper ARIA labels
  - Semantic HTML
  - Focus management
- [ ] Visual accessibility:
  - Sufficient color contrast
  - Focus indicators
  - Text alternatives for icons
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Run accessibility audit (Lighthouse)

**Acceptance Criteria:**
- ✓ Keyboard navigation works throughout app
- ✓ Screen reader announces content correctly
- ✓ Color contrast meets WCAG AA
- ✓ Lighthouse accessibility score > 90

---

### Phase 12: Testing & Documentation ⏱️ 2-3 days

#### 12.1 Unit Tests
**Goal:** Test critical business logic

**Tasks:**
- [ ] Test utility functions:
  - Date calculations (business days)
  - Time calculations
  - Validation schemas
- [ ] Test hooks:
  - useTickets
  - useInvoices
  - useTimeLogs
- [ ] Test components:
  - Forms (validation, submission)
  - Cards (display, interactions)
  - State machines (ticket transitions)
- [ ] Achieve > 70% code coverage

**Files to Create:**
- `src/lib/utils/date-utils.test.ts`
- `src/hooks/use-tickets.test.ts`
- `src/components/molecules/tickets/TicketForm.test.tsx`

**Acceptance Criteria:**
- ✓ All tests pass
- ✓ Code coverage > 70%
- ✓ Critical paths tested

---

#### 12.2 End-to-End Tests
**Goal:** Test complete user workflows

**Tasks:**
- [ ] Test authentication flow:
  - Sign up (client and agency)
  - Sign in
  - Sign out
- [ ] Test ticket workflow:
  - Client creates ticket
  - Agency provides estimate
  - Client approves
  - Agency develops and tests
  - Client tests and accepts
  - Ticket moves to Done
- [ ] Test invoice workflow:
  - Agency generates invoice
  - Client views invoice
  - Agency marks paid
  - Tickets archive
- [ ] Test revision flow:
  - Client requests revision
  - Revision limit enforced
- [ ] Test automatic approval:
  - Ticket auto-approves after 5 days
- [ ] Test payment suspension:
  - Overdue invoice suspends client

**Files to Create:**
- `tests/e2e/auth.spec.ts`
- `tests/e2e/ticket-workflow.spec.ts`
- `tests/e2e/invoice-workflow.spec.ts`

**Acceptance Criteria:**
- ✓ All E2E tests pass
- ✓ Tests run in CI/CD pipeline
- ✓ Critical user journeys covered

---

#### 12.3 Documentation
**Goal:** Comprehensive user and developer docs

**Tasks:**
- [ ] User documentation:
  - Getting started guide
  - Client user guide (how to create tickets, approve estimates, test features)
  - Agency user guide (how to estimate, log time, generate invoices)
  - FAQ
- [ ] Developer documentation:
  - Setup instructions (already in README)
  - Architecture overview (already created)
  - API reference (server actions)
  - Contributing guide
  - Deployment guide
- [ ] Inline code documentation:
  - JSDoc comments for complex functions
  - Type documentation
  - Hook usage examples

**Files to Create:**
- `docs/USER_GUIDE_CLIENT.md`
- `docs/USER_GUIDE_AGENCY.md`
- `docs/FAQ.md`
- `docs/CONTRIBUTING.md`
- `docs/DEPLOYMENT.md`

**Acceptance Criteria:**
- ✓ Users can onboard without support
- ✓ Developers can understand codebase
- ✓ All features documented

---

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables set in Vercel
- [ ] Database migrations run on production
- [ ] Payload CMS accessible at /admin
- [ ] Better Auth configured with production URL
- [ ] Cron jobs configured in Vercel
- [ ] Email service (Resend) configured
- [ ] Error tracking (Sentry) configured (optional)

### Post-Deployment
- [ ] Create initial admin/agency user
- [ ] Test authentication flow in production
- [ ] Create test ticket through full workflow
- [ ] Generate test invoice
- [ ] Test automatic approval cron job
- [ ] Test payment suspension cron job
- [ ] Monitor performance (Vercel Analytics)
- [ ] Monitor errors (Vercel Logs / Sentry)

### Go-Live
- [ ] Announce to users
- [ ] Provide user guides
- [ ] Set up support channel
- [ ] Monitor for first week closely
- [ ] Gather user feedback
- [ ] Plan iteration roadmap

---

## Success Metrics

### User Adoption
- [ ] 80%+ user satisfaction
- [ ] < 5 min average time to create ticket
- [ ] < 1 day average time to estimate
- [ ] 90%+ tickets completed within estimate

### System Performance
- [ ] < 2s page load time
- [ ] < 100ms API response time
- [ ] 99.9% uptime
- [ ] 0 data loss incidents

### Business Impact
- [ ] 50% reduction in time spent on project management
- [ ] 90%+ on-time payments
- [ ] 30% reduction in client/agency communication overhead
- [ ] Clear, auditable billing records

---

## Risk Mitigation

### Identified Risks
1. **Automatic approval too aggressive** → Add client notification 1 day before
2. **Revision limit too restrictive** → Make configurable per project
3. **Payment suspension too harsh** → Add grace period notification
4. **Time tracking incomplete** → Add validation and reminders
5. **Scope creep on tickets** → Enforce clear description requirements

### Contingency Plans
- Rollback strategy for each phase
- Feature flags for risky features
- Manual override for automatic systems
- Support channel for edge cases

---

## Next Steps

**Immediate Actions:**
1. Review and approve this implementation plan
2. Set up development environment
3. Begin Phase 1: Better Auth configuration
4. Create project board for task tracking

**Weekly Cadence:**
- Monday: Plan week's tasks
- Daily: Standup (15 min)
- Friday: Demo progress, retrospective

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-22
**Estimated Total Time:** 6-8 weeks (single developer)
