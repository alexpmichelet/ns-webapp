'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/atoms/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Badge } from '@/components/atoms/badge'

const statusColors: Record<string, string> = {
  pending_review: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  blocked: 'bg-red-500',
  pending_client_review: 'bg-purple-500',
  revision_requested: 'bg-orange-500',
  approved: 'bg-green-500',
  invoiced: 'bg-teal-500',
  paid: 'bg-gray-500',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-600',
}

export default function TicketsPage() {
  const router = useRouter()
  const session = authClient.useSession()
  const [tickets, setTickets] = useState<any[]>([])

  useEffect(() => {
    const user = session?.data?.user as { id: string } | undefined
    if (!user) {
      router.replace('/sign-in')
    }
  }, [session?.data?.user, router])

  useEffect(() => {
    const user = session?.data?.user as { id: string } | undefined
    if (!user?.id) return

    const fetchTickets = async () => {
      try {
        const res = await fetch(`/api/tickets?clientId=${user.id}&limit=100`, { cache: 'no-store' })
        const json = await res.json()
        const docs = Array.isArray(json.tickets) ? json.tickets : []
        // Filter client-side just in case API doesn't filter by clientId
        const filtered = docs.filter((t: any) => {
          const client = t.client
          if (!client) return false
          if (typeof client === 'string') return client === user.id
          return client.id === user.id
        })
        setTickets(filtered)
      } catch (e) {
        setTickets([])
      }
    }

    fetchTickets()
  }, [session?.data?.user?.id])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Tickets</h1>
          <p className="text-muted-foreground">View and manage your support tickets</p>
        </div>
        <Link href="/tickets/new">
          <Button>Submit New Ticket</Button>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t submitted any tickets yet.
            </p>
            <Link href="/tickets/new">
              <Button>Submit Your First Ticket</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket: any) => (
            <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                      <CardTitle>{ticket.title}</CardTitle>
                    </Link>
                    <div className="flex gap-2 mt-2">
                      <Badge className={`${statusColors[ticket.status]} text-white`}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${priorityColors[ticket.priority]} text-white`}
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                  <Link href={`/tickets/${ticket.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estimated:</span>
                    <p className="font-medium">{ticket.estimatedHours}h</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Actual:</span>
                    <p className="font-medium">{ticket.actualHours || 0}h</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Progress:</span>
                    <p className="font-medium">
                      {ticket.estimatedHours > 0
                        ? Math.round(((ticket.actualHours || 0) / ticket.estimatedHours) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
