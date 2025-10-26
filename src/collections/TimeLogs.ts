import type { CollectionConfig } from 'payload'

export const TimeLogs: CollectionConfig = {
  slug: 'payload-time-logs',
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['ticket', 'user', 'hours', 'date', 'isBillable'],
    group: 'Work Management',
  },
  access: {
    // Admins can see all, clients can see logs for their tickets
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        'ticket.client': {
          equals: user.id,
        },
      }
    },
    // Only admins can create time logs
    create: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    // Only admins can update time logs
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
      name: 'ticket',
      type: 'relationship',
      relationTo: 'payload-tickets',
      required: true,
      index: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'payload-users',
      required: true,
      index: true,
      hasMany: false,
      filterOptions: {
        role: {
          equals: 'admin',
        },
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      maxLength: 1000,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'startTime',
      type: 'date',
      admin: {
        description: 'When work started',
        date: {
          displayFormat: 'h:mm a',
        },
      },
    },
    {
      name: 'endTime',
      type: 'date',
      admin: {
        description: 'When work ended',
        date: {
          displayFormat: 'h:mm a',
        },
      },
    },
    {
      name: 'hours',
      type: 'number',
      required: true,
      min: 0.25, // 15 minute minimum
      max: 24, // 24 hour maximum per entry
      admin: {
        description: 'Hours worked (minimum 0.25, rounds to nearest 0.25)',
        position: 'sidebar',
      },
    },
    {
      name: 'isBillable',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'hourlyRate',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        readOnly: true,
        description: 'Rate at time of logging (from client)',
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
        description: 'Calculated: hours × hourlyRate',
        position: 'sidebar',
      },
    },
    {
      name: 'invoice',
      type: 'relationship',
      relationTo: 'payload-companies',
      hasMany: false,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'isInvoiced',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
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
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional time log metadata',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data = {} as any, req, operation }) => {
        // Round hours to nearest 0.25
        if ((data as any).hours) {
          data.hours = Math.round((data as any).hours * 4) / 4
        }

        // Calculate hours from start/end time if provided
        if ((data as any).startTime && (data as any).endTime && !data.hours) {
          const start = new Date((data as any).startTime)
          const end = new Date((data as any).endTime)
          const diffMs = end.getTime() - start.getTime()
          const diffHours = diffMs / (1000 * 60 * 60)
          data.hours = Math.round(diffHours * 4) / 4
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data = {} as any, req, operation }) => {
        // Set default user to logged-in admin
        if (operation === 'create' && !data.user && req.user) {
          data.user = (req.user as any).id
        }

        // Set default date to today
        if (operation === 'create' && !data.date) {
          data.date = new Date().toISOString()
        }

        // Get client's hourly rate from ticket
        if (operation === 'create' || !data.hourlyRate) {
          try {
            const ticket = await req.payload.findByID({
              collection: 'payload-tickets',
              id: data.ticket,
            })

            if (ticket && ticket.client) {
              const client = await req.payload.findByID({
                collection: 'payload-users',
                id:
                  typeof (ticket as any).client === 'string'
                    ? (ticket as any).client
                    : (ticket as any).client.id,
              })

              if (client && client.hourlyRate) {
                data.hourlyRate = client.hourlyRate
              }
            }
          } catch (error) {
            console.error('Error fetching hourly rate:', error)
          }
        }

        // Calculate total amount
        if (data.hours && data.hourlyRate && data.isBillable) {
          data.totalAmount = Number((Number(data.hours) * Number(data.hourlyRate)).toFixed(2))
        } else {
          data.totalAmount = 0
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Update ticket's actual hours
        try {
          const logs = await req.payload.find({
            collection: 'payload-time-logs',
            where: {
              ticket: {
                equals: doc.ticket,
              },
            },
            limit: 1000,
          })

          const totalHours = logs.docs.reduce((sum, log) => sum + (log.hours || 0), 0)

          await req.payload.update({
            collection: 'payload-tickets',
            id: typeof doc.ticket === 'string' ? doc.ticket : doc.ticket.id,
            data: {
              actualHours: totalHours,
            },
          })
        } catch (error) {
          console.error('Error updating ticket hours:', error)
        }
      },
    ],
    beforeDelete: [
      async ({ req, id }) => {
        // Prevent deletion of invoiced time logs
        const log = await req.payload.findByID({
          collection: 'payload-time-logs',
          id,
        })

        if (log.isInvoiced) {
          throw new Error('Cannot delete time log that has been invoiced')
        }
      },
    ],
  },
}
