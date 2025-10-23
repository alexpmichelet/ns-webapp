import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'payload-users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'isActive'],
  },
  access: {
    // Only admins can create users
    create: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    // Users can read their own data, admins can read all
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
    // Users can update their own data, admins can update all
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
    // Only admins can delete
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'company',
      type: 'text',
      admin: {
        condition: (data) => data?.role === 'client',
      },
    },
    {
      name: 'hourlyRate',
      type: 'number',
      required: true,
      defaultValue: 100,
      admin: {
        description: 'Rate in USD per hour',
        condition: (data) => data?.role === 'client',
      },
      access: {
        // Only admins can modify rates
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      admin: {
        readOnly: true,
        condition: (data) => data?.role === 'client',
      },
      access: {
        read: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // On create, ensure role is set
        if (operation === 'create' && !data.role) {
          data.role = 'client'
        }

        return data
      },
    ],
  },
}
