'use server'

import { revalidatePath } from 'next/cache'
import payload from '@/payload'
import type { TicketStatus } from '@/collections/Tickets'
import { revalidateTag } from 'next/cache'

export async function createTicket(data: {
  title: string
  description: any
  project: string
  estimatedHours: number
  priority?: 'low' | 'medium' | 'high' | 'absolute'
  attachments?: string[]
}) {
  try {
    const ticket = await payload.create({
      collection: 'payload-tickets',
      data: {
        ...data,
      },
    })

    revalidatePath('/tickets')
    revalidatePath('/dashboard')
    return { success: true, ticket }
  } catch (error) {
    console.error('Error creating ticket:', error)
    return { success: false, error: 'Failed to create ticket' }
  }
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  try {
    const ticket = await payload.findByID({
      collection: 'payload-tickets',
      id: ticketId,
    })

    // Validate state transitions based on WORKFLOW_LOGIC.md
    const validTransitions: Record<TicketStatus, TicketStatus[]> = {
      to_estimate: ['needs_client_review', 'ready_to_develop'],
      needs_client_review: ['ready_to_develop', 'to_estimate'],
      ready_to_develop: ['development_in_progress', 'needs_client_review'],
      development_in_progress: ['ready_to_test', 'needs_client_review'],
      ready_to_test: ['done', 'development_in_progress'],
      done: ['paid_closed'],
      paid_closed: [],
    }

    const currentStatus = ticket.status as TicketStatus
    if (!validTransitions[currentStatus].includes(status)) {
      return {
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${status}`,
      }
    }

    const updatedTicket = await payload.update({
      collection: 'payload-tickets',
      id: ticketId,
      data: { status },
    })

    revalidatePath('/tickets')
    revalidatePath('/dashboard')
    revalidatePath(`/tickets/${ticketId}`)
    return { success: true, ticket: updatedTicket }
  } catch (error) {
    console.error('Error updating ticket status:', error)
    return { success: false, error: 'Failed to update ticket status' }
  }
}

export async function approveTicket(ticketId: string) {
  try {
    const ticket = await payload.update({
      collection: 'payload-tickets',
      id: ticketId,
      data: {
        status: 'ready_to_develop',
      },
    })

    revalidatePath('/tickets')
    revalidatePath('/dashboard')
    revalidatePath(`/tickets/${ticketId}`)
    return { success: true, ticket }
  } catch (error) {
    console.error('Error approving ticket:', error)
    return { success: false, error: 'Failed to approve ticket' }
  }
}

export async function requestRevision(ticketId: string, reason: string) {
  try {
    const ticket = await payload.findByID({
      collection: 'payload-tickets',
      id: ticketId,
    })

    // Check if max revisions exceeded
    if ((ticket.revisionCount || 0) >= (ticket.maxRevisions || 3)) {
      return {
        success: false,
        error: 'Maximum revisions exceeded. Additional charges may apply.',
      }
    }

    const updatedTicket = await payload.update({
      collection: 'payload-tickets',
      id: ticketId,
      data: {
        isRevision: true,
        revisionCount: (ticket.revisionCount || 0) + 1,
        status: 'to_estimate',
      },
    })

    revalidatePath('/tickets')
    revalidatePath('/dashboard')
    revalidatePath(`/tickets/${ticketId}`)
    return { success: true, ticket: updatedTicket }
  } catch (error) {
    console.error('Error requesting revision:', error)
    return { success: false, error: 'Failed to request revision' }
  }
}

export async function submitEstimate(params: {
  ticketId: string
  estimatedHours: number
  breakdown: string
  internalNotes?: string
}) {
  try {
    const existing = await payload.findByID({
      collection: 'payload-tickets',
      id: params.ticketId,
    })

    // Update estimate and move status to needs_client_review
    const updated = await payload.update({
      collection: 'payload-tickets',
      id: params.ticketId,
      data: {
        estimatedHours: params.estimatedHours,
        status: 'needs_client_review',
      },
    })

    revalidatePath('/tickets/estimation-queue')
    revalidatePath('/dashboard')
    revalidatePath(`/tickets/${params.ticketId}`)
    return { success: true, ticket: updated }
  } catch (error) {
    console.error('Error submitting estimate:', error)
    return { success: false, error: 'Failed to submit estimate' }
  }
}

export async function getTicketsByClient(clientId: string) {
  try {
    const tickets = await payload.find({
      collection: 'tickets',
      where: {
        client: {
          equals: clientId,
        },
      },
      sort: '-createdAt',
      limit: 100,
    })

    return { success: true, tickets: tickets.docs }
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return { success: false, error: 'Failed to fetch tickets' }
  }
}

export async function getTicketById(ticketId: string) {
  try {
    const ticket = await payload.findByID({
      collection: 'tickets',
      id: ticketId,
    })

    return { success: true, ticket }
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return { success: false, error: 'Failed to fetch ticket' }
  }
}
