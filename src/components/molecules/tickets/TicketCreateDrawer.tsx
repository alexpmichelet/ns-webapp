'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/atoms/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/dialog'
import { Input } from '@/components/atoms/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/atoms/field'
import { useToast } from '@/hooks/use-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { payloadHook } from '@/lib/data/payload'
import type { PayloadTicketsSelect } from '@/payload-types'
import type { TicketPriority } from '@/collections/Tickets'
import PrioritySelector from './PrioritySelector'
import { Textarea } from '@/components/atoms/textarea'
import FileUploadArea, { UploadedFile } from './FileUploadArea'
import { useSelectedProjectStore } from '@/hooks/use-selected-project'
import { authClient } from '@/lib/auth/client'

type Props = {
  onCreated?: (ticketId: string) => void
  onAfterSubmit?: (ticketId: string) => void
  triggerVariant?: 'default' | 'outline' | 'ghost'
  fullWidth?: boolean
  triggerLabel?: string
  mode?: 'create' | 'edit'
  ticketId?: string
  initialValues?: Partial<TicketFormValues>
  openProp?: boolean
  onOpenPropChange?: (open: boolean) => void
  hideTrigger?: boolean
}

const ticketSchema = z.object({
  project: z.string().min(1, 'Project is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'absolute']),
  attachments: z.array(z.object({ id: z.string(), url: z.string().optional() })).optional(),
  clientUserId: z.string().optional(),
})

type TicketFormValues = z.infer<typeof ticketSchema>

export default function TicketCreateDrawer({
  onCreated,
  onAfterSubmit,
  triggerVariant = 'default',
  fullWidth,
  triggerLabel = 'Create New Ticket',
  mode = 'create',
  ticketId,
  initialValues,
  openProp,
  onOpenPropChange,
  hideTrigger,
}: Props) {
  const isControlled = typeof openProp === 'boolean'
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = isControlled ? (openProp as boolean) : uncontrolledOpen
  const setOpen = (v: boolean) => (isControlled ? onOpenPropChange?.(v) : setUncontrolledOpen(v))
  const [titleCount, setTitleCount] = useState(0)
  const { toast } = useToast()
  const session = authClient.useSession()
  const currentUser = (session?.data?.user as { id: string; role: string } | undefined) || undefined

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      project: initialValues?.project || '',
      title: initialValues?.title || '',
      description: initialValues?.description || '',
      priority: (initialValues?.priority as TicketPriority) || 'medium',
      attachments: initialValues?.attachments || [],
      clientUserId: initialValues?.clientUserId,
    },
    mode: 'onChange',
  })

  const selectedProject = useSelectedProjectStore((s) => s.selectedProject)

  // When dialog opens, prefill the project from the selected project or initial values
  useEffect(() => {
    if (open) {
      const currentProject = form.getValues('project')
      if (!currentProject && initialValues?.project) {
        form.setValue('project', initialValues.project as string, { shouldValidate: true })
      } else if (!currentProject && selectedProject?.id) {
        form.setValue('project', selectedProject.id, { shouldValidate: true })
      }
      if (initialValues?.title)
        form.setValue('title', initialValues.title, { shouldValidate: true })
      if (initialValues?.description)
        form.setValue('description', initialValues.description, { shouldValidate: true })
      if (initialValues?.priority)
        form.setValue('priority', initialValues.priority as TicketPriority, {
          shouldValidate: true,
        })
      if (initialValues?.attachments)
        form.setValue('attachments', initialValues.attachments as any, { shouldValidate: true })
    }
  }, [open, selectedProject, form, initialValues])

  // Load projects current user has access to
  const { data: projectsData, isLoading: isLoadingProjects } = payloadHook.find<
    'payload-projects',
    any
  >({
    collection: 'payload-projects',
    limit: 100,
    page: 1,
    depth: 0,
  })

  // Load clients list for admin selection
  const { data: clientsData, isLoading: isLoadingClients } = payloadHook.find<'payload-users', any>(
    {
      collection: 'payload-users',
      where: {
        role: {
          equals: 'client',
        },
      },
      limit: 100,
      page: 1,
      depth: 0,
    },
  )

  const projects = useMemo(() => {
    const docs = (projectsData as any)?.docs
    if (!Array.isArray(docs)) return [] as Array<{ id: string; name: string }>
    return docs.map((d: any) => ({ id: d.id, name: d.name }))
  }, [projectsData])

  const clients = useMemo(() => {
    const docs = (clientsData as any)?.docs
    if (!Array.isArray(docs)) return [] as Array<{ id: string; label: string }>
    return docs.map((d: any) => ({ id: d.id, label: d.name || d.email || d.id }))
  }, [clientsData])

  const createMutation = payloadHook.create<'payload-tickets', PayloadTicketsSelect<true>>(
    'payload-tickets',
    {
      onSuccess: (data: any) => {
        const ticketNumber = data?.doc?.ticketNumber || data?.ticketNumber
        const createdId = data?.doc?.id || data?.id
        toast({
          variant: 'success',
          title: ticketNumber ? `Ticket ${ticketNumber} created` : 'Ticket created',
        })
        setOpen(false)
        form.reset()
        if (onCreated && createdId) onCreated(createdId)
        if (onAfterSubmit && createdId) onAfterSubmit(createdId)
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: error.message || 'Failed to create ticket' })
      },
    },
  )
  const updateMutation = payloadHook.updateByID<'payload-tickets', PayloadTicketsSelect<true>>(
    'payload-tickets',
    {
      onSuccess: (data) => {
        const updatedId = (data as any)?.doc?.id || (data as any)?.id
        toast({ variant: 'success', title: 'Ticket updated' })
        setOpen(false)
        form.reset()
        if (onAfterSubmit && updatedId) onAfterSubmit(updatedId)
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: error.message || 'Failed to update ticket' })
      },
    },
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const onUploadStateChange = useCallback((uploading: boolean) => {
    setIsUploading(uploading)
  }, [])

  const onFilesChange = useCallback(
    (files: UploadedFile[]) => {
      const ids = files
        .filter((f) => f.status === 'uploaded' && f.mediaId)
        .map((f) => ({ id: f.mediaId!, url: f.url }))
      form.setValue('attachments', ids, { shouldValidate: true })
    },
    [form],
  )

  const sanitizePlainText = (text: string) => (text || '').trim()

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      if (currentUser?.role === 'admin' && mode === 'create') {
        if (!values.clientUserId) {
          toast({
            variant: 'destructive',
            title: 'Client is required',
            description: 'Please select a client for this ticket.',
          })
          setIsSubmitting(false)
          return
        }
      }
      if (mode === 'edit' && ticketId) {
        await updateMutation.mutateAsync({
          id: ticketId,
          data: {
            title: values.title,
            description: sanitizePlainText(values.description),
            priority: values.priority as TicketPriority,
            status: 'to_estimate',
            project: values.project,
            attachments: (values.attachments || []).map((a) => a.id),
          },
        })
      } else {
        const payloadData: any = {
          collection: 'payload-tickets',
          data: {
            title: values.title,
            description: sanitizePlainText(values.description),
            priority: values.priority as TicketPriority,
            status: 'to_estimate',
            project: values.project,
            attachments: (values.attachments || []).map((a) => a.id),
            estimatedHours: 0,
            ...(currentUser?.role === 'client'
              ? { createdBy: currentUser.id, client: currentUser.id }
              : { createdBy: values.clientUserId, client: values.clientUserId }),
          },
        }
        await createMutation.mutateAsync(payloadData)
      }
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          <Button className={fullWidth ? 'w-full' : undefined} variant={triggerVariant}>
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Update Ticket for Re-Estimate' : 'Create New Ticket'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Modify details and send back to estimation'
              : 'Submit a new request for your project'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5">
          <FieldGroup>
            <Field>
              <FieldLabel>Project</FieldLabel>
              <Select
                value={form.watch('project')}
                onValueChange={(v) => form.setValue('project', v, { shouldValidate: true })}
                disabled={isLoadingProjects}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={isLoadingProjects ? 'Loading projects...' : 'Select a project'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {form.formState.errors.project?.message ? (
                <FieldDescription className="text-red-600">
                  {form.formState.errors.project.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Title</FieldLabel>
                <span
                  className={`text-xs ${titleCount > 100 ? 'text-red-600' : 'text-muted-foreground'}`}
                >
                  {titleCount}/100
                </span>
              </div>
              <Input
                value={form.watch('title')}
                onChange={(e) => {
                  form.setValue('title', e.target.value, { shouldValidate: true })
                  setTitleCount(e.target.value.length)
                }}
                placeholder="Short, descriptive title"
              />
              {form.formState.errors.title?.message ? (
                <FieldDescription className="text-red-600">
                  {form.formState.errors.title.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={form.watch('description')}
                onChange={(e) =>
                  form.setValue('description', e.target.value, { shouldValidate: true })
                }
                placeholder="Describe your request in detail"
                className="min-h-[180px]"
              />
              {form.formState.errors.description?.message ? (
                <FieldDescription className="text-red-600">
                  {form.formState.errors.description.message}
                </FieldDescription>
              ) : null}
            </Field>

            {currentUser?.role === 'admin' ? (
              <Field>
                <FieldLabel>Client</FieldLabel>
                <Select
                  value={form.watch('clientUserId') || ''}
                  onValueChange={(v) => form.setValue('clientUserId', v, { shouldValidate: true })}
                  disabled={isLoadingClients}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={isLoadingClients ? 'Loading clients...' : 'Select a client'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {form.formState.errors.clientUserId?.message ? (
                  <FieldDescription className="text-red-600">
                    {form.formState.errors.clientUserId.message}
                  </FieldDescription>
                ) : null}
              </Field>
            ) : null}

            <Field>
              <FieldLabel>Priority</FieldLabel>
              <PrioritySelector
                value={form.watch('priority') as TicketPriority}
                onChange={(v) => form.setValue('priority', v, { shouldValidate: true })}
              />
              {form.formState.errors.priority?.message ? (
                <FieldDescription className="text-red-600">
                  {form.formState.errors.priority.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Field>
              <FieldLabel>Attachments</FieldLabel>
              <FileUploadArea onChange={onFilesChange} onUploadingChange={onUploadStateChange} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <div className="flex w-full items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting ? 'Creating...' : isUploading ? 'Uploading files…' : 'Create Ticket'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
