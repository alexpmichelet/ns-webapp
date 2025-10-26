// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { auth } from './plugins/auth'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Tickets } from './collections/Tickets'
import { Projects } from './collections/Projects'
import { TimeLogs } from './collections/TimeLogs'
import { Notifications } from './collections/Notifications'
import { Companies } from './collections/Companies'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  collections: [Users, Media, Projects, Tickets, TimeLogs, Notifications, Companies],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    idType: 'uuid',
  }),
  sharp,
  plugins: [
    // storage-adapter-placeholder
    auth,
  ],
})
