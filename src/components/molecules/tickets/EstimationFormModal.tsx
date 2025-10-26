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
import { submitEstimate } from '@/app/actions/tickets'
import { PayloadTicket } from '@/payload-types'

const schema = z.object({
  estimatedHours: z.number({ message: 'Enter a number' }).positive('Hours must be positive'),
  breakdown: z.string().min(5, 'Provide how you calculated this'),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      estimatedHours: ticket?.estimatedHours || 1,
      breakdown: '',
      internalNotes: '',
    },
  })

  useEffect(() => {
    form.reset({
      estimatedHours: ticket?.estimatedHours || 1,
      breakdown: '',
      internalNotes: '',
    })
  }, [ticket?.id])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    const result = await submitEstimate({
      ticketId: ticket!.id,
      estimatedHours: values.estimatedHours,
      breakdown: values.breakdown,
      internalNotes: values.internalNotes,
    })
    if (result.success) {
      toast({ title: 'Estimate submitted', description: 'Sent to client for review.' })
      onOpenChange(false)
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to submit estimate',
        variant: 'destructive',
      })
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Provide Estimate</DialogTitle>
          <DialogDescription>
            Submit estimated hours and a brief breakdown. This will move the ticket to client
            review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-3 bg-muted/30">
            <div className="font-medium">{ticket?.title}</div>
            <div className="text-sm text-muted-foreground line-clamp-3">{ticket?.description}</div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.25"
                        min="0.25"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="breakdown"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimation breakdown</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List tasks and hour splits..."
                        className="min-h-[120px]"
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
