# Data Models - Time & Materials System

## Overview

This document provides comprehensive schemas for all Payload CMS collections used in the Time & Materials project management system.

---

## Collection: Users (Extended)

**Purpose:** User authentication, profiles, and role-based access control

**Base Collection:** Extends existing Users collection at [src/collections/Users.ts](../src/collections/Users.ts)

### Schema

```typescript
{
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    // Existing fields (from Payload auth)
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    // New fields to add
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'client',
      options: [
        { label: 'Client', value: 'client' },
        { label: 'Agency', value: 'agency' },
      ],
      admin: {
        description: 'User role determines permissions and UI experience',
      },
    },
    {
      name: 'firstName',
      type: 'text',
      required: false,
    },
    {
      name: 'lastName',
      type: 'text',
      required: false,
    },
    {
      name: 'organization',
      type: 'text',
      required: false,
      admin: {
        description: 'Company or organization name',
      },
    },
    {
      name: 'hourlyRate',
      type: 'number',
      required: false,
      min: 0,
      admin: {
        description: 'Default hourly rate for agency users (used in invoice generation)',
        condition: (data, siblingData) => siblingData.role === 'agency',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Inactive users cannot create tickets (used for payment suspension)',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
  ],
}
```

### Access Control

```typescript
{
  create: () => true, // Anyone can sign up
  read: ({ req: { user } }) => {
    if (!user) return false;
    if (user.role === 'agency') return true; // Agency sees all
    return { id: { equals: user.id } }; // Clients see only themselves
  },
  update: ({ req: { user }, id }) => {
    if (!user) return false;
    if (user.role === 'agency' && user.id === id) return true;
    return user.id === id; // Users can only update themselves
  },
  delete: () => false, // Prevent deletion
}
```

### Example Document

```json
{
  "id": "user_abc123",
  "email": "john@acme.com",
  "role": "client",
  "firstName": "John",
  "lastName": "Doe",
  "organization": "Acme Corp",
  "isActive": true,
  "avatar": "media_xyz789",
  "createdAt": "2025-10-20T10:00:00Z",
  "updatedAt": "2025-10-22T14:30:00Z"
}
```

---

## Collection: Tickets

**Purpose:** Feature requests, task tracking, and workflow management

**Location:** [src/collections/Tickets.ts](../src/collections/Tickets.ts) (to be created)

### Schema

```typescript
{
  slug: 'tickets',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'priority', 'createdBy', 'estimatedHours'],
    group: 'Project Management',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 200,
      admin: {
        description: 'Short, descriptive title for the ticket',
      },
    },
    {
      name: 'description',
      type: 'richText', // or 'textarea' for simpler implementation
      required: true,
      admin: {
        description: 'Detailed description of the feature or task',
      },
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { label: 'Low Priority', value: 'low' },
        { label: 'Medium Priority', value: 'medium' },
        { label: 'High Priority', value: 'high' },
        { label: 'Absolute Priority', value: 'absolute' },
      ],
      admin: {
        description: 'Priority level affects order in Kanban board',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'to_estimate',
      options: [
        { label: 'To Estimate', value: 'to_estimate' },
        { label: 'Needs Client Review', value: 'needs_client_review' },
        { label: 'Ready to Develop', value: 'ready_to_develop' },
        { label: 'Development in Progress', value: 'development_in_progress' },
        { label: 'Ready to Test', value: 'ready_to_test' },
        { label: 'Done', value: 'done' },
        { label: 'Paid & Closed', value: 'paid_closed' },
      ],
      admin: {
        description: 'Current workflow status',
      },
    },
    {
      name: 'estimatedHours',
      type: 'number',
      required: false,
      min: 0,
      admin: {
        description: 'Agency-provided estimate in hours',
      },
    },
    {
      name: 'actualHours',
      type: 'number',
      required: false,
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Total hours logged (calculated from TimeLogs)',
        readOnly: true,
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'Client user who created this ticket',
      },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        description: 'Agency user responsible for this ticket',
      },
    },
    {
      name: 'isRevision',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Indicates this ticket is a revision of a previous one',
      },
    },
    {
      name: 'revisionCount',
      type: 'number',
      required: false,
      min: 0,
      max: 3,
      defaultValue: 0,
      admin: {
        description: 'Number of times client has requested revisions (max 3)',
      },
    },
    {
      name: 'parentTicket',
      type: 'relationship',
      relationTo: 'tickets',
      required: false,
      admin: {
        description: 'Original ticket if this is a revision',
        condition: (data, siblingData) => siblingData.isRevision,
      },
    },
    {
      name: 'testingStartDate',
      type: 'date',
      required: false,
      admin: {
        description: 'Date ticket moved to "Ready to Test" (used for 5-day auto-approval)',
      },
    },
    {
      name: 'approvalDeadline',
      type: 'date',
      required: false,
      admin: {
        description: 'Calculated: testingStartDate + 5 business days',
        readOnly: true,
      },
    },
    {
      name: 'estimateProvidedDate',
      type: 'date',
      required: false,
      admin: {
        description: 'Date agency provided estimate',
      },
    },
    {
      name: 'estimateNotes',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Agency notes accompanying the estimate',
      },
    },
    {
      name: 'invoice',
      type: 'relationship',
      relationTo: 'invoices',
      required: false,
      admin: {
        description: 'Invoice this ticket is included in (if paid)',
      },
    },
    {
      name: 'priorityOrder',
      type: 'number',
      required: false,
      admin: {
        description: 'Custom order within priority level (for drag-drop reordering)',
      },
    },
  ],
  timestamps: true,
}
```

