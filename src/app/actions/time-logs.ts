'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function createTimeLog(data: {
  ticket: string
  description: string
  hours: number
  date?: string
  startTime?: string
  endTime?: string
  isBillable?: boolean
  tags?: { tag: string }[]
}) {
  try {
    const payload = (await getPayload({ config })) as any
    const timeLog = await payload.create({
      collection: 'payload-time-logs',
      data: {
        ...data,
        isBillable: data.isBillable !== false, // Default to true
        date: data.date || new Date().toISOString(),
      },
    })

    // Get ticket and client info for notification
    const ticket = await payload.findByID({
      collection: 'payload-tickets',
      id: data.ticket,
    })

    const clientId = typeof ticket.client === 'string' ? ticket.client : ticket.client.id

    // Create notification for client
    await payload.create({
      collection: 'payload-notifications',
      data: {
        recipient: clientId,
        type: 'ticket_created',
        title: 'Time Logged',
        message: `${data.hours} hours logged on ticket "${ticket.title}": ${data.description}`,
        relatedTicket: data.ticket,
      },
    })

    revalidatePath('/time-logs')
    revalidatePath(`/tickets/${data.ticket}`)
    return { success: true, timeLog }
  } catch (error) {
    console.error('Error creating time log:', error)
    return { success: false, error: 'Failed to create time log' }
  }
}

export async function updateTimeLog(
  timeLogId: string,
  data: {
    description?: string
    hours?: number
    date?: string
    isBillable?: boolean
  },
) {
  try {
    const payload = (await getPayload({ config })) as any
    // Check if time log is already invoiced
    const existingLog = await payload.findByID({
      collection: 'payload-time-logs',
      id: timeLogId,
    })

    if (existingLog.isInvoiced) {
      return {
        success: false,
        error: 'Cannot update time log that has been invoiced',
      }
    }

    const timeLog = await payload.update({
      collection: 'payload-time-logs',
      id: timeLogId,
      data,
    })

    revalidatePath('/time-logs')
    revalidatePath(`/tickets/${timeLog.ticket}`)
    return { success: true, timeLog }
  } catch (error) {
    console.error('Error updating time log:', error)
    return { success: false, error: 'Failed to update time log' }
  }
}

export async function deleteTimeLog(timeLogId: string) {
  try {
    const payload = (await getPayload({ config })) as any
    await payload.delete({
      collection: 'payload-time-logs',
      id: timeLogId,
    })

    revalidatePath('/time-logs')
    return { success: true }
  } catch (error) {
    console.error('Error deleting time log:', error)
    return { success: false, error: 'Failed to delete time log' }
  }
}

export async function getTimeLogsByTicket(ticketId: string) {
  try {
    const payload = (await getPayload({ config })) as any
    const timeLogs = await payload.find({
      collection: 'payload-time-logs',
      where: {
        ticket: {
          equals: ticketId,
        },
      },
      sort: '-date',
      limit: 100,
    })

    return { success: true, timeLogs: timeLogs.docs }
  } catch (error) {
    console.error('Error fetching time logs:', error)
    return { success: false, error: 'Failed to fetch time logs' }
  }
}

export async function getUninvoicedTimeLogs(clientId?: string) {
  try {
    const payload = (await getPayload({ config })) as any
    type EqualsFilter<T> = { equals: T }
    type TimeLogsWhere = {
      isInvoiced?: EqualsFilter<boolean>
      isBillable?: EqualsFilter<boolean>
    } & Record<string, EqualsFilter<string> | EqualsFilter<boolean> | undefined>

    const where: TimeLogsWhere = {
      isInvoiced: {
        equals: false,
      },
      isBillable: {
        equals: true,
      },
    }

    if (clientId) {
      where['ticket.client'] = {
        equals: clientId,
      }
    }

    const timeLogs = await payload.find({
      collection: 'payload-time-logs',
      where,
      sort: '-date',
      limit: 1000,
    })

    return { success: true, timeLogs: timeLogs.docs }
  } catch (error) {
    console.error('Error fetching uninvoiced time logs:', error)
    return { success: false, error: 'Failed to fetch uninvoiced time logs' }
  }
}

export async function getTotalHoursByTicket(ticketId: string) {
  try {
    const payload = (await getPayload({ config })) as any
    const timeLogs = await payload.find({
      collection: 'payload-time-logs',
      where: {
        ticket: {
          equals: ticketId,
        },
      },
      limit: 1000,
    })

    const totalHours = timeLogs.docs.reduce(
      (sum: number, log: import('@/payload-types').PayloadTimeLog) => sum + (log.hours || 0),
      0,
    )
    const billableHours = timeLogs.docs
      .filter((log: import('@/payload-types').PayloadTimeLog) => log.isBillable)
      .reduce(
        (sum: number, log: import('@/payload-types').PayloadTimeLog) => sum + (log.hours || 0),
        0,
      )

    return {
      success: true,
      totalHours,
      billableHours,
      logs: timeLogs.docs,
    }
  } catch (error) {
    console.error('Error calculating hours:', error)
    return { success: false, error: 'Failed to calculate hours' }
  }
}
