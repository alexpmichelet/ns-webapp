'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog'
import { Button } from '@/components/atoms/button'
import { Textarea } from '@/components/atoms/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/atoms/form'
import { useToast } from '@/hooks/use-toast'
import { PayloadTicket } from '@/payload-types'
import { payloadHook } from '@/lib/data/payload'
import type { PayloadTicketsSelect } from '@/payload-types'

const schema = z.object({
  reason: z.string().min(5, 'Please provide more detail').max(1000),
})

type FormValues = z.infer<typeof schema>

type Props = {
  ticket: PayloadTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

export default function RevisionRequestForm({ ticket, open, onOpenChange, onCompleted }: Props) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const max = ticket?.maxRevisions ?? 3
  const count = ticket?.revisionCount ?? 0
  const limitReached = count >= max
  const updateMutation = payloadHook.updateByID<'payload-tickets', PayloadTicketsSelect<true>>(
    'payload-tickets',
    {
      onError: (error) =>
        toast({
          title: 'Error',
          description: error.message || 'Failed to request revision',
          variant: 'destructive',
        }),
    },
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  })

  useEffect(() => {
    form.reset({ reason: '' })
  }, [ticket?.id])

  async function onSubmit(values: FormValues) {
    if (!ticket) return
    if (limitReached) {
      toast({
        title: 'Maximum revisions reached',
        description: 'Please create a new ticket or cancel.',
        variant: 'destructive',
      })
      return
    }
    setSubmitting(true)
    try {
      await updateMutation.mutateAsync({
        id: ticket.id,
        data: {
          isRevision: true,
          revisionCount: (ticket.revisionCount || 0) + 1,
          status: 'to_estimate',
        },
      })
      toast({
        title: 'Revision requested',
        description: `This will be revision ${count + 1} of ${max}.`,
      })
      onOpenChange(false)
      onCompleted && onCompleted()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Revision</DialogTitle>
          <DialogDescription>
            Provide a reason and (optionally) updated requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border p-3 bg-muted/30">
            <div className="font-medium">{ticket?.title}</div>
            <div className="text-xs text-muted-foreground">
              {ticket?.isRevision ? `Revision ${count} of ${max}` : 'Original Request'}
              {limitReached ? ' • Maximum revisions reached' : ''}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground mb-1">Revision counter</div>
            <div className="text-sm">
              {ticket?.isRevision ? `Revision ${count} of ${max}` : 'Original Request'}
              {count + 1 === max ? ' (Final)' : ''}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for revision</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What needs to be changed?"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Placeholder for rich text modified requirements in the future */}
            <div className="text-xs text-muted-foreground">
              If requirements changed significantly, we may create a new ticket.
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || limitReached}
                className={limitReached ? 'opacity-50' : ''}
              >
                {limitReached
                  ? 'Max revisions reached'
                  : submitting
                    ? 'Submitting...'
                    : 'Request Revision'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