### Access Control

```typescript
{
  create: ({ req: { user } }) => {
    if (!user) return false;
    if (user.role === 'client' && user.isActive) return true;
    return false; // Agency cannot create tickets for clients
  },
  read: ({ req: { user } }) => {
    if (!user) return false;
    if (user.role === 'agency') return true; // Agency sees all
    return { createdBy: { equals: user.id } }; // Clients see only own
  },
  update: ({ req: { user } }) => {
    if (!user) return false;
    // Complex logic: different fields editable by different roles
    // Implemented in hooks
    return user.role === 'agency' || user.role === 'client';
  },
  delete: ({ req: { user } }) => {
    if (!user) return false;
    return user.role === 'agency'; // Only agency can delete
  },
}
```

### Hooks

```typescript
// beforeChange hook
{
  beforeChange: [
    // Set createdBy to current user on creation
    async ({ data, req, operation }) => {
      if (operation === 'create' && req.user) {
        data.createdBy = req.user.id;
      }
      return data;
    },

    // Calculate approvalDeadline when testingStartDate is set
    async ({ data, req, operation }) => {
      if (data.testingStartDate) {
        data.approvalDeadline = addBusinessDays(new Date(data.testingStartDate), 5);
      }
      return data;
    },

    // Validate status transitions
    async ({ data, req, operation, originalDoc }) => {
      if (operation === 'update' && data.status !== originalDoc.status) {
        const validTransition = validateStatusTransition(
          originalDoc.status,
          data.status,
          req.user.role
        );
        if (!validTransition) {
          throw new Error('Invalid status transition');
        }
      }
      return data;
    },

    // Enforce revision limit
    async ({ data, req, operation }) => {
      if (data.revisionCount > 3) {
        throw new Error('Maximum revision limit (3) exceeded');
      }
      return data;
    },
  ],

  afterChange: [
    // Set testingStartDate when moved to "Ready to Test"
    async ({ doc, req, operation, previousDoc }) => {
      if (doc.status === 'ready_to_test' && previousDoc?.status !== 'ready_to_test') {
        await payload.update({
          collection: 'tickets',
          id: doc.id,
          data: { testingStartDate: new Date() },
        });
      }
    },

    // Send notifications on status change
    async ({ doc, req, operation, previousDoc }) => {
      if (doc.status !== previousDoc?.status) {
        await sendStatusChangeNotification(doc, previousDoc?.status);
      }
    },
  ],
}
```

### Example Document

