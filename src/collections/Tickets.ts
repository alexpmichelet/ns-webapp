import type { CollectionConfig } from 'payload'

// Workflow states as defined in WORKFLOW_LOGIC.md
export type TicketStatus =
  | 'pending_review'
  | 'in_progress'
  | 'blocked'
  | 'pending_client_review'
  | 'revision_requested'
  | 'approved'
  | 'invoiced'
  | 'paid'

export const Tickets: CollectionConfig = {
  slug: 'payload-tickets',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'status', 'priority', 'estimatedHours', 'createdAt'],
    group: 'Work Management',
  },
  access: {
    // Clients can only see their own tickets, admins see all
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        client: {
          equals: user.id,
        },
      }
    },
    // Clients can create tickets
    create: ({ req: { user } }) => {
      return !!user
    },
    // Only admins can update tickets (except client can add comments)
    update: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    // Only admins can delete
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 200,
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'payload-users',
      required: true,
      index: true,
      hasMany: false,
      filterOptions: {
        role: {
          equals: 'client',
        },
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending_review',
      index: true,
      options: [
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Blocked', value: 'blocked' },
        { label: 'Pending Client Review', value: 'pending_client_review' },
        { label: 'Revision Requested', value: 'revision_requested' },
        { label: 'Approved', value: 'approved' },
        { label: 'Invoiced', value: 'invoiced' },
        { label: 'Paid', value: 'paid' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'estimatedHours',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Estimated hours to complete',
        position: 'sidebar',
      },
    },
    {
      name: 'actualHours',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
        description: 'Total hours logged (auto-calculated)',
        position: 'sidebar',
      },
    },
    {
      name: 'requiresClientApproval',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Require client approval before invoicing',
        position: 'sidebar',
      },
    },
    {
      name: 'approvalDeadline',
      type: 'date',
      admin: {
        condition: (data) => data?.requiresClientApproval === true,
        description: 'Auto-approve if client does not respond by this date',
        position: 'sidebar',
      },
    },
    {
      name: 'autoApprovalHours',
      type: 'number',
      defaultValue: 72,
      min: 1,
      admin: {
        condition: (data) => data?.requiresClientApproval === true,
        description: 'Hours to wait before auto-approval',
        position: 'sidebar',
      },
    },
    {
      name: 'revisionCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
        description: 'Number of revisions requested',
        position: 'sidebar',
      },
    },
    {
      name: 'maxRevisions',
      type: 'number',
      defaultValue: 2,
      min: 0,
      admin: {
        description: 'Maximum allowed revisions before extra charges',
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'attachments',
      type: 'relationship',
      relationTo: 'payload-media',
      hasMany: true,
    },
    {
      name: 'blockedReason',
      type: 'textarea',
      admin: {
        condition: (data) => data?.status === 'blocked',
        description: 'Why is this ticket blocked?',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'invoice',
      type: 'relationship',
      relationTo: 'payload-invoices',
      hasMany: false,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional ticket metadata',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data = {} as any, req, operation, originalDoc }) => {
        // Set client to current user if creating and not admin
        if (operation === 'create' && req.user && req.user?.role !== 'admin') {
          data.client = (req.user as any).id
        }

        // Track status changes
        if (originalDoc && originalDoc.status !== data.status) {
          // Set completedAt when approved
          if (data.status === 'approved' && !data.completedAt) {
            data.completedAt = new Date().toISOString()
          }

          // Increment revision count
          if (data.status === 'revision_requested') {
            data.revisionCount = (data.revisionCount || 0) + 1
          }

          // Set approval deadline for pending client review
          if (data.status === 'pending_client_review' && data.requiresClientApproval) {
            const deadline = new Date()
            deadline.setHours(deadline.getHours() + (data.autoApprovalHours || 72))
            data.approvalDeadline = deadline.toISOString()
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Send notifications on status change
        if (previousDoc && previousDoc.status !== doc.status) {
          // TODO: Queue notification based on status transition
          // This will be implemented in the notification system
        }
      },
    ],
  },
}
