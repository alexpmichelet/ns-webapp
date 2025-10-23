'use server'

import { revalidatePath } from 'next/cache'
import payload from '@/payload'
import type { TicketStatus } from '@/collections/Tickets'

export async function createTicket(data: {
  title: string
  description: any
  estimatedHours: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  attachments?: string[]
  tags?: { tag: string }[]
}) {
  try {
    const ticket = await payload.create({
      collection: 'tickets',
      data: {
        ...data,
        requiresClientApproval: true,
        maxRevisions: 2,
      },
    })

    // Create notification for admin
    await payload.create({
      collection: 'notifications',
      data: {
        recipient: process.env.ADMIN_USER_ID || '', // Set admin user ID
        type: 'ticket_created',
        channel: 'both',
        subject: 'New Ticket Created',
        message: `A new ticket "${data.title}" has been created.`,
        plainTextMessage: `A new ticket "${data.title}" has been created.`,
        relatedTicket: ticket.id,
      },
    })

    revalidatePath('/tickets')
    return { success: true, ticket }
  } catch (error) {
    console.error('Error creating ticket:', error)
    return { success: false, error: 'Failed to create ticket' }
  }
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  try {
    const ticket = await payload.findByID({
      collection: 'tickets',
      id: ticketId,
    })

    // Validate state transitions based on WORKFLOW_LOGIC.md
    const validTransitions: Record<TicketStatus, TicketStatus[]> = {
      pending_review: ['in_progress', 'blocked'],
      in_progress: ['pending_client_review', 'blocked', 'approved'],
      blocked: ['in_progress', 'pending_review'],
      pending_client_review: ['approved', 'revision_requested'],
      revision_requested: ['in_progress'],
      approved: ['invoiced'],
      invoiced: ['paid'],
      paid: [],
    }

    const currentStatus = ticket.status as TicketStatus
    if (!validTransitions[currentStatus].includes(status)) {
      return {
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${status}`,
      }
    }

    const updatedTicket = await payload.update({
      collection: 'tickets',
      id: ticketId,
      data: { status },
    })

    // Create notification for client
    const client = typeof ticket.client === 'string' ? ticket.client : ticket.client.id

    await payload.create({
      collection: 'notifications',
      data: {
        recipient: client,
        type: 'ticket_status_changed',
        channel: 'both',
        subject: 'Ticket Status Updated',
        message: `Your ticket "${ticket.title}" status has been updated to ${status.replace('_', ' ')}.`,
        plainTextMessage: `Your ticket "${ticket.title}" status has been updated to ${status.replace('_', ' ')}.`,
        relatedTicket: ticketId,
      },
    })

    revalidatePath('/tickets')
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
      collection: 'tickets',
      id: ticketId,
      data: {
        status: 'approved',
        completedAt: new Date().toISOString(),
      },
    })

    // Create notification for admin
    await payload.create({
      collection: 'notifications',
      data: {
        recipient: process.env.ADMIN_USER_ID || '',
        type: 'ticket_approved',
        channel: 'both',
        subject: 'Ticket Approved',
        message: `Ticket "${ticket.title}" has been approved by the client.`,
        plainTextMessage: `Ticket "${ticket.title}" has been approved by the client.`,
        relatedTicket: ticketId,
      },
    })

    revalidatePath('/tickets')
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
      collection: 'tickets',
      id: ticketId,
    })

    // Check if max revisions exceeded
    if ((ticket.revisionCount || 0) >= (ticket.maxRevisions || 2)) {
      return {
        success: false,
        error: 'Maximum revisions exceeded. Additional charges may apply.',
      }
    }

    const updatedTicket = await payload.update({
      collection: 'tickets',
      id: ticketId,
      data: {
        status: 'revision_requested',
      },
    })

    // Create notification for admin
    await payload.create({
      collection: 'notifications',
      data: {
        recipient: process.env.ADMIN_USER_ID || '',
        type: 'ticket_revision_requested',
        channel: 'both',
        subject: 'Revision Requested',
        message: `Client has requested revisions for ticket "${ticket.title}". Reason: ${reason}`,
        plainTextMessage: `Client has requested revisions for ticket "${ticket.title}". Reason: ${reason}`,
        relatedTicket: ticketId,
      },
    })

    revalidatePath('/tickets')
    revalidatePath(`/tickets/${ticketId}`)
    return { success: true, ticket: updatedTicket }
  } catch (error) {
    console.error('Error requesting revision:', error)
    return { success: false, error: 'Failed to request revision' }
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