```json
{
  "id": "ticket_def456",
  "title": "Add user profile page with avatar upload",
  "description": "Users should be able to update their profile...",
  "priority": "high",
  "status": "ready_to_test",
  "estimatedHours": 8,
  "actualHours": 10.5,
  "createdBy": "user_abc123",
  "assignedTo": "user_agency456",
  "isRevision": false,
  "revisionCount": 0,
  "parentTicket": null,
  "testingStartDate": "2025-10-20T09:00:00Z",
  "approvalDeadline": "2025-10-27T09:00:00Z",
  "estimateProvidedDate": "2025-10-15T14:00:00Z",
  "estimateNotes": "Includes UI design and backend API",
  "invoice": null,
  "priorityOrder": 1,
  "createdAt": "2025-10-15T10:00:00Z",
  "updatedAt": "2025-10-20T09:00:00Z"
}
```

---

## Collection: TimeLogs

**Purpose:** Granular time tracking for billing accuracy

**Location:** [src/collections/TimeLogs.ts](../src/collections/TimeLogs.ts) (to be created)

### Schema

```typescript
{
  slug: 'time-logs',
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['ticket', 'user', 'hours', 'date'],
    group: 'Project Management',
  },
  fields: [
    {
      name: 'ticket',
      type: 'relationship',
      relationTo: 'tickets',
      required: true,
      admin: {
        description: 'Ticket this time was logged against',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'Agency user who logged this time',
      },
    },
    {
      name: 'hours',
      type: 'number',
      required: true,
      min: 0.25, // 15-minute minimum
      max: 24, // 24-hour maximum per entry
      admin: {
        description: 'Hours worked (minimum 0.25)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      maxLength: 500,
      admin: {
        description: 'Description of work performed',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
      admin: {
        description: 'Date work was performed',
      },
    },
    {
      name: 'isBillable',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this time should be billed to client',
      },
    },
  ],
  timestamps: true,
}
```

### Access Control

```typescript
{
  create: ({ req: { user } }) => {
    if (!user) return false;
    return user.role === 'agency'; // Only agency can log time
  },
  read: ({ req: { user } }) => {
    if (!user) return false;
    if (user.role === 'agency') return true; // Agency sees all
    // Clients can see time logs on their tickets
    return {
      'ticket.createdBy': { equals: user.id },
    };
  },
  update: ({ req: { user } }) => {
    if (!user) return false;
    return {
      user: { equals: user.id }, // Can only update own logs
    };
  },
  delete: ({ req: { user } }) => {
    if (!user) return false;
    return user.role === 'agency'; // Only agency can delete
  },
}
```

### Hooks

```typescript
{
  beforeChange: [
    // Set user to current user on creation
    async ({ data, req, operation }) => {
      if (operation === 'create' && req.user) {
        data.user = req.user.id;
      }
      return data;
    },

    // Validate hours
    async ({ data }) => {
      if (data.hours <= 0) {
        throw new Error('Hours must be positive');
      }
      if (data.hours > 24) {
        throw new Error('Cannot log more than 24 hours per entry');
      }
      return data;
    },
  ],

  afterChange: [
    // Update ticket actualHours
    async ({ doc, req, operation }) => {
      if (operation === 'create' || operation === 'update') {
        const timeLogs = await payload.find({
          collection: 'time-logs',
          where: {
            ticket: { equals: doc.ticket },
            isBillable: { equals: true },
          },
        });

        const totalHours = timeLogs.docs.reduce((sum, log) => sum + log.hours, 0);

        await payload.update({
          collection: 'tickets',
          id: doc.ticket,
          data: { actualHours: totalHours },
        });
      }
    },
  ],

  afterDelete: [
    // Update ticket actualHours after deletion
    async ({ doc }) => {
      const timeLogs = await payload.find({
        collection: 'time-logs',
        where: {
          ticket: { equals: doc.ticket },
          isBillable: { equals: true },
        },
      });

      const totalHours = timeLogs.docs.reduce((sum, log) => sum + log.hours, 0);

      await payload.update({
        collection: 'tickets',
        id: doc.ticket,
        data: { actualHours: totalHours },
      });
    },
  ],
}
```

### Example Document

```json
{
  "id": "log_ghi789",
  "ticket": "ticket_def456",
  "user": "user_agency456",
  "hours": 3.5,
  "description": "Implemented user profile UI with avatar upload component",
  "date": "2025-10-18T00:00:00Z",
  "isBillable": true,
  "createdAt": "2025-10-18T17:30:00Z",
  "updatedAt": "2025-10-18T17:30:00Z"
}
```

