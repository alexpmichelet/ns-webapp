'use client'

import { authClient } from '@/lib/auth/client'
import AdminDashboard from '@/components/molecules/AdminDashboard'
import ClientDashboard from '@/components/molecules/ClientDashboard'
import { payloadHook } from '@/lib/data/payload'

export default function DashboardPage() {
  const session = authClient.useSession()

  console.log('Session: ', session)
  const user = session?.data?.user as { id: string; name: string; role: string } | undefined

  // Example: warm up a lightweight query so the provider is verified and ready
  payloadHook.count(
    {
      collection: 'payload-tickets',
    },
    { enabled: false },
  )

  if (!user) return <p>loading...</p>

  if (user.role === 'admin') {
    return <AdminDashboard />
  }

  return <ClientDashboard />
}
