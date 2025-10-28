'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Kanban } from '@/components/ui/shadcn-io/kanban'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/atoms/card'
import { Button } from '@/components/atoms/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import type { DragEndEvent } from '@/components/ui/shadcn-io/kanban'
import type { TicketStatus } from '@/collections/Tickets'
import type { PayloadTicket } from '@/payload-types'
import { payloadHook } from '@/lib/data/payload'
import { MoreHorizontal, Clock, Timer, Calendar, Paperclip } from 'lucide-react'
import { useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core'

type TicketItem = {
  id: string
  name: string
  column: string
  title: string
  priority: PayloadTicket['priority']
  actualHours: number
  estimatedHours: number
  clientName: string
  projectName?: string
  ticketNumber?: string
  createdAt?: string
  assignedUsers: Array<{ id: string; name?: string; avatar?: string; initials: string }>
  isRevision?: boolean
  revisionCount?: number
  attachmentsCount: number
  status: TicketStatus
  testingDeadline?: string | null
}

const columns = [
  {
    id: 'to_estimate',
    name: 'To Estimate',
    hint: 'Agency provides estimates within 1 business day',
    color: 'bg-blue-500',
  },
  {
    id: 'needs_client_review',
    name: 'Needs Review',
    hint: 'Awaiting client approval',
    color: 'bg-amber-500',
  },
  {
    id: 'ready_to_develop',
    name: 'Ready To Dev',
    hint: 'Ready for implementation',
    color: 'bg-emerald-500',
  },
  {
    id: 'development_in_progress',
    name: 'In Dev',
    hint: 'Work in progress',
    color: 'bg-purple-500',
  },
  {
    id: 'ready_to_test',
    name: 'Ready To Test',
    hint: 'Client testing window',
    color: 'bg-sky-600',
  },
  { id: 'done', name: 'Done', hint: 'Awaiting invoicing/closure', color: 'bg-gray-400' },
]

function PriorityBadge({ priority }: { priority: PayloadTicket['priority'] }) {
  const variant =
    priority === 'absolute' ? 'destructive' : priority === 'high' ? 'default' : 'outline'
  return (
    <Badge variant={variant} className="text-[11px] h-5">
      {priority}
    </Badge>
  )
}

function formatRelativeTime(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  const diffMs = date.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const minutes = Math.round(diffMs / 60000)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  return rtf.format(days, 'day')
}

function initialsFromName(name: string) {
  const parts = (name || '').split(' ').filter(Boolean)
  const first = parts[0]?.[0] || ''
  const last = parts[1]?.[0] || ''
  return (first + last).toUpperCase() || 'U'
}

export function TicketKanbanBoard() {
  const router = useRouter()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const { data: ticketsRes } = payloadHook.find(
    {
      collection: 'payload-tickets',
      where: { status: { not_equals: 'paid_closed' } },
      limit: 1000,
      sort: '-updatedAt',
    } as any,
    {
      // @ts-ignore
      refetchInterval: 60_000,
    },
  )

  useEffect(() => {
    const docs = (ticketsRes as any)?.docs as PayloadTicket[] | undefined
    if (!Array.isArray(docs)) return
    const formattedTickets: TicketItem[] = docs.map((ticket) => {
      const clientName =
        typeof ticket.client === 'object'
          ? (ticket.client as any)?.name || (ticket.client as any)?.email || 'Client'
          : 'Client'
      const projectName =
        typeof ticket.project === 'object' ? (ticket.project as any)?.name : undefined
      const assigned = Array.isArray(ticket.assignedTo)
        ? (ticket.assignedTo as any[]).map((u) => ({
            id: String(u.id || u),
            name: u.name || u.email || 'User',
            avatar: (u as any).avatarUrl,
            initials: initialsFromName(u.name || u.email || 'User'),
          }))
        : []
      return {
        id: String(ticket.id),
        name: ticket.title,
        column: ticket.status as string,
        title: ticket.title,
        priority: ticket.priority,
        actualHours: ticket.actualHours || 0,
        estimatedHours: ticket.estimatedHours,
        clientName,
        projectName,
        ticketNumber: (ticket as any).ticketNumber,
        createdAt: (ticket as any).createdAt,
        assignedUsers: assigned,
        isRevision: (ticket as any).isRevision,
        revisionCount: (ticket as any).revisionCount,
        attachmentsCount: Array.isArray(ticket.attachments) ? ticket.attachments.length : 0,
        status: ticket.status as TicketStatus,
        testingDeadline: (ticket as any).testingDeadline || null,
      }
    })
    setTickets(formattedTickets)
    setIsLoading(false)
  }, [ticketsRes])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const ticketId = active.id as string
    const newStatus = over.id as TicketStatus

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, column: newStatus, status: newStatus } : t)),
    )

    try {
      await payloadHook.updateByID('payload-tickets').mutateAsync({
        id: ticketId,
        data: { status: newStatus },
      } as any)
      toast({
        title: 'Ticket Updated',
        description: `Ticket moved to ${newStatus.replaceAll('_', ' ')}`,
      })
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive',
      })
    }
  }

  const countsByColumn = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of columns) map[c.id] = 0
    for (const t of tickets) if (map[t.column] !== undefined) map[t.column] += 1
    return map
  }, [tickets])

  if (isLoading) {
    return <div className="p-8 text-center">Loading tickets...</div>
  }

  const cardWidthClass = 'w-full'

  return (
    <div className="kanban-container w-full overflow-x-auto overflow-y-hidden">
      <Kanban
        columns={columns as any}
        data={tickets as any}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        containerClassName="kanban-board flex gap-6 p-6 min-w-max"
        className=""
        renderColumnHeader={(col: any) => (
          <div className="column-header bg-gray-50 border border-gray-200 rounded-t-lg p-4 mb-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`status-indicator w-3 h-3 rounded-full ${col.color}`}></div>
                <h3 className="font-semibold text-lg text-gray-900">{col.name}</h3>
              </div>
              <Badge variant="secondary" className="text-sm">
                {countsByColumn[col.id] || 0}
              </Badge>
            </div>
            {col.hint ? <p className="text-sm text-gray-600 mt-1">{col.hint}</p> : null}
          </div>
        )}
        renderCard={(ticket: TicketItem) => {
          const timeRemaining = ticket.testingDeadline
            ? formatRelativeTime(ticket.testingDeadline)
            : undefined
          return (
            <Card
              className={`kanban-card ${cardWidthClass} min-h-[240px] bg-card transition-all duration-200 cursor-pointer group border-0 shadow-none border border-gray-200 hover:shadow-none`}
              onClick={() => router.push(`/tickets/${ticket.id}`)}
            >
              <CardHeader className="pb-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {ticket.ticketNumber ? (
                        <span className="ticket-number text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {ticket.ticketNumber}
                        </span>
                      ) : null}
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <h4 className="ticket-title font-semibold text-[15px] leading-snug text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {ticket.title}
                    </h4>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/tickets/${ticket.id}`)
                        }}
                      >
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        Assign
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        Change priority
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {ticket.clientName}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{ticket.estimatedHours}h est.</span>
                  </div>
                  {ticket.actualHours > 0 ? (
                    <div className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      <span>{ticket.actualHours}h actual</span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatRelativeTime(ticket.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {ticket.projectName ? (
                    <Badge variant="outline" className="text-xs">
                      {ticket.projectName}
                    </Badge>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-2">
                    {ticket.assignedUsers.map((user) => (
                      <Avatar key={user.id} className="w-6 h-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>

                {ticket.status === 'ready_to_test' && ticket.testingDeadline ? (
                  <div className="testing-countdown bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-700">Testing Period</span>
                      <span className="text-sm font-bold text-blue-600">{timeRemaining}</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              100 -
                                ((new Date(ticket.testingDeadline).getTime() - Date.now()) /
                                  (5 * 24 * 60 * 60 * 1000)) *
                                  100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                {ticket.isRevision ? (
                  <div className="revision-indicator bg-orange-50 border border-orange-200 rounded p-2">
                    <span className="text-xs font-medium text-orange-700">
                      Revision {ticket.revisionCount ?? 1} of 3
                    </span>
                  </div>
                ) : null}

                {ticket.attachmentsCount > 0 ? (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Paperclip className="w-3 h-3" />
                    <span>
                      {ticket.attachmentsCount} attachment{ticket.attachmentsCount > 1 ? 's' : ''}
                    </span>
                  </div>
                ) : null}
              </CardContent>

              <CardFooter className="pt-0">
                <div className="flex items-center justify-between w-full">
                  <div className="created-by text-xs text-gray-500">by {ticket.clientName}</div>
                  <div className="quick-actions opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          )
        }}
      />
    </div>
  )
}