---

## Collection: Invoices

**Purpose:** Billing cycle management and payment tracking

**Location:** [src/collections/Invoices.ts](../src/collections/Invoices.ts) (to be created)

### Schema

```typescript
{
  slug: 'invoices',
  admin: {
    useAsTitle: 'invoiceNumber',
    defaultColumns: ['invoiceNumber', 'clientUser', 'totalAmount', 'status', 'dueDate'],
    group: 'Billing',
  },
  fields: [
    {
      name: 'invoiceNumber',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique invoice identifier (auto-generated)',
        readOnly: true,
      },
    },
    {
      name: 'billingPeriodStart',
      type: 'date',
      required: true,
      admin: {
        description: 'Start date of billing cycle',
      },
    },
    {
      name: 'billingPeriodEnd',
      type: 'date',
      required: true,
      admin: {
        description: 'End date of billing cycle',
      },
    },
    {
      name: 'tickets',
      type: 'relationship',
      relationTo: 'tickets',
      hasMany: true,
      required: true,
      admin: {
        description: 'Tickets included in this invoice',
      },
    },
    {
      name: 'clientUser',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'Client being invoiced',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'Agency user who generated this invoice',
      },
    },
    {
      name: 'totalHours',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total billable hours (calculated from tickets)',
        readOnly: true,
      },
    },
    {
      name: 'hourlyRate',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Hourly rate applied to this invoice',
      },
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total invoice amount (totalHours * hourlyRate)',
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'dueDate',
      type: 'date',
      required: true,
      admin: {
        description: '5 business days from invoice creation',
        readOnly: true,
      },
    },
    {
      name: 'paidDate',
      type: 'date',
      required: false,
      admin: {
        description: 'Date invoice was marked as paid',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Additional notes or payment instructions',
      },
    },
  ],
  timestamps: true,
}
```

### Access Control

```typescript
{
  create: ({ req: { user } }) => {
    if (!user) return false;
    return user.role === 'agency'; // Only agency can create invoices
  },
  read: ({ req: { user } }) => {
    if (!user) return false;
    if (user.role === 'agency') return true; // Agency sees all
    return { clientUser: { equals: user.id } }; // Clients see only own
  },
  update: ({ req: { user } }) => {
    if (!user) return false;
    return user.role === 'agency'; // Only agency can update
  },
  delete: ({ req: { user } }) => {
    if (!user) return false;
    return user.role === 'agency'; // Only agency can delete
  },
}
```

### Hooks

```typescript
{
  beforeChange: [
    // Generate invoice number on creation
    async ({ data, req, operation }) => {
      if (operation === 'create') {
        const count = await payload.count({ collection: 'invoices' });
        data.invoiceNumber = `INV-${String(count.totalDocs + 1).padStart(6, '0')}`;
      }
      return data;
    },

    // Set createdBy to current user on creation
    async ({ data, req, operation }) => {
      if (operation === 'create' && req.user) {
        data.createdBy = req.user.id;
      }
      return data;
    },

    // Calculate totalHours from tickets
    async ({ data, req, operation }) => {
      if (data.tickets && data.tickets.length > 0) {
        const tickets = await payload.find({
          collection: 'tickets',
          where: {
            id: { in: data.tickets },
          },
        });

        data.totalHours = tickets.docs.reduce((sum, ticket) => sum + ticket.actualHours, 0);
      }
      return data;
    },

    // Calculate totalAmount
    async ({ data }) => {
      if (data.totalHours && data.hourlyRate) {
        data.totalAmount = data.totalHours * data.hourlyRate;
      }
      return data;
    },

    // Set dueDate on creation (5 business days)
    async ({ data, operation }) => {
      if (operation === 'create') {
        data.dueDate = addBusinessDays(new Date(), 5);
      }
      return data;
    },

    // Set paidDate when status changes to paid
    async ({ data, operation, originalDoc }) => {
      if (data.status === 'paid' && originalDoc?.status !== 'paid') {
        data.paidDate = new Date();
      }
      return data;
    },
  ],

  afterChange: [
    // Move tickets to "Paid & Closed" when invoice paid
    async ({ doc, req, operation, previousDoc }) => {
      if (doc.status === 'paid' && previousDoc?.status !== 'paid') {
        for (const ticketId of doc.tickets) {
          await payload.update({
            collection: 'tickets',
            id: ticketId,
            data: {
              status: 'paid_closed',
              invoice: doc.id,
            },
          });
        }

        // Reactivate client
        await payload.update({
          collection: 'users',
          id: doc.clientUser,
          data: { isActive: true },
        });
      }
    },

    // Send invoice notification
    async ({ doc, operation }) => {
      if (operation === 'create') {
        await sendInvoiceNotification(doc);
      }
    },
  ],
}
```

