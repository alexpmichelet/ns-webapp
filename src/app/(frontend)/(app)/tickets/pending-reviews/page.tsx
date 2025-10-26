'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth/client'
import { payloadHook } from '@/lib/data/payload'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { PayloadProject, PayloadTicket } from '@/payload-types'
import { cn } from '@/lib/utils'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import EstimateReviewModal from '@/components/molecules/tickets/EstimateReviewModal'
import RevisionRequestForm from '../../../../../components/molecules/tickets/RevisionRequestForm'
import TicketCreateDrawer from '@/components/molecules/tickets/TicketCreateDrawer'

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

export default function PendingReviewsPage() {
  const session = authClient.useSession()
  const user = session?.data?.user as { id: string; role?: string } | undefined
  const search = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const { data: ticketsRes, isLoading } = payloadHook.find(
    {
      collection: 'payload-tickets',
      where: {
        status: { equals: 'needs_client_review' },
        // client filtered by access control automatically
      },
      limit: 200,
      sort: '-createdAt',
    } as any,
    { enabled: !!user?.id },
  )

  const tickets: PayloadTicket[] = useMemo(() => {
    const docs = (ticketsRes as any)?.docs ?? []
    // Sort by priority then createdAt (proxy for estimation date)
    return [...docs].sort((a: PayloadTicket, b: PayloadTicket) => {
      const pa = priorityOrder[a.priority] ?? 99
      const pb = priorityOrder[b.priority] ?? 99
      if (pa !== pb) return pa - pb
      return (
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
      )
    })
  }, [ticketsRes])

  // Modal state
  const [activeTicket, setActiveTicket] = useState<PayloadTicket | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [showReviseEditor, setShowReviseEditor] = useState(false)

  // Open modal if query param review=1 & we have at least one ticket
  useMemo(() => {
    if (!modalOpen && search?.get('review') === '1' && tickets.length > 0) {
      setActiveTicket(tickets[0])
      setModalOpen(true)
    }
  }, [search, tickets, modalOpen])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pending Reviews</h1>
        <p className="text-muted-foreground">Estimates awaiting your approval</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tickets need your review right now.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => {
            const projectName = getProjectName(t.project)
            return (
              <Card key={t.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate" title={t.title}>
                        {t.ticketNumber} • {t.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{projectName}</Badge>
                        <Badge className={cn('text-white', priorityColors[t.priority])}>
                          {t.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">Estimated</div>
                      <div className="text-2xl font-bold text-blue-600">{t.estimatedHours}h</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/tickets/${t.id}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      View details
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveTicket(t)
                        setModalOpen(true)
                      }}
                    >
                      Review Estimate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <EstimateReviewModal
        ticket={activeTicket}
        open={modalOpen}
        onOpenChange={(o: boolean) => setModalOpen(o)}
        onRequestRevision={() => setShowReviseEditor(true)}
        onCancelTicket={() => {
          toast({
            title: 'Cancellation unavailable',
            description: 'Cancellation is not supported yet for this ticket type.',
            variant: 'destructive',
          })
        }}
        onActionCompleted={() => {
          // Refresh data and clear selection
          router.refresh()
          setActiveTicket(null)
        }}
      />

      <TicketCreateDrawer
        hideTrigger
        mode="edit"
        openProp={showReviseEditor}
        onOpenPropChange={setShowReviseEditor}
        triggerLabel=""
        initialValues={{
          project: (activeTicket?.project as any)?.id || (activeTicket?.project as string) || '',
          title: activeTicket?.title || '',
          description: activeTicket?.description || '',
          priority: activeTicket?.priority as any,
          attachments: (activeTicket?.attachments as any[])?.map((a: any) => ({ id: a?.id || a })),
        }}
        ticketId={activeTicket?.id}
        onAfterSubmit={() => {
          setShowReviseEditor(false)
          setModalOpen(false)
          setActiveTicket(null)
          router.refresh()
          toast({ title: 'Revision requested', description: 'Ticket sent back to estimation.' })
        }}
      />
    </div>
  )
}
