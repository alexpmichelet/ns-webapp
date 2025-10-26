'use client'

import { useEffect, useMemo, useState } from 'react'
import { PayloadMedia, PayloadProject, PayloadTicket, PayloadUser } from '@/payload-types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog'
import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent } from '@/components/atoms/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/atoms/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { payloadHook } from '@/lib/data/payload'
import type { PayloadTicketsSelect } from '@/payload-types'

type Props = {
  ticket: PayloadTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestRevision: () => void
  onCancelTicket?: () => void
  onActionCompleted?: () => void
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

function getUserName(user: string | PayloadUser | null | undefined): string {
  if (!user) return '—'
  if (typeof user === 'string') return user
  try {
    return user.name || user.email || user.id || '—'
  } catch {
    return '—'
  }
}

export default function EstimateReviewModal({
  ticket,
  open,
  onOpenChange,
  onRequestRevision,
  onCancelTicket,
  onActionCompleted,
}: Props) {
  const { toast } = useToast()
  const [isApproving, setIsApproving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const approveMutation = payloadHook.updateByID<'payload-tickets', PayloadTicketsSelect<true>>(
    'payload-tickets',
    {
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to approve',
          variant: 'destructive',
        })
      },
    },
  )
  const cancelMutation = payloadHook.updateByID<'payload-tickets', PayloadTicketsSelect<true>>(
    'payload-tickets',
    {
      onError: (error) =>
        toast({
          title: 'Error',
          description: error.message || 'Failed to cancel',
          variant: 'destructive',
        }),
    },
  )
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [confirmIrreversible, setConfirmIrreversible] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const estimatedHours = ticket?.estimatedHours ?? 0
  const projectName = getProjectName(ticket?.project)
  type TicketWithEstimatedBy = PayloadTicket & { estimatedBy?: string | PayloadUser }
  const estimatedBy = (ticket as TicketWithEstimatedBy | null | undefined)?.estimatedBy ?? null

  async function handleApprove() {
    if (!ticket) return
    setIsApproving(true)
    try {
      await approveMutation.mutateAsync({ id: ticket.id, data: { status: 'ready_to_develop' } })
      toast({ title: 'Estimate approved', description: 'Moved to Ready to Develop.' })
      setConfirmOpen(false)
      onOpenChange(false)
      onActionCompleted && onActionCompleted()
    } finally {
      setIsApproving(false)
    }
  }

  const attachments = (ticket?.attachments as (string | PayloadMedia)[] | undefined) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1400px] w-[98vw] h-[96vh] overflow-hidden p-0">
        <div className="flex flex-col h-full min-h-0">
          <div className="px-6 pt-6 pb-3 border-b">
            <DialogHeader>
              <DialogTitle>Review Estimate</DialogTitle>
              <DialogDescription>
                Review and approve or request revisions for this estimate.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-6">
            {/* Section 1: Ticket Overview */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Ticket Overview</h3>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xl font-semibold truncate" title={ticket?.title}>
                        {ticket?.title}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground line-clamp-4">
                        {ticket?.description}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="outline">{projectName}</Badge>
                        <Badge>{ticket?.priority}</Badge>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {/* Revision counter */}
                      <div className="text-xs text-muted-foreground">
                        {ticket?.isRevision
                          ? `Revision ${ticket?.revisionCount || 0} of ${ticket?.maxRevisions || 3}`
                          : 'Original Request'}
                      </div>
                    </div>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {attachments.map((a, idx) => {
                        const media = a as PayloadMedia
                        const src = media?.thumbnailURL || media?.url || ''
                        if (!src) return null
                        return (
                          <div
                            key={idx}
                            className="relative aspect-video overflow-hidden rounded-md border"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={media?.filename || 'attachment'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Section 2: Agency Estimate */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Agency Estimate</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-1">
                  <CardContent className="pt-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-4xl font-bold text-blue-600">{estimatedHours}h</div>
                      <div className="text-sm text-gray-600">Estimated Hours</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardContent className="pt-4">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Estimated by:</span>{' '}
                        <span>{getUserName(estimatedBy)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estimation date:</span>{' '}
                        <span>
                          {ticket
                            ? new Date(ticket.updatedAt || ticket.createdAt).toLocaleString()
                            : ''}
                        </span>
                      </div>
                      <div className="mt-3 text-muted-foreground">
                        Estimation breakdown is not captured separately yet.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>

          <div className="px-6 py-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky bottom-0 flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <div className="flex gap-2 flex-wrap">
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">Approve</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve estimate?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Approve estimate of {estimatedHours}h for "{ticket?.title}" and move to Ready
                      to Develop.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleApprove} disabled={isApproving}>
                      {isApproving ? 'Approving…' : 'Yes, Approve'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={onRequestRevision}>
                Request Revision
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                variant="destructive"
                onClick={() => setCancelOpen(true)}
                disabled={ticket?.isRevision === true}
                title={ticket?.isRevision ? 'Cannot cancel a revision ticket' : undefined}
              >
                Cancel Ticket
              </Button>
            </div>
          </div>
          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this ticket?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently cancel the ticket. Please provide a reason.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-3 py-2">
                <textarea
                  className="w-full min-h-[100px] rounded-md border p-2 text-sm"
                  placeholder="Why are you cancelling?"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={confirmIrreversible}
                    onChange={(e) => setConfirmIrreversible(e.target.checked)}
                  />
                  I understand this cannot be undone
                </label>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isCancelling}>Close</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isCancelling || !confirmIrreversible || cancelReason.trim().length < 3}
                  onClick={async () => {
                    if (!ticket) return
                    setIsCancelling(true)
                    try {
                      await cancelMutation.mutateAsync({
                        id: ticket.id,
                        data: { status: 'cancelled' },
                      })
                      toast({ title: 'Ticket cancelled', description: cancelReason })
                      setCancelOpen(false)
                      onOpenChange(false)
                      onActionCompleted && onActionCompleted()
                    } finally {
                      setIsCancelling(false)
                    }
                  }}
                >
                  {isCancelling ? 'Cancelling…' : 'Cancel Ticket'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  )
}
