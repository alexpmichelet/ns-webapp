import type { CollectionConfig } from 'payload'

export type NotificationType =
  | 'ticket_created'
  | 'estimate_ready'
  | 'ticket_approved'
  | 'testing_ready'
  | 'auto_approval_warning'
  | 'revision_requested'
  | 'payment_marked'

export const Notifications: CollectionConfig = {
  slug: 'payload-notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'recipient', 'type', 'isRead', 'createdAt'],
    group: 'System',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        recipient: { equals: user.id },
      }
    },
    create: () => true,
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'payload-users',
      required: true,
      index: true,
      hasMany: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'payload-projects',
      hasMany: false,
      admin: { description: 'Related project if applicable' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Ticket Created', value: 'ticket_created' },
        { label: 'Estimate Ready', value: 'estimate_ready' },
        { label: 'Ticket Approved', value: 'ticket_approved' },
        { label: 'Testing Ready', value: 'testing_ready' },
        { label: 'Auto Approval Warning', value: 'auto_approval_warning' },
        { label: 'Revision Requested', value: 'revision_requested' },
        { label: 'Payment Marked', value: 'payment_marked' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'text',
      required: true,
    },
    {
      name: 'isRead',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'relatedTicket',
      type: 'relationship',
      relationTo: 'payload-tickets',
      hasMany: false,
      admin: { description: 'Related ticket if applicable' },
    },
  ],
}