### Example Document

```json
{
  "id": "invoice_jkl012",
  "invoiceNumber": "INV-000123",
  "billingPeriodStart": "2025-10-01T00:00:00Z",
  "billingPeriodEnd": "2025-10-15T00:00:00Z",
  "tickets": ["ticket_def456", "ticket_abc789", "ticket_xyz321"],
  "clientUser": "user_abc123",
  "createdBy": "user_agency456",
  "totalHours": 42.5,
  "hourlyRate": 100,
  "totalAmount": 4250,
  "status": "pending",
  "dueDate": "2025-10-22T00:00:00Z",
  "paidDate": null,
  "notes": "Payment due within 5 business days",
  "createdAt": "2025-10-15T16:00:00Z",
  "updatedAt": "2025-10-15T16:00:00Z"
}
```

---

## Collection: Notifications (Optional)

**Purpose:** In-app notification system

**Location:** [src/collections/Notifications.ts](../src/collections/Notifications.ts) (to be created)

### Schema

```typescript
{
  slug: 'notifications',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['user', 'type', 'read', 'createdAt'],
    group: 'System',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User who should receive this notification',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Ticket Created', value: 'ticket_created' },
        { label: 'Estimate Provided', value: 'estimate_provided' },
        { label: 'Ticket Approved', value: 'ticket_approved' },
        { label: 'Ticket Ready to Test', value: 'ticket_ready_to_test' },
        { label: 'Ticket Auto-Approved', value: 'ticket_auto_approved' },
        { label: 'Revision Requested', value: 'revision_requested' },
        { label: 'Invoice Generated', value: 'invoice_generated' },
        { label: 'Payment Overdue', value: 'payment_overdue' },
        { label: 'Account Suspended', value: 'account_suspended' },
      ],
    },
    {
      name: 'message',
      type: 'text',
      required: true,
      admin: {
        description: 'Notification message text',
      },
    },
    {
      name: 'relatedTicket',
      type: 'relationship',
      relationTo: 'tickets',
      required: false,
    },
    {
      name: 'relatedInvoice',
      type: 'relationship',
      relationTo: 'invoices',
      required: false,
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether user has read this notification',
      },
    },
    {
      name: 'link',
      type: 'text',
      required: false,
      admin: {
        description: 'URL to navigate to when notification clicked',
      },
    },
  ],
  timestamps: true,
}
```

### Access Control

```typescript
{
  create: () => true, // System-generated
  read: ({ req: { user } }) => {
    if (!user) return false;
    return { user: { equals: user.id } }; // Users see only own
  },
  update: ({ req: { user } }) => {
    if (!user) return false;
    return { user: { equals: user.id } }; // Users can only update own (mark as read)
  },
  delete: ({ req: { user } }) => {
    if (!user) return false;
    return { user: { equals: user.id } }; // Users can delete own
  },
}
```

### Example Document

```json
{
  "id": "notif_mno345",
  "user": "user_abc123",
  "type": "ticket_ready_to_test",
  "message": "Your ticket 'Add user profile page' is ready for testing",
  "relatedTicket": "ticket_def456",
  "relatedInvoice": null,
  "read": false,
  "link": "/kanban?ticket=ticket_def456",
  "createdAt": "2025-10-20T09:00:00Z",
  "updatedAt": "2025-10-20T09:00:00Z"
}
```

---

## Database Relationships Diagram

