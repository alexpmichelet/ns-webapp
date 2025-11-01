'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/atoms/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/atoms/form'
import { useToast } from '@/hooks/use-toast'
import { payloadHook } from '@/lib/data/payload'
import { PayloadTicket, PayloadTicketsSelect } from '@/payload-types'

const schema = z.object({
  designHours: z.number({ message: 'Enter a number' }).min(0, 'Must be 0 or more'),
  pmScopingHours: z.number({ message: 'Enter a number' }).min(0, 'Must be 0 or more'),
  devHours: z.number({ message: 'Enter a number' }).min(0, 'Must be 0 or more'),
  testingHours: z.number({ message: 'Enter a number' }).min(0, 'Must be 0 or more'),
  deploymentHours: z.number({ message: 'Enter a number' }).min(0, 'Must be 0 or more'),
  additionalPrecision: z.string().optional(),
  internalNotes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  ticket: PayloadTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EstimationFormModal({ ticket, open, onOpenChange }: Props) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const updateMutation = payloadHook.updateByID<'payload-tickets', PayloadTicketsSelect<true>>(
    'payload-tickets',
    {
      onError: (error) =>
        toast({
          title: 'Error',
          description: error.message || 'Failed to submit estimate',
          variant: 'destructive',
        }),
    },
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      designHours: ticket?.designHours || 0,
      pmScopingHours: ticket?.pmScopingHours || 0,
      devHours: ticket?.devHours || 0,
      testingHours: ticket?.testingHours || 0,
      deploymentHours: ticket?.deploymentHours || 0,
      additionalPrecision: '',
      internalNotes: '',
    },
  })

  useEffect(() => {
    form.reset({
      designHours: ticket?.designHours || 0,
      pmScopingHours: ticket?.pmScopingHours || 0,
      devHours: ticket?.devHours || 0,
      testingHours: ticket?.testingHours || 0,
      deploymentHours: ticket?.deploymentHours || 0,
      additionalPrecision: '',
      internalNotes: '',
    })
  }, [ticket?.id])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const totalHours =
        values.designHours +
        values.pmScopingHours +
        values.devHours +
        values.testingHours +
        values.deploymentHours
      await updateMutation.mutateAsync({
        id: ticket!.id,
        data: {
          estimatedHours: totalHours,
          designHours: values.designHours,
          pmScopingHours: values.pmScopingHours,
          devHours: values.devHours,
          testingHours: values.testingHours,
          deploymentHours: values.deploymentHours,
          additionalPrecision: values.additionalPrecision,
          internalNotes: values.internalNotes,
          status: 'needs_client_review',
        },
      })
      toast({ title: 'Estimate submitted', description: 'Sent to client for review.' })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Provide Estimate</DialogTitle>
          <DialogDescription>
            Break down the estimated hours by category and provide additional details. This will
            move the ticket to client review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0">
          <div className="rounded-md border p-4 bg-muted/30">
            <div className="font-medium text-lg mb-2">{ticket?.title}</div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ticket?.description}
            </div>
            {ticket?.attachments &&
              Array.isArray(ticket.attachments) &&
              ticket.attachments.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Attachments:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ticket.attachments.map((a, idx) => {
                      const media = a as any // PayloadMedia
                      const src = media?.thumbnailURL || media?.url || ''
                      if (!src) return null
                      return (
                        <div
                          key={idx}
                          className="relative aspect-video overflow-hidden rounded-md border bg-background"
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
                </div>
              )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="designHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours of design</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pmScopingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours of PM & scoping</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="devHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours of dev</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="testingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours of testing</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deploymentHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours of deployment</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="additionalPrecision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional precision (visible by client)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional details or clarifications for the client..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal notes (agency-only)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes not visible to clients"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Save & Send to Client'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
