import type { CollectionConfig } from 'payload'
import { nanoid } from 'nanoid'

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'

export const Invoices: CollectionConfig = {
  slug: 'payload-invoices',
  admin: {
    useAsTitle: 'invoiceNumber',
    defaultColumns: ['invoiceNumber', 'client', 'status', 'totalAmount', 'dueDate'],
    group: 'Work Management',
  },
  access: {
    // Clients can see their own invoices, admins see all
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        client: {
          equals: user.id,
        },
      }
    },
    // Only admins can create invoices
    create: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    // Only admins can update invoices (unless paid via Stripe webhook)
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
      name: 'invoiceNumber',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
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
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tickets',
      type: 'relationship',
      relationTo: 'payload-tickets',
      required: true,
      hasMany: true,
      admin: {
        description: 'Tickets included in this invoice',
      },
    },
    {
      name: 'timeLogs',
      type: 'relationship',
      relationTo: 'payload-time-logs',
      hasMany: true,
      admin: {
        readOnly: true,
        description: 'Time logs included (auto-populated from tickets)',
      },
    },
    {
      name: 'lineItems',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'description',
          type: 'text',
          required: true,
        },
        {
          name: 'hours',
          type: 'number',
          required: true,
        },
        {
          name: 'rate',
          type: 'number',
          required: true,
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
        },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'taxRate',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 100,
      admin: {
        description: 'Tax rate as percentage (e.g., 10 for 10%)',
        position: 'sidebar',
      },
    },
    {
      name: 'taxAmount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'totalAmount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'issueDate',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'dueDate',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paidAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes (not shown to client)',
      },
    },
    {
      name: 'terms',
      type: 'textarea',
      admin: {
        description: 'Payment terms shown on invoice',
      },
    },
    {
      name: 'stripeInvoiceId',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'stripePaymentIntentId',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'paymentUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Stripe payment link sent to client',
      },
    },
    {
      name: 'pdfUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'URL to generated PDF invoice',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional invoice metadata',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data = {} as any, req, operation }) => {
        // Generate invoice number for new invoices
        if (operation === 'create' && !data.invoiceNumber) {
          const year = new Date().getFullYear()
          const prefix = `INV-${year}-`
          const randomId = nanoid(8).toUpperCase()
          data.invoiceNumber = `${prefix}${randomId}`
        }

        // Set default issue date
        if (operation === 'create' && !data.issueDate) {
          data.issueDate = new Date().toISOString()
        }

        // Set default due date (30 days from issue)
        if (operation === 'create' && !data.dueDate) {
          const dueDate = new Date((data as any).issueDate || new Date())
          dueDate.setDate(dueDate.getDate() + 30)
          data.dueDate = dueDate.toISOString()
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data = {} as any, req, operation, originalDoc }) => {
        // Prevent editing paid invoices
        if (originalDoc?.status === 'paid' && operation === 'update') {
          if (data.status !== 'paid' || data.totalAmount !== originalDoc.totalAmount) {
            throw new Error('Cannot modify paid invoices')
          }
        }

        // Fetch time logs for all tickets
        if (data.tickets && data.tickets.length > 0) {
          try {
            const timeLogs = await req.payload.find({
              collection: 'payload-time-logs',
              where: {
                ticket: {
                  in: data.tickets,
                },
                isInvoiced: {
                  equals: false,
                },
                isBillable: {
                  equals: true,
                },
              },
              limit: 1000,
            })

            data.timeLogs = timeLogs.docs.map((log: any) => (log as any).id)

            // Build line items
            const lineItemsMap = new Map()

            for (const log of timeLogs.docs as any[]) {
              const ticket = await req.payload.findByID({
                collection: 'payload-tickets',
                id:
                  typeof (log as any).ticket === 'string'
                    ? (log as any).ticket
                    : (log as any).ticket.id,
              })

              const key = `${ticket.id}-${log.hourlyRate}`

              if (lineItemsMap.has(key)) {
                const item = lineItemsMap.get(key)
                item.hours += log.hours
                item.amount += log.totalAmount
              } else {
                lineItemsMap.set(key, {
                  description: ticket.title,
                  hours: log.hours,
                  rate: log.hourlyRate,
                  amount: log.totalAmount,
                })
              }
            }

            data.lineItems = Array.from(lineItemsMap.values()) as any

            // Calculate totals
            data.subtotal = (data.lineItems as any[]).reduce(
              (sum: number, item: any) => sum + item.amount,
              0,
            )
            data.taxAmount = (data.subtotal * ((data as any).taxRate || 0)) / 100
            data.totalAmount = data.subtotal + (data as any).taxAmount

            // Round to 2 decimal places
            data.subtotal = Number(data.subtotal.toFixed(2))
            data.taxAmount = Number(data.taxAmount.toFixed(2))
            data.totalAmount = Number(data.totalAmount.toFixed(2))
          } catch (error) {
            console.error('Error calculating invoice totals:', error)
            throw error
          }
        }

        // Set paidAt when status changes to paid
        if (data.status === 'paid' && !data.paidAt) {
          data.paidAt = new Date().toISOString()
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Mark time logs as invoiced
        if (doc.timeLogs && doc.timeLogs.length > 0) {
          for (const logId of doc.timeLogs) {
            await req.payload.update({
              collection: 'payload-time-logs',
              id: typeof logId === 'string' ? logId : logId.id,
              data: {
                invoice: doc.id,
                isInvoiced: true,
              },
            })
          }
        }

        // Update ticket statuses when invoice is created
        if (operation === 'create' && doc.tickets) {
          for (const ticketId of doc.tickets) {
            await req.payload.update({
              collection: 'payload-tickets',
              id: typeof ticketId === 'string' ? ticketId : ticketId.id,
              data: {
                status: 'invoiced',
                invoice: doc.id,
              },
            })
          }
        }

        // Update ticket statuses when invoice is paid
        if (previousDoc?.status !== 'paid' && doc.status === 'paid' && doc.tickets) {
          for (const ticketId of doc.tickets) {
            await req.payload.update({
              collection: 'payload-tickets',
              id: typeof ticketId === 'string' ? ticketId : ticketId.id,
              data: {
                status: 'paid',
              },
            })
          }
        }

        // TODO: Create Stripe invoice and send to client
        // This will be implemented in the Stripe integration
      },
    ],
  },
}
