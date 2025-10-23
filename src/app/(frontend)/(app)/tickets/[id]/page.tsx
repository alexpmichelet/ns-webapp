'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Badge } from '@/components/atoms/badge'
import { Textarea } from '@/components/atoms/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog'
import { getTicketById, approveTicket, requestRevision } from '@/app/actions/tickets'
import { getTimeLogsByTicket } from '@/app/actions/time-logs'
import { useToast } from '@/hooks/use-toast'

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [ticket, setTicket] = useState<any>(null)
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [revisionReason, setRevisionReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [isRequestingRevision, setIsRequestingRevision] = useState(false)
  const [showRevisionDialog, setShowRevisionDialog] = useState(false)

  useEffect(() => {
    loadTicket()
  }, [params.id])

  async function loadTicket() {
    setIsLoading(true)
    const ticketResult = await getTicketById(params.id as string)
    const timeLogsResult = await getTimeLogsByTicket(params.id as string)

    if (ticketResult.success) {
      setTicket(ticketResult.ticket)
    }
    if (timeLogsResult.success) {
      setTimeLogs(timeLogsResult.timeLogs)
    }

    setIsLoading(false)
  }

  async function handleApprove() {
    setIsApproving(true)
    const result = await approveTicket(params.id as string)

    if (result.success) {
      toast({
        title: 'Ticket Approved',
        description: 'The ticket has been approved successfully.',
      })
      loadTicket()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to approve ticket',
        variant: 'destructive',
      })
    }
    setIsApproving(false)
  }

  async function handleRequestRevision() {
    if (!revisionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the revision',
        variant: 'destructive',
      })
      return
    }

    setIsRequestingRevision(true)
    const result = await requestRevision(params.id as string, revisionReason)

    if (result.success) {
      toast({
        title: 'Revision Requested',
        description: 'Your revision request has been submitted.',
      })
      setShowRevisionDialog(false)
      setRevisionReason('')
      loadTicket()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to request revision',
        variant: 'destructive',
      })
    }
    setIsRequestingRevision(false)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading...</p>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="container mx-auto py-8">
        <p>Ticket not found</p>
      </div>
    )
  }

  const canApprove = ticket.status === 'pending_client_review'
  const totalBilled = timeLogs.reduce((sum, log) => sum + (log.totalAmount || 0), 0)

  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        ← Back to Tickets
      </Button>

      <div className="grid gap-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{ticket.title}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge>{ticket.status.replace('_', ' ')}</Badge>
                  <Badge variant="outline">{ticket.priority}</Badge>
                </div>
              </div>
              {canApprove && (
                <div className="flex gap-2">
                  <Dialog
                    open={showRevisionDialog}
                    onOpenChange={setShowRevisionDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">Request Revision</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Revision</DialogTitle>
                        <DialogDescription>
                          Please explain what changes you'd like to see.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        value={revisionReason}
                        onChange={(e) => setRevisionReason(e.target.value)}
                        placeholder="Describe the changes needed..."
                        className="min-h-[100px]"
                      />
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowRevisionDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleRequestRevision}
                          disabled={isRequestingRevision}
                        >
                          {isRequestingRevision
                            ? 'Submitting...'
                            : 'Submit Request'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={handleApprove} disabled={isApproving}>
                    {isApproving ? 'Approving...' : 'Approve & Continue'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: ticket.description }} />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estimated Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticket.estimatedHours}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Actual Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticket.actualHours || 0}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Time Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timeLogs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Billed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBilled.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Time Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Time Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {timeLogs.length === 0 ? (
              <p className="text-muted-foreground">No time logged yet</p>
            ) : (
              <div className="space-y-4">
                {timeLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border-b pb-4 last:border-0"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{log.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.date).toLocaleDateString()} •{' '}
                          {log.hours}h @ ${log.hourlyRate}/hr
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${log.totalAmount.toFixed(2)}</p>
                        <Badge variant={log.isBillable ? 'default' : 'outline'}>
                          {log.isBillable ? 'Billable' : 'Non-billable'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
