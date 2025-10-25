'use client'

import { useEffect, useState } from 'react'
import { Kanban } from '@/components/ui/shadcn-io/kanban'
import { updateTicketStatus } from '@/app/actions/tickets'
import { Badge } from '@/components/atoms/badge'
import { useToast } from '@/hooks/use-toast'
import type { DragEndEvent } from '@/components/ui/shadcn-io/kanban'
import type { TicketStatus } from '@/collections/Tickets'
import type { PayloadTicket } from '@/payload-types'

type TicketItem = {
  id: string
  name: string
  column: string
  title: string
  priority: PayloadTicket['priority']
  actualHours: number
  estimatedHours: number
  client: PayloadTicket['client']
}

const columns = [
  { id: 'to_estimate', name: 'To Estimate' },
  { id: 'ready_to_develop', name: 'Ready To Dev' },
  { id: 'development_in_progress', name: 'In Dev' },
  { id: 'ready_to_test', name: 'Ready To Test' },
  { id: 'done', name: 'Done' },
]

export function TicketKanbanBoard() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTickets()
  }, [])

  async function loadTickets() {
    try {
      // Fetch all active tickets (not invoiced or paid)
      const response = await fetch('/api/tickets?status=active')
      if (response.ok) {
        const data = await response.json()
        const formattedTickets = (data.tickets as PayloadTicket[]).map((ticket) => ({
          id: String(ticket.id),
          name: ticket.title,
          column: ticket.status,
          title: ticket.title,
          priority: ticket.priority,
          actualHours: ticket.actualHours || 0,
          estimatedHours: ticket.estimatedHours,
          client: ticket.client,
        }))
        setTickets(formattedTickets)
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over) return

    const ticketId = active.id as string
    const newStatus = over.id as TicketStatus

    // Optimistically update UI
    setTickets((tickets) =>
      tickets.map((ticket) => (ticket.id === ticketId ? { ...ticket, column: newStatus } : ticket)),
    )

    // Update on server
    const result = await updateTicketStatus(ticketId, newStatus)

    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update ticket status',
        variant: 'destructive',
      })
      // Revert on error
      loadTickets()
    } else {
      toast({
        title: 'Ticket Updated',
        description: `Ticket moved to ${newStatus.replace('_', ' ')}`,
      })
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading tickets...</div>
  }

  return (
    <Kanban
      columns={columns}
      data={tickets}
      onDragEnd={handleDragEnd}
      renderCard={(ticket: TicketItem) => (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-sm mb-2">{ticket.title}</h3>
          <div className="flex gap-2 mb-2">
            <Badge
              variant={
                ticket.priority === 'absolute'
                  ? 'destructive'
                  : ticket.priority === 'high'
                    ? 'default'
                    : 'outline'
              }
              className="text-xs"
            >
              {ticket.priority}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>
              {ticket.actualHours}h / {ticket.estimatedHours}h
            </p>
            <p className="truncate">
              {typeof ticket.client === 'object' ? ticket.client.name : 'Unknown Client'}
            </p>
          </div>
        </div>
      )}
    />
  )
}
