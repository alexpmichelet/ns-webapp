'use client'

import { useEffect, useMemo, useState } from 'react'
import { authClient } from '@/lib/auth/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Button } from '@/components/atoms/button'
import Link from 'next/link'
import TicketCreateDrawer from '@/components/molecules/tickets/TicketCreateDrawer'

export default function ClientDashboard() {
  const session = authClient.useSession()
  const user = session?.data?.user as { id: string; name: string; role: string } | undefined

  const [tickets, setTickets] = useState<any[]>([])

  useEffect(() => {
    if (!user?.id) return
    const fetchData = async () => {
      try {
        const ticketsRes = await fetch(`/api/tickets?clientId=${user.id}&limit=100`, {
          cache: 'no-store',
        })
        const ticketsJson = await ticketsRes.json()
        setTickets(Array.isArray(ticketsJson.tickets) ? ticketsJson.tickets : [])
      } catch (e) {
        setTickets([])
      }
    }
    fetchData()
  }, [user?.id])

  const { activeTickets, completedTickets } = useMemo(() => {
    const active = tickets.filter((t: any) => !['paid', 'cancelled'].includes(t.status)).length
    const completed = tickets.filter((t: any) => t.status === 'paid').length
    return {
      activeTickets: active,
      completedTickets: completed,
    }
  }, [tickets])

  if (!user) return null

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your projects and invoices
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTickets}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTickets}</div>
            <p className="text-xs text-muted-foreground">Tickets completed and paid</p>
          </CardContent>
        </Card>

        {/* Invoices widgets removed */}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <TicketCreateDrawer triggerLabel="Submit New Ticket" />
          <Link href="/tickets">
            <Button variant="outline">View All Tickets</Button>
          </Link>
          {/* Invoice links removed */}
        </CardContent>
      </Card>

      {/* Recent invoices card removed */}
    </div>
  )
}
