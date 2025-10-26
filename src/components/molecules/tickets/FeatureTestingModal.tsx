'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/atoms/alert-dialog'
import { Textarea } from '@/components/atoms/textarea'
import { payloadHook } from '@/lib/data/payload'
import type { PayloadTicket } from '@/payload-types'
import TestingCountdown from './TestingCountdown'

type Props = {
  ticket: PayloadTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getEnvUrl(t: PayloadTicket | null): string | undefined {
  // Placeholder: if environmentUrl field exists in future schema, use it; else fallback
  return (t as any)?.environmentUrl || (t as any)?.previewUrl || undefined
}

export default function FeatureTestingModal({ ticket, open, onOpenChange }: Props) {
  const [showAccept, setShowAccept] = useState(false)
  const [showRevision, setShowRevision] = useState(false)
  const [revisionText, setRevisionText] = useState('')

  const envUrl = getEnvUrl(ticket)
  const testingDeadline = (ticket?.testingDeadline as any) || (ticket?.autoApprovalDate as any)

  // Mutations
  const acceptMutation = payloadHook.updateByID('payload-tickets', {
    onSuccess: () => {
      setShowAccept(false)
      onOpenChange(false)
    },
  } as any)
  const revisionMutation = payloadHook.updateByID('payload-tickets', {
    onSuccess: () => {
      setShowRevision(false)
      onOpenChange(false)
    },
  } as any)

  const canRequestRevision = useMemo(() => {
    if (!ticket) return { canRequest: false, reason: 'No ticket selected' }
    const count = (ticket.revisionCount as any) || 0
    const max = (ticket.maxRevisions as any) || 3
    if (count >= max)
      return { canRequest: false, reason: 'Maximum 3 revisions reached for this ticket' }
    return { canRequest: true } as const
  }, [ticket])

  function onAccept() {
    if (!ticket) return
    acceptMutation.mutate({
      id: ticket.id,
      // Mark as complete
      data: { status: 'done' },
      collection: 'payload-tickets',
    } as any)
  }

  function onSubmitRevision() {
    if (!ticket) return
    revisionMutation.mutate({
      id: ticket.id,
      data: {
        isRevision: true,
        revisionCount: ((ticket.revisionCount as any) || 0) + 1,
        status: 'development_in_progress',
        // Optionally store revision notes if schema provides a field later
      },
      collection: 'payload-tickets',
    } as any)
  }

  const daysHours = useMemo(() => {
    const end = testingDeadline ? new Date(testingDeadline as any).getTime() : Date.now()
    const totalHours = Math.max(0, Math.floor((end - Date.now()) / 3_600_000))
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24
    return `${days}d ${hours}h`
  }, [testingDeadline])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center justify-between">
              <span>Test Feature: {ticket?.title}</span>
              <Badge variant="outline">{daysHours} remaining</Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Review the delivered work, test the feature, and accept or request changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="development-summary">
            <h3 className="font-medium mb-2">What was delivered:</h3>
            <p className="text-sm text-muted-foreground">{(ticket as any)?.description}</p>
            <div className="flex gap-4 text-sm mt-3">
              <span>Estimated: {ticket?.estimatedHours}h</span>
              <span>Actual: {ticket?.actualHours || 0}h</span>
            </div>
          </div>

          <TestingCountdown
            testingStartDate={ticket?.testingStartDate as any}
            testingDeadline={testingDeadline as any}
          />

          <div className="testing-access">
            <h3 className="font-medium mb-2">Test the feature:</h3>
            <Button
              className="w-full"
              onClick={() => envUrl && window.open(envUrl, '_blank')?.focus()}
            >
              🚀 Open Testing Environment
            </Button>
            {envUrl ? (
              <p className="text-sm text-muted-foreground mt-2">Feature deployed to: {envUrl}</p>
            ) : null}
          </div>

          <div className="testing-instructions">
            <h3 className="font-medium mb-2">How to test:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Navigate to the feature area</li>
              <li>Test all described functionality</li>
              <li>Try edge cases and error scenarios</li>
              <li>Check on different devices/browsers</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Continue Testing
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 flex-1"
              onClick={() => setShowAccept(true)}
            >
              ✅ Accept Feature
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 flex-1"
              onClick={() => setShowRevision(true)}
            >
              🔄 Request Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Accept Confirmation */}
      <AlertDialog open={showAccept} onOpenChange={setShowAccept}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600">✅ Accept Feature</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  Confirm that <strong>{ticket?.title}</strong> works as expected?
                </p>
                <p className="text-sm text-muted-foreground">
                  This feature will be marked as complete and included in the next billing cycle.
                </p>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm">Hours worked: {ticket?.actualHours || 0}h</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={onAccept}>
              Accept & Mark Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revision Request */}
      <AlertDialog open={showRevision} onOpenChange={setShowRevision}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-600">🔄 Request Changes</AlertDialogTitle>
            <AlertDialogDescription>
              {canRequestRevision.canRequest ? (
                <div className="space-y-3">
                  <label className="text-sm font-medium">What needs to be fixed or changed?</label>
                  <Textarea
                    value={revisionText}
                    onChange={(e) => setRevisionText(e.target.value)}
                    placeholder="Describe specific issues found during testing..."
                    className="min-h-32"
                  />
                  <div className="bg-orange-50 border border-orange-200 p-3 rounded text-sm">
                    <p>Revision Process:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-orange-800">
                      <li>Agency will re-estimate additional work needed</li>
                      <li>You'll need to approve the revision estimate</li>
                      <li>Original work ({ticket?.actualHours || 0}h) will still be billed</li>
                      <li>Maximum 3 revisions allowed per ticket</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                  <p className="font-medium text-red-800">Maximum Revisions Reached</p>
                  <p className="text-red-700 mt-1">{canRequestRevision.reason}</p>
                  <ul className="list-disc list-inside mt-2 text-red-700">
                    <li>Accept the current implementation</li>
                    <li>Create a new ticket for additional changes</li>
                    <li>Discuss with the agency team</li>
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={onSubmitRevision}
              disabled={!canRequestRevision.canRequest}
            >
              Submit Revision Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
