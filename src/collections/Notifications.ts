import type { CollectionConfig } from 'payload'

export type NotificationType =
  | 'ticket_created'
  | 'ticket_status_changed'
  | 'ticket_approved'
  | 'ticket_revision_requested'
  | 'time_logged'
  | 'invoice_created'
  | 'invoice_due'
  | 'invoice_overdue'
  | 'payment_received'

export type NotificationChannel = 'email' | 'in_app' | 'both'

export const Notifications: CollectionConfig = {
  slug: 'payload-notifications',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'recipient', 'type', 'status', 'createdAt'],
    group: 'System',
  },
  access: {
    // Users can see their own notifications, admins see all
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        recipient: {
          equals: user.id,
        },
      }
    },
    // System creates notifications
    create: () => true,
    // Only admins can update (for marking as sent/failed)
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
      name: 'recipient',
      type: 'relationship',
      relationTo: 'payload-users',
      required: true,
      index: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Ticket Created', value: 'ticket_created' },
        { label: 'Ticket Status Changed', value: 'ticket_status_changed' },
        { label: 'Ticket Approved', value: 'ticket_approved' },
        { label: 'Ticket Revision Requested', value: 'ticket_revision_requested' },
        { label: 'Time Logged', value: 'time_logged' },
        { label: 'Invoice Created', value: 'invoice_created' },
        { label: 'Invoice Due', value: 'invoice_due' },
        { label: 'Invoice Overdue', value: 'invoice_overdue' },
        { label: 'Payment Received', value: 'payment_received' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'channel',
      type: 'select',
      required: true,
      defaultValue: 'email',
      options: [
        { label: 'Email', value: 'email' },
        { label: 'In-App', value: 'in_app' },
        { label: 'Both', value: 'both' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'richText',
      required: true,
    },
    {
      name: 'plainTextMessage',
      type: 'textarea',
      admin: {
        description: 'Plain text version for email',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Read', value: 'read' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'readAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'relatedTicket',
      type: 'relationship',
      relationTo: 'payload-tickets',
      hasMany: false,
      admin: {
        description: 'Related ticket if applicable',
      },
    },
    {
      name: 'relatedInvoice',
      type: 'relationship',
      relationTo: 'payload-invoices',
      hasMany: false,
      admin: {
        description: 'Related invoice if applicable',
      },
    },
    {
      name: 'relatedTimeLog',
      type: 'relationship',
      relationTo: 'payload-time-logs',
      hasMany: false,
      admin: {
        description: 'Related time log if applicable',
      },
    },
    {
      name: 'emailData',
      type: 'json',
      admin: {
        description: 'Additional data for email template',
      },
    },
    {
      name: 'error',
      type: 'textarea',
      admin: {
        readOnly: true,
        description: 'Error message if sending failed',
      },
    },
    {
      name: 'retryCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional notification metadata',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        // Queue email sending for pending notifications
        if (doc.status === 'pending' && (doc.channel === 'email' || doc.channel === 'both')) {
          // TODO: Queue email sending job
          // This will be implemented with the email service
        }
      },
    ],
  },
}