```
Users
  ├─ hasMany → Tickets (createdBy)
  ├─ hasMany → Tickets (assignedTo)
  ├─ hasMany → TimeLogs (user)
  ├─ hasMany → Invoices (clientUser)
  ├─ hasMany → Invoices (createdBy)
  └─ hasMany → Notifications (user)

Tickets
  ├─ belongsTo → Users (createdBy)
  ├─ belongsTo → Users (assignedTo)
  ├─ belongsTo → Tickets (parentTicket) [self-referential]
  ├─ belongsTo → Invoices (invoice)
  ├─ hasMany → TimeLogs (ticket)
  └─ hasMany → Notifications (relatedTicket)

TimeLogs
  ├─ belongsTo → Tickets (ticket)
  └─ belongsTo → Users (user)

Invoices
  ├─ belongsTo → Users (clientUser)
  ├─ belongsTo → Users (createdBy)
  ├─ hasMany → Tickets (tickets)
  └─ hasMany → Notifications (relatedInvoice)

Notifications
  ├─ belongsTo → Users (user)
  ├─ belongsTo → Tickets (relatedTicket)
  └─ belongsTo → Invoices (relatedInvoice)
```

---

## Status Transition Rules

### Valid Ticket Status Transitions

```typescript
const validTransitions = {
  to_estimate: ['needs_client_review'], // Agency provides estimate
  needs_client_review: ['to_estimate', 'ready_to_develop', 'cancelled'], // Client approves/revises/cancels
  ready_to_develop: ['development_in_progress'], // Agency starts work
  development_in_progress: ['ready_to_test'], // Agency completes and tests
  ready_to_test: ['done', 'development_in_progress'], // Client accepts or requests revision
  done: ['paid_closed'], // Invoice paid
  paid_closed: [], // Terminal state
  cancelled: [], // Terminal state
};

function validateStatusTransition(from: string, to: string, userRole: string): boolean {
  if (!validTransitions[from]?.includes(to)) {
    return false;
  }

  // Role-specific validations
  if (userRole === 'client') {
    // Clients can only transition from needs_client_review and ready_to_test
    if (!['needs_client_review', 'ready_to_test'].includes(from)) {
      return false;
    }
  }

  return true;
}
```

---

## Indexes for Performance

### Recommended Database Indexes

```sql
-- Tickets collection
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_testing_start_date ON tickets(testing_start_date);

-- TimeLogs collection
CREATE INDEX idx_time_logs_ticket ON time_logs(ticket);
CREATE INDEX idx_time_logs_user ON time_logs(user);
CREATE INDEX idx_time_logs_date ON time_logs(date);

-- Invoices collection
CREATE INDEX idx_invoices_client_user ON invoices(client_user);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Notifications collection
CREATE INDEX idx_notifications_user ON notifications(user);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## Type Definitions (Generated)

After creating collections, Payload will auto-generate TypeScript types at [src/payload-types.ts](../src/payload-types.ts).

### Example Usage in Code

```typescript
import { Ticket, TimeLog, Invoice, User } from '@/payload-types';

// Type-safe ticket creation
const newTicket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> = {
  title: 'New feature request',
  description: 'Add dark mode toggle',
  priority: 'high',
  status: 'to_estimate',
  createdBy: currentUser.id,
  // ... other fields
};

// Type-safe time log
const timeLog: Omit<TimeLog, 'id' | 'createdAt' | 'updatedAt'> = {
  ticket: ticketId,
  user: currentUser.id,
  hours: 3.5,
  description: 'Implemented dark mode toggle',
  date: new Date(),
  isBillable: true,
};
```

---

## Migration Strategy

### Initial Setup

1. Create all collections in Payload CMS
2. Run `pnpm generate:types` to generate TypeScript types
3. Create initial admin/agency user via Payload admin panel
4. Test CRUD operations in admin panel
5. Apply database indexes
6. Test access control rules

### Data Seeding (Development)

Create seed script at [src/scripts/seed.ts](../src/scripts/seed.ts):

```typescript
// Seed test users (client and agency)
// Seed test tickets in various states
// Seed test time logs
// Seed test invoices
```

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-22
**Related Documentation:**
- [Project Architecture](./PROJECT_ARCHITECTURE.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Workflow Logic](./WORKFLOW_LOGIC.md)
