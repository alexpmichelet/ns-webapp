'use client'

import { useMemo } from 'react'
import { authClient } from '@/lib/auth/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Button } from '@/components/atoms/button'
import Link from 'next/link'
import TicketCreateDrawer from '@/components/molecules/tickets/TicketCreateDrawer'
import { TicketKanbanBoard } from '@/components/molecules/TicketKanbanBoard'
import { payloadHook } from '@/lib/data/payload'
import { Plus, Eye, CheckCircle, TestTube } from 'lucide-react'

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
      <div className="mb-8 flex items-center justify-start gap-10 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your projects and tickets
          </p>
        </div>

        <div className="flex gap-3">
          {/* Active Tickets KPI */}
          <div className="group relative flex flex-col items-center justify-center px-6 py-3 rounded-lg border bg-card transition-all hover:shadow-md hover:scale-105">
            <div className="text-sm font-medium text-muted-foreground mb-1">Active Tickets</div>
            <div className="text-2xl font-bold">{activeTickets}</div>
          </div>

          {/* Completed Tickets KPI */}
          <div className="group relative flex flex-col items-center justify-center px-6 py-3 rounded-lg border bg-card transition-all hover:shadow-md hover:scale-105">
            <div className="text-sm font-medium text-muted-foreground mb-1">Completed</div>
            <div className="text-2xl font-bold">{completedTickets}</div>
          </div>

          {/* Pending Reviews KPI */}
          <div className="group relative flex flex-col items-center justify-center px-6 py-3 rounded-lg border bg-card transition-all hover:shadow-md hover:scale-105">
            <div className="text-sm font-medium text-muted-foreground mb-1">Pending Reviews</div>
            <div className="text-2xl font-bold">{pendingReviews}</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4 flex-wrap">
          <TicketCreateDrawer triggerLabel="Submit New Ticket" icon={<Plus />} />

          <Link href="/tickets/pending-reviews">
            <Button>
              <CheckCircle className="w-4 h-4" />
              Pending Reviews
            </Button>
          </Link>
          <Link href="/tickets/testing">
            <Button>
              <TestTube className="w-4 h-4" />
              Testing Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Board</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketKanbanBoard />
        </CardContent>
      </Card>
    </div>
  )
}
