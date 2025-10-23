'use server'

import { revalidatePath } from 'next/cache'
import payload from '@/payload'
import { createStripeInvoice, createPaymentIntent } from '@/lib/stripe'
import type { InvoiceStatus } from '@/collections/Invoices'

export async function createInvoice(data: {
  client: string
  tickets: string[]
  taxRate?: number
  notes?: string
  terms?: string
}) {
  try {
    // Verify all tickets are approved
    const tickets = await payload.find({
      collection: 'tickets',
      where: {
        id: {
          in: data.tickets,
        },
      },
    })

    const unapprovedTickets = tickets.docs.filter(
      (t: import('@/payload-types').Ticket) => t.status !== 'approved',
    )
    if (unapprovedTickets.length > 0) {
      return {
        success: false,
        error: 'All tickets must be approved before invoicing',
      }
    }

    // Check for unpaid invoices
    const existingInvoices = await payload.find({
      collection: 'invoices',
      where: {
        client: {
          equals: data.client,
        },
        status: {
          in: ['pending', 'overdue'],
        },
      },
    })

    if (existingInvoices.docs.length > 0) {
      return {
        success: false,
        error: 'Client has unpaid invoices. Payment must be received before creating new invoice.',
      }
    }

    // Create the invoice
    const invoice = await payload.create({
      collection: 'invoices',
      data: {
        ...data,
        status: 'draft',
      },
    })

    revalidatePath('/invoices')
    return { success: true, invoice }
  } catch (error) {
    console.error('Error creating invoice:', error)
    return { success: false, error: 'Failed to create invoice' }
  }
}

export async function sendInvoice(invoiceId: string) {
  try {
    // Get the invoice
    const invoice = await payload.findByID({
      collection: 'invoices',
      id: invoiceId,
    })

    if (invoice.status !== 'draft') {
      return {
        success: false,
        error: 'Only draft invoices can be sent',
      }
    }

    // Create Stripe invoice
    const stripeInvoice = await createStripeInvoice(invoiceId)

    // Update status to pending
    const updatedInvoice = await payload.update({
      collection: 'invoices',
      id: invoiceId,
      data: {
        status: 'pending',
      },
    })

    // Send notification to client
    const clientId = typeof invoice.client === 'string' ? invoice.client : invoice.client.id

    await payload.create({
      collection: 'notifications',
      data: {
        recipient: clientId,
        type: 'invoice_created',
        channel: 'both',
        subject: `Invoice ${invoice.invoiceNumber} Ready`,
        message: `Your invoice ${invoice.invoiceNumber} for $${invoice.totalAmount.toFixed(2)} is ready. Please review and pay by ${new Date(invoice.dueDate).toLocaleDateString()}.`,
        plainTextMessage: `Your invoice ${invoice.invoiceNumber} for $${invoice.totalAmount.toFixed(2)} is ready. Please review and pay by ${new Date(invoice.dueDate).toLocaleDateString()}.`,
        relatedInvoice: invoiceId,
        emailData: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          dueDate: invoice.dueDate,
          paymentUrl: invoice.paymentUrl,
          pdfUrl: invoice.pdfUrl,
        },
      },
    })

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    return { success: true, invoice: updatedInvoice, paymentUrl: invoice.paymentUrl }
  } catch (error) {
    console.error('Error sending invoice:', error)
    return { success: false, error: 'Failed to send invoice' }
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  try {
    const invoice = await payload.update({
      collection: 'invoices',
      id: invoiceId,
      data: { status },
    })

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    return { success: true, invoice }
  } catch (error) {
    console.error('Error updating invoice status:', error)
    return { success: false, error: 'Failed to update invoice status' }
  }
}

export async function getInvoicesByClient(clientId: string) {
  try {
    const invoices = await payload.find({
      collection: 'invoices',
      where: {
        client: {
          equals: clientId,
        },
      },
      sort: '-createdAt',
      limit: 100,
    })

    return { success: true, invoices: invoices.docs }
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return { success: false, error: 'Failed to fetch invoices' }
  }
}

export async function getInvoiceById(invoiceId: string) {
  try {
    const invoice = await payload.findByID({
      collection: 'invoices',
      id: invoiceId,
    })

    return { success: true, invoice }
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return { success: false, error: 'Failed to fetch invoice' }
  }
}

export async function createPaymentIntentForInvoice(invoiceId: string) {
  try {
    const invoice = await payload.findByID({
      collection: 'invoices',
      id: invoiceId,
    })

    if (invoice.status === 'paid') {
      return {
        success: false,
        error: 'Invoice is already paid',
      }
    }

    const paymentIntent = await createPaymentIntent(invoiceId, invoice.totalAmount)

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return { success: false, error: 'Failed to create payment intent' }
  }
}

export async function checkOverdueInvoices() {
  try {
    const now = new Date()

    const invoices = await payload.find({
      collection: 'invoices',
      where: {
        status: {
          equals: 'pending',
        },
        dueDate: {
          less_than: now.toISOString(),
        },
      },
    })

    // Update overdue invoices
    for (const invoice of invoices.docs) {
      await payload.update({
        collection: 'invoices',
        id: invoice.id,
        data: {
          status: 'overdue',
        },
      })

      // Send overdue notification
      const clientId = typeof invoice.client === 'string' ? invoice.client : invoice.client.id

      await payload.create({
        collection: 'notifications',
        data: {
          recipient: clientId,
          type: 'invoice_overdue',
          channel: 'both',
          subject: `Invoice ${invoice.invoiceNumber} Overdue`,
          message: `Your invoice ${invoice.invoiceNumber} for $${invoice.totalAmount.toFixed(2)} is now overdue. Please pay as soon as possible.`,
          plainTextMessage: `Your invoice ${invoice.invoiceNumber} for $${invoice.totalAmount.toFixed(2)} is now overdue. Please pay as soon as possible.`,
          relatedInvoice: invoice.id,
          emailData: {
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount,
            paymentUrl: invoice.paymentUrl,
          },
        },
      })
    }

    return { success: true, overdueCount: invoices.docs.length }
  } catch (error) {
    console.error('Error checking overdue invoices:', error)
    return { success: false, error: 'Failed to check overdue invoices' }
  }
}
