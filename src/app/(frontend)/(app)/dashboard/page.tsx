'use client'

import { authClient } from '@/lib/auth/client'
import AdminDashboard from '@/components/molecules/AdminDashboard'
import ClientDashboard from '@/components/molecules/ClientDashboard'

export default function DashboardPage() {
  const session = authClient.useSession()

  console.log('Session: ', session)
  const user = session?.data?.user as { id: string; name: string; role: string } | undefined

  if (!user) return <p>loading...</p>

  if (user.role === 'admin') {
    return <AdminDashboard />
  }

  return <ClientDashboard />
}
