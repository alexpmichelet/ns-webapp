import type { CollectionConfig } from 'payload'

export type TicketPriority = 'low' | 'medium' | 'high' | 'absolute'
export type TicketStatus =
  | 'to_estimate'
  | 'needs_client_review'
  | 'ready_to_develop'
  | 'development_in_progress'
  | 'ready_to_test'
  | 'done'
  | 'paid_closed'

export const Tickets: CollectionConfig = {
  slug: 'payload-tickets',
  admin: {
    useAsTitle: 'ticketNumber',
    defaultColumns: [
      'ticketNumber',
      'project',
      'client',
      'status',
      'priority',
      'estimatedHours',
      'createdAt',
    ],
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
      name: 'ticketNumber',
      type: 'text',
      required: true,
      admin: { readOnly: true, position: 'sidebar' },
      index: true,
    },
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
      name: 'project',
      type: 'relationship',
      relationTo: 'payload-projects',
      required: true,
      hasMany: false,
      index: true,
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
      defaultValue: 'to_estimate',
      index: true,
      options: [
        { label: 'To Estimate', value: 'to_estimate' },
        { label: 'Needs Client Review', value: 'needs_client_review' },
        { label: 'Ready To Develop', value: 'ready_to_develop' },
        { label: 'Development In Progress', value: 'development_in_progress' },
        { label: 'Ready To Test', value: 'ready_to_test' },
        { label: 'Done', value: 'done' },
        { label: 'Paid / Closed', value: 'paid_closed' },
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
        { label: 'Absolute', value: 'absolute' },
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
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'payload-users',
      required: true,
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
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'payload-users',
      hasMany: true,
      filterOptions: {
        role: {
          not_equals: 'client',
        },
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isRevision',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
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
      defaultValue: 3,
      min: 0,
      admin: {
        description: 'Maximum allowed revisions before extra charges',
        position: 'sidebar',
      },
    },
    {
      name: 'parentTicket',
      type: 'relationship',
      relationTo: 'payload-tickets',
      hasMany: false,
      admin: { description: 'Parent ticket for revisions' },
    },
    {
      name: 'testingStartDate',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'testingDeadline',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'autoApprovalDate',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'attachments',
      type: 'relationship',
      relationTo: 'payload-media',
      hasMany: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data = {} as any, req, operation, originalDoc, collection }) => {
        // Set createdBy to current user if creating and user is client
        if (operation === 'create' && req.user && req.user?.role === 'client') {
          data.createdBy = (req.user as any).id
          data.client = (req.user as any).id
        }

        // Ensure ticketNumber exists; generate if missing
        if (!data.ticketNumber) {
          // Generate sequential number per project: REQ-XXX
          const prefix = 'REQ-'
          // Find last ticket for project sorted by createdAt desc
          const last = await req.payload.find({
            collection: collection.slug,
            where: { project: { equals: data.project } },
            sort: '-createdAt',
            limit: 1,
          })
          let nextNumber = 1
          if (last.docs && last.docs.length > 0) {
            const lastDoc = last.docs[0] as any
            const match = String(lastDoc.ticketNumber || '').match(/REQ-(\d{3,})$/)
            if (match) nextNumber = parseInt(match[1], 10) + 1
          }
          data.ticketNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`
        }

        // Auto-calc testingDeadline = testingStartDate + 5 business days
        if (data.testingStartDate) {
          const start = new Date(data.testingStartDate)
          let daysAdded = 0
          const result = new Date(start)
          while (daysAdded < 5) {
            result.setDate(result.getDate() + 1)
            const day = result.getDay()
            if (day !== 0 && day !== 6) {
              daysAdded += 1
            }
          }
          data.testingDeadline = result.toISOString()
        }

        // Maintain revision count if isRevision toggled or parentTicket set
        if (data.isRevision || data.parentTicket) {
          data.revisionCount = data.revisionCount || 0
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Placeholder for future notifications
      },
    ],
  },
}
