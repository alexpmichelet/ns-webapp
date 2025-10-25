import type { CollectionConfig } from 'payload'

export const Companies: CollectionConfig = {
  slug: 'payload-companies',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'members', 'createdAt'],
    group: 'Work Management',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        members: {
          contains: user.id,
        },
      }
    },
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'payload-users',
      hasMany: true,
      index: true,
      admin: {
        description: 'Users that belong to this company',
      },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Stripe Customer ID used for billing',
      },
      access: {
        read: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
}
