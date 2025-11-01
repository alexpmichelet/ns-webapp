'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import PriorityBadge from '@/components/atoms/priority-badge'
import PrioritySelector from '@/components/molecules/tickets/PrioritySelector'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog'
import { payloadHook } from '@/lib/data/payload'
import { useToast } from '@/hooks/use-toast'
import { authClient } from '@/lib/auth/client'
import {
  ArrowLeft,
  Clock,
  Timer,
  Calendar,
  Paperclip,
  MoreHorizontal,
  Edit,
  Check,
  X,
} from 'lucide-react'
import FileUploadArea, { UploadedFile } from '@/components/molecules/tickets/FileUploadArea'
import type { PayloadTicket } from '@/payload-types'
import type { TicketPriority } from '@/collections/Tickets'

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

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const session = authClient.useSession()
  const user = session?.data?.user as { id: string; name: string; role: string } | undefined
  const isAdmin = user?.role === 'admin'

  // Attachment upload state
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  // Priority change state
  const [showPriorityDialog, setShowPriorityDialog] = useState(false)
  const [tempPriority, setTempPriority] = useState<TicketPriority>('medium')

  // Description edit state
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [tempDescription, setTempDescription] = useState('')

  const { data: ticketRes, isLoading: isLoadingTicket } = payloadHook.findByID(
    {
      collection: 'payload-tickets',
      id: params.id as string,
      disableErrors: true,
    } as any,
    { enabled: !!params.id },
  )

  const ticket = ticketRes as PayloadTicket | undefined

  // Determine if priority can be changed
  const restrictedStatuses = ['done', 'ready_to_test', 'development_in_progress']
  const canChangePriority = isAdmin || (ticket && !restrictedStatuses.includes(ticket.status || ''))

  // Determine if description can be edited
  const descriptionRestrictedStatuses = ['done', 'ready_to_test', 'ready_to_develop']
  const canEditDescription =
    isAdmin || (ticket && !descriptionRestrictedStatuses.includes(ticket.status || ''))

  // Update temp priority when ticket loads
  useEffect(() => {
    if (ticket?.priority) {
      setTempPriority(ticket.priority as TicketPriority)
    }
  }, [ticket?.priority])

  // Update temp description when ticket loads
  useEffect(() => {
    if (ticket?.description) {
      setTempDescription(ticket.description)
    }
  }, [ticket?.description])

  // File upload handlers
  const onUploadStateChange = useCallback((uploading: boolean) => {
    setIsUploading(uploading)
  }, [])

  const onFilesChange = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(files)
  }, [])

  // Update ticket with new attachments
  const updateTicketMutation = payloadHook.updateByID('payload-tickets')

  // Update ticket priority
  const updatePriorityMutation = payloadHook.updateByID('payload-tickets')

  const handleAddAttachments = useCallback(async () => {
    if (!ticket || uploadedFiles.length === 0) return

    setIsUploading(true)
    try {
      const existingAttachments = Array.isArray(ticket.attachments)
        ? ticket.attachments.map((a: any) => a.id || a.media?.id || a)
        : []

      const newAttachmentIds = uploadedFiles
        .filter((f) => f.status === 'uploaded' && f.mediaId)
        .map((f) => f.mediaId!)

      const updatedAttachments = [...existingAttachments, ...newAttachmentIds]

      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        data: {
          attachments: updatedAttachments,
        },
      } as any)

      toast({
        variant: 'success',
        title: 'Attachments added',
        description: `${uploadedFiles.length} file(s) added to the ticket.`,
      })

      setShowAttachmentDialog(false)
      setUploadedFiles([])
      // Refresh the page to show new attachments
      window.location.reload()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to add attachments',
        description: 'Please try again.',
      })
    } finally {
      setIsUploading(false)
    }
  }, [ticket, uploadedFiles, updateTicketMutation, toast])

  const handleUpdatePriority = useCallback(async () => {
    if (!ticket) return

    try {
      await updatePriorityMutation.mutateAsync({
        id: ticket.id,
        data: {
          priority: tempPriority,
        },
      } as any)

      toast({
        variant: 'success',
        title: 'Priority updated',
        description: `Ticket priority changed to ${tempPriority}.`,
      })

      setShowPriorityDialog(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update priority',
        description: 'Please try again.',
      })
    }
  }, [ticket, tempPriority, updatePriorityMutation, toast])

  const handleUpdateDescription = useCallback(async () => {
    if (!ticket) return

    try {
      const updateData: any = {
        description: tempDescription,
      }

      // If client is updating description, automatically move to "To Estimate" status
      if (!isAdmin) {
        updateData.status = 'to_estimate'
      }

      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        data: updateData,
      } as any)

      toast({
        variant: 'success',
        title: 'Description updated',
        description: !isAdmin
          ? 'Description updated and ticket moved to "To Estimate".'
          : 'Description updated successfully.',
      })

      setIsEditingDescription(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update description',
        description: 'Please try again.',
      })
    }
  }, [ticket, tempDescription, isAdmin, updateTicketMutation, toast])

  if (isLoadingTicket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading ticket...</p>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Ticket not found</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const clientName =
    typeof ticket.client === 'object'
      ? (ticket.client as any)?.name || (ticket.client as any)?.email || 'Client'
      : 'Client'
  const projectName = typeof ticket.project === 'object' ? (ticket.project as any)?.name : undefined
  const assignedUsers = Array.isArray(ticket.assignedTo)
    ? (ticket.assignedTo as any[]).map((u) => ({
        id: String(u.id || u),
        name: u.name || u.email || 'User',
        avatar: (u as any).avatarUrl,
        initials: initialsFromName(u.name || u.email || 'User'),
      }))
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-px h-12 bg-gray-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {(ticket as any).ticketNumber && (
                  <span className="text-sm font-mono text-gray-500 block mb-2">
                    {(ticket as any).ticketNumber}
                  </span>
                )}
                <h1 className="text-3xl font-bold text-gray-900 leading-tight break-words">
                  {ticket.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge variant="outline" className="text-sm capitalize px-3 py-1">
                {ticket.status?.replaceAll('_', ' ')}
              </Badge>
              {canChangePriority ? (
                <button
                  onClick={() => setShowPriorityDialog(true)}
                  className="hover:opacity-80 transition-opacity"
                >
                  <PriorityBadge priority={ticket.priority} />
                </button>
              ) : (
                <PriorityBadge priority={ticket.priority} />
              )}
              {/* <Button variant="outline" size="sm">
                <MoreHorizontal className="w-5 h-5" />
              </Button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`max-w-7xl mx-auto p-6 ${isAdmin ? 'flex gap-6' : ''}`}>
        {/* Main Content */}
        <div className={`${isAdmin ? 'flex-1' : 'max-w-4xl mx-auto'} space-y-6`}>
          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Description</h3>
              {canEditDescription && !isEditingDescription && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingDescription(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              {isEditingDescription ? (
                <div className="p-6 space-y-4">
                  <textarea
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    placeholder="Enter ticket description..."
                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={6}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingDescription(false)
                        setTempDescription(ticket?.description || '')
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUpdateDescription}
                      disabled={!tempDescription.trim() || tempDescription === ticket?.description}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8">
                  <p className="text-base text-gray-700 whitespace-pre-line leading-relaxed">
                    {ticket.description || 'No description provided.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Attachments</h3>
              {!isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAttachmentDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Paperclip className="w-4 h-4" />
                  Add Attachment
                </Button>
              )}
            </div>
            {(!ticket.attachments ||
              !Array.isArray(ticket.attachments) ||
              ticket.attachments.length === 0) && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <div className="text-center">
                  <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No attachments yet</p>
                </div>
              </div>
            )}
            {ticket.attachments &&
              Array.isArray(ticket.attachments) &&
              ticket.attachments.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ticket.attachments.map((attachment: any, index: number) => {
                      const media = attachment.media || attachment
                      const fileName = media?.filename || media?.name || `File ${index + 1}`
                      const fileUrl = media?.url || media?.src
                      const isImage =
                        media?.mimeType?.startsWith('image/') ||
                        fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)

                      return (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isImage && fileUrl ? (
                              <img
                                src={fileUrl}
                                alt={fileName}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                <Paperclip className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium text-gray-900 truncate"
                                title={fileName}
                              >
                                {fileName}
                              </p>
                              {fileUrl && (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  View file
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
          </div>

          {/* Time Tracking */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Time Tracking</h3>
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {ticket.estimatedHours || 0}h
                  </div>
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Estimated
                  </div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {ticket.actualHours || 0}h
                  </div>
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Actual
                  </div>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-4xl font-bold text-gray-700 mb-2">
                    {ticket.estimatedHours && ticket.actualHours && ticket.actualHours > 0
                      ? Math.round((ticket.actualHours / ticket.estimatedHours) * 100)
                      : 0}
                    %
                  </div>
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    {ticket.actualHours && ticket.actualHours > 0 ? 'Used' : 'Progress'}
                  </div>
                </div>
              </div>

              {ticket.actualHours && ticket.actualHours > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      ticket.actualHours <= ticket.estimatedHours ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (ticket.actualHours / ticket.estimatedHours) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Testing Information */}
          {ticket.status === 'ready_to_test' && (ticket as any).testingDeadline && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Testing Information</h3>
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-base text-gray-600">Testing Deadline</span>
                  <span className="text-base font-semibold text-gray-900">
                    {new Date((ticket as any).testingDeadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="testing-countdown bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-medium text-blue-700">Time Remaining</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatRelativeTime((ticket as any).testingDeadline)}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            100 -
                              ((new Date((ticket as any).testingDeadline).getTime() - Date.now()) /
                                (5 * 24 * 60 * 60 * 1000)) *
                                100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-2">
                  <Button className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700">
                    Accept Feature
                  </Button>
                  <Button className="flex-1 h-12 text-base bg-orange-600 hover:bg-orange-700">
                    Request Revision
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Comments - Only for admins */}
          {isAdmin && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Activity & Comments</h3>
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <p className="text-base text-gray-500 italic">No comments yet.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Only for admins */}
        {isAdmin && (
          <div className="w-[380px] flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-24">
              <h4 className="font-semibold text-lg mb-5 text-gray-900">Properties</h4>
              <div className="space-y-0">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <Badge variant="outline" className="text-sm capitalize px-3 py-1">
                    {ticket.status?.replaceAll('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Priority</span>
                  {canChangePriority ? (
                    <button
                      onClick={() => setShowPriorityDialog(true)}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <PriorityBadge priority={ticket.priority} />
                    </button>
                  ) : (
                    <PriorityBadge priority={ticket.priority} />
                  )}
                </div>
                {/* Project and Client info - Only for admins */}
                {isAdmin && projectName && (
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Project</span>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {projectName}
                    </Badge>
                  </div>
                )}
                {isAdmin && (
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Client</span>
                    <span className="text-sm font-semibold text-gray-900">{clientName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Assignees</span>
                  <div className="flex items-center gap-1.5">
                    {assignedUsers.length ? (
                      assignedUsers.map((u) => (
                        <Avatar key={u.id} className="w-8 h-8 border-2 border-white shadow-sm">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback className="text-xs font-medium">
                            {u.initials}
                          </AvatarFallback>
                        </Avatar>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </div>
                </div>
                {(ticket as any).createdAt && (
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Created</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date((ticket as any).createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatRelativeTime((ticket as any).createdAt)}
                      </div>
                    </div>
                  </div>
                )}
                {ticket.estimatedHours && (
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Estimated</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {ticket.estimatedHours}h
                    </span>
                  </div>
                )}
                {ticket.actualHours && ticket.actualHours > 0 && (
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Time Spent</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {ticket.actualHours}h
                    </span>
                  </div>
                )}
              </div>

              {/* Revision Info */}
              {(ticket as any).isRevision && (
                <div className="revision-info bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mt-6">
                  <h4 className="font-semibold text-base text-orange-900 mb-2">Revision Ticket</h4>
                  <p className="text-sm text-orange-700 leading-relaxed">
                    This is revision {(ticket as any).revisionCount || 1} of 3
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6">
                <h4 className="font-semibold text-base mb-4 text-gray-900">Actions</h4>
                <div className="space-y-3">
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="w-full justify-start h-11 text-sm font-medium"
                    >
                      <Clock className="w-4 h-4 mr-3" />
                      Log Time
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start h-11 text-sm font-medium"
                    onClick={() => setShowAttachmentDialog(true)}
                  >
                    <Paperclip className="w-4 h-4 mr-3" />
                    Add Attachment
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="w-full justify-start h-11 text-sm font-medium"
                    >
                      <MoreHorizontal className="w-4 h-4 mr-3" />
                      More Options
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Priority Change Dialog */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Priority</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <PrioritySelector value={tempPriority} onChange={setTempPriority} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowPriorityDialog(false)
                setTempPriority((ticket?.priority as TicketPriority) || 'medium')
              }}
              disabled={!ticket}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePriority}
              disabled={tempPriority === ticket?.priority || !ticket}
            >
              Update Priority
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attachment Upload Dialog */}
      <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Attachments to Ticket</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 pr-2">
              <FileUploadArea onChange={onFilesChange} onUploadingChange={onUploadStateChange} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAttachmentDialog(false)
                setUploadedFiles([])
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAttachments}
              disabled={isUploading || uploadedFiles.length === 0}
            >
              {isUploading ? 'Adding...' : 'Add Attachments'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
