'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar'
import { payloadHook } from '@/lib/data/payload'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Clock, Timer, Calendar, Paperclip, MoreHorizontal } from 'lucide-react'
import type { PayloadTicket } from '@/payload-types'

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

function PriorityBadge({ priority }: { priority: PayloadTicket['priority'] }) {
  const variant =
    priority === 'absolute' ? 'destructive' : priority === 'high' ? 'default' : 'outline'
  return (
    <Badge variant={variant} className="text-sm h-6 px-3">
      {priority}
    </Badge>
  )
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const { data: ticketRes, isLoading: isLoadingTicket } = payloadHook.findByID(
    {
      collection: 'payload-tickets',
      id: params.id as string,
      disableErrors: true,
    } as any,
    { enabled: !!params.id },
  )

  const ticket = ticketRes as PayloadTicket | undefined

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
              <PriorityBadge priority={ticket.priority} />
              <Button variant="outline" size="sm">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto flex gap-6 p-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Description</h3>
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              <p className="text-base text-gray-700 whitespace-pre-line leading-relaxed">
                {ticket.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {ticket.attachments && Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Attachments</h3>
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 text-base text-gray-700">
                  <Paperclip className="w-5 h-5" />
                  <span>
                    {ticket.attachments.length} file{ticket.attachments.length > 1 ? 's' : ''}{' '}
                    attached
                  </span>
                </div>
              </div>
            </div>
          )}

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

          {/* Comments */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Activity & Comments</h3>
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              <p className="text-base text-gray-500 italic">No comments yet.</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
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
                <PriorityBadge priority={ticket.priority} />
              </div>
              {projectName && (
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Project</span>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {projectName}
                  </Badge>
                </div>
              )}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Client</span>
                <span className="text-sm font-semibold text-gray-900">{clientName}</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Assignees</span>
                <div className="flex items-center gap-1.5">
                  {assignedUsers.length ? (
                    assignedUsers.map((u) => (
                      <Avatar key={u.id} className="w-8 h-8 border-2 border-white shadow-sm">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="text-xs font-medium">{u.initials}</AvatarFallback>
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
                  <span className="text-sm font-semibold text-gray-900">{ticket.estimatedHours}h</span>
                </div>
              )}
              {ticket.actualHours && ticket.actualHours > 0 && (
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Time Spent</span>
                  <span className="text-sm font-semibold text-gray-900">{ticket.actualHours}h</span>
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
                <Button variant="outline" className="w-full justify-start h-11 text-sm font-medium">
                  <Clock className="w-4 h-4 mr-3" />
                  Log Time
                </Button>
                <Button variant="outline" className="w-full justify-start h-11 text-sm font-medium">
                  <Paperclip className="w-4 h-4 mr-3" />
                  Add Attachment
                </Button>
                <Button variant="outline" className="w-full justify-start h-11 text-sm font-medium">
                  <MoreHorizontal className="w-4 h-4 mr-3" />
                  More Options
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
