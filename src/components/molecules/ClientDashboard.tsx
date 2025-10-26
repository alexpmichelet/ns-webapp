'use client'

import { useMemo } from 'react'
import { authClient } from '@/lib/auth/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Button } from '@/components/atoms/button'
import Link from 'next/link'
import TicketCreateDrawer from '@/components/molecules/tickets/TicketCreateDrawer'
import { payloadHook } from '@/lib/data/payload'

export default function ClientDashboard() {
  const session = authClient.useSession()
  const user = session?.data?.user as { id: string; name: string; role: string } | undefined

  const { data: ticketsRes } = payloadHook.find(
    {
      collection: 'payload-tickets',
      where: {
        client: { equals: user?.id },
      },
      limit: 100,
      sort: '-createdAt',
    } as any,
    { enabled: !!user?.id },
  )
  const tickets = (ticketsRes as any)?.docs || []

  const { activeTickets, completedTickets } = useMemo(() => {
    const active = tickets.filter((t: any) => !['paid_closed'].includes(t.status)).length
    const completed = tickets.filter((t: any) => t.status === 'paid_closed').length
    return {
      activeTickets: active,
      completedTickets: completed,
    }
  }, [tickets])

  const pendingReviews = useMemo(() => {
    return tickets.filter((t: any) => t.status === 'needs_client_review').length
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews}</div>
            <p className="text-xs text-muted-foreground">Estimates awaiting your approval</p>
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
          <Link href="/tickets/pending-reviews">
            <Button>Pending Reviews</Button>
          </Link>
          <Link href="/tickets/testing">
            <Button>Testing Dashboard</Button>
          </Link>
          {/* Invoice links removed */}
        </CardContent>
      </Card>

      {/* Recent invoices card removed */}
    </div>
  )
}
