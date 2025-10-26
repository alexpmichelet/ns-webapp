import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'payload-media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
    },
  ],
  upload: true,
}
