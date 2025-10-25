import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'payload-projects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'clientId', 'status', 'createdAt'],
    group: 'Work Management',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        clientId: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 200,
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Completed', value: 'completed' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'clientId',
      type: 'relationship',
      relationTo: 'payload-users',
      required: true,
      index: true,
      hasMany: true,
      filterOptions: {
        role: {
          equals: 'client',
        },
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
