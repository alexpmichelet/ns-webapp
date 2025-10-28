'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { payloadHook } from '@/lib/data/payload'
import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Input } from '@/components/atoms/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select'
import { Switch } from '@/components/atoms/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms/table'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { PayloadProject, PayloadTicket } from '@/payload-types'
import { ArrowLeft } from 'lucide-react'
import type { Session } from '@/lib/auth/client'
import EstimationFormModal from '@/components/molecules/tickets/EstimationFormModal'
// Inline SLA countdown to avoid cross-module type issues
function SlaCountdownInline({ createdAt }: { createdAt: string | Date }) {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const deadline = addBusinessDays(created, 1)
  const remainingMs = deadline.getTime() - Date.now()
  const overdue = remainingMs <= 0
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  let color = 'bg-green-100 text-green-800'
  if (overdue || hours < 2) color = 'bg-red-100 text-red-800'
  else if (hours < 6) color = 'bg-yellow-100 text-yellow-800'
  return (
    <Badge className={color} variant="outline">
      {overdue ? 'OVERDUE' : `${hours}h ${minutes}m`}
    </Badge>
  )
}

// (using static import above to satisfy TS resolution)

type PayloadFindResult<T> = { docs: T[] }

const priorityOrder: Record<string, number> = {
  absolute: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  absolute: 'bg-red-600',
}

function getProjectName(project: string | PayloadProject | null | undefined): string {
  if (!project) return '—'
  if (typeof project === 'string') return project
  try {
    return project.name || project.id || '—'
  } catch {
    return '—'
  }
}

function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, 'second')
  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute')
  const diffHr = Math.round(diffMin / 60)
  if (Math.abs(diffHr) < 24) return rtf.format(-diffHr, 'hour')
  const diffDay = Math.round(diffHr / 24)
  if (Math.abs(diffDay) < 30) return rtf.format(-diffDay, 'day')
  const diffMon = Math.round(diffDay / 30)
  if (Math.abs(diffMon) < 12) return rtf.format(-diffMon, 'month')
  const diffYr = Math.round(diffMon / 12)
  return rtf.format(-diffYr, 'year')
}

function isOverdue(createdAt: string | Date): boolean {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  // SLA is 1 business day from creation
  const deadline = addBusinessDays(created, 1)
  return Date.now() > deadline.getTime()
}

function addBusinessDays(start: Date, businessDays: number): Date {
  let daysAdded = 0
  const result = new Date(start)
  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) {
      daysAdded += 1
    }
  }
  return result
}

export default function EstimationQueuePage() {
  const router = useRouter()
  const session = authClient.useSession()
  const user = (session?.data as Session | undefined)?.user

  // Filters / UI state
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [showOverdue, setShowOverdue] = useState<boolean>(false)
  const [search, setSearch] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const pageSize = 10

  // Projects for filter
  const { data: projectsRes } = payloadHook.find(
    {
      collection: 'payload-projects',
      limit: 100,
      sort: 'name',
    },
    { enabled: !!user },
  )
  const projects: PayloadProject[] =
    (projectsRes as PayloadFindResult<PayloadProject> | undefined)?.docs ?? []

  // Tickets to estimate
  const { data: ticketsRes, isLoading } = payloadHook.find(
    {
      collection: 'payload-tickets',
      where: {
        status: { equals: 'to_estimate' },
      },
      limit: 200,
      sort: '-createdAt',
    },
    {
      enabled: !!user,
      // refresh every minute
      // @ts-ignore - underlying hook likely supports react-query options
      refetchInterval: 60_000,
    },
  )

  const allTickets: PayloadTicket[] =
    (ticketsRes as PayloadFindResult<PayloadTicket> | undefined)?.docs ?? []

  const filteredTickets = useMemo(() => {
    let list = allTickets
    if (selectedProject !== 'all') {
      list = list.filter((t) => {
        const projectId = typeof t.project === 'string' ? t.project : t.project?.id
        return projectId === selectedProject
      })
    }
    if (showOverdue) {
      list = list.filter((t) => isOverdue(t.createdAt))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((t) =>
        `${t.ticketNumber || ''} ${t.title || ''}`.toLowerCase().includes(q),
      )
    }
    // Sort: Priority then creation date
    list = [...list].sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 99
      const pb = priorityOrder[b.priority] ?? 99
      if (pa !== pb) return pa - pb
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return list
  }, [allTickets, selectedProject, showOverdue, search])

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize))
  const pageTickets = filteredTickets.slice((page - 1) * pageSize, page * pageSize)

  const [activeTicket, setActiveTicket] = useState<PayloadTicket | null>(null)
  const [showModal, setShowModal] = useState(false)

  if (!user || user.role === 'client') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <h1 className="text-3xl font-bold">Estimation Queue</h1>
          <p className="text-muted-foreground">Tickets awaiting agency estimates</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium mb-2">Project</label>
          <Select
            value={selectedProject}
            onValueChange={(v) => {
              setSelectedProject(v)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p: PayloadProject) => (
                <SelectItem key={p.id} value={p.id}>
                  {getProjectName(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-80">
          <label className="block text-sm font-medium mb-2">Search</label>
          <Input
            placeholder="Search by ticket # or title"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Switch id="overdue" checked={showOverdue} onCheckedChange={setShowOverdue} />
          <label htmlFor="overdue" className="text-sm">
            Show overdue only
          </label>
        </div>
      </div>

      {/* Table (md+) */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : pageTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  pageTickets.map((t) => {
                    const overdue = isOverdue(t.createdAt)
                    const projectName = getProjectName(t.project)
                    return (
                      <TableRow key={t.id} className={cn(overdue && 'bg-red-50')}>
                        <TableCell>
                          <Link href={`/tickets/${t.id}`} className="font-medium hover:underline">
                            {t.ticketNumber || '—'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{projectName}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[360px]" title={t.title}>
                            {t.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-white', priorityColors[t.priority])}>
                            {t.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatRelativeTime(t.createdAt)}</TableCell>
                        <TableCell>
                          <SlaCountdownInline createdAt={t.createdAt} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveTicket(t)
                              setShowModal(true)
                            }}
                          >
                            Provide Estimate
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent>
          </Card>
        ) : pageTickets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No tickets found
            </CardContent>
          </Card>
        ) : (
          pageTickets.map((t) => {
            const overdue = isOverdue(t.createdAt)
            const projectName = getProjectName(t.project)
            return (
              <Card key={t.id} className={cn(overdue && 'bg-red-50')}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        <Link href={`/tickets/${t.id}`} className="hover:underline">
                          {t.ticketNumber || '—'}
                        </Link>
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{projectName}</Badge>
                        <Badge className={cn('text-white', priorityColors[t.priority])}>
                          {t.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatRelativeTime(t.createdAt)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="truncate mb-3" title={t.title}>
                    {t.title}
                  </div>
                  <div className="flex items-center justify-between">
                    <SlaCountdownInline createdAt={t.createdAt} />
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveTicket(t)
                        setShowModal(true)
                      }}
                    >
                      Provide Estimate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages} • {filteredTickets.length} total
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <EstimationFormModal ticket={activeTicket} open={showModal} onOpenChange={setShowModal} />
    </div>
  )
}
