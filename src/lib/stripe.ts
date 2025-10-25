import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string,
  metadata?: Record<string, string>,
): Promise<string> {
  // Check if customer already exists in our database
  const payload = (await import('@/payload')).default

  const user = await payload.findByID({
    collection: 'users',
    id: userId,
  })

  if (user.stripeCustomerId) {
    return user.stripeCustomerId
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
      ...metadata,
    },
  })

  // Save customer ID to user
  await payload.update({
    collection: 'users',
    id: userId,
    data: {
      stripeCustomerId: customer.id,
    },
  })

  return customer.id
}

/**
 * Create a Stripe invoice for a Payload invoice
 */
export async function createStripeInvoice(invoiceId: string): Promise<Stripe.Invoice> {
  const payload = (await import('@/payload')).default

  const invoice = await payload.findByID({
    collection: 'invoices',
    id: invoiceId,
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  // Get client user
  const client = await payload.findByID({
    collection: 'users',
    id: typeof invoice.client === 'string' ? invoice.client : invoice.client.id,
  })

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(client.id, client.email, client.name, {
    company: client.company || '',
  })

  // Create Stripe invoice
  const stripeInvoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: 'send_invoice',
    days_until_due: 30,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    },
    description: `Invoice ${invoice.invoiceNumber}`,
  })

  // Add line items
  for (const item of invoice.lineItems || []) {
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: stripeInvoice.id,
      description: item.description,
      quantity: Math.round(item.hours),
      unit_amount_decimal: String(Math.round(item.rate * 100)),
      currency: 'usd',
    })
  }

  // Finalize the invoice
  const finalizedInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id)

  // Update Payload invoice with Stripe data
  await payload.update({
    collection: 'invoices',
    id: invoiceId,
    data: {
      stripeInvoiceId: finalizedInvoice.id,
      paymentUrl: finalizedInvoice.hosted_invoice_url || undefined,
      pdfUrl: finalizedInvoice.invoice_pdf || undefined,
    },
  })

  return finalizedInvoice
}

/**
 * Create a payment intent for an invoice
 */
export async function createPaymentIntent(
  invoiceId: string,
  amount: number,
  currency: string = 'usd',
): Promise<Stripe.PaymentIntent> {
  const payload = (await import('@/payload')).default

  const invoice = await payload.findByID({
    collection: 'invoices',
    id: invoiceId,
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  const client = await payload.findByID({
    collection: 'users',
    id: typeof invoice.client === 'string' ? invoice.client : invoice.client.id,
  })

  const customerId = await getOrCreateStripeCustomer(client.id, client.email, client.name)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    customer: customerId,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    },
    description: `Payment for invoice ${invoice.invoiceNumber}`,
  })

  // Update invoice with payment intent ID
  await payload.update({
    collection: 'invoices',
    id: invoiceId,
    data: {
      stripePaymentIntentId: paymentIntent.id,
    },
  })

  return paymentIntent
}

/**
 * Handle successful payment webhook
 */
export async function handlePaymentSuccess(paymentIntentId: string): Promise<void> {
  const payload = (await import('@/payload')).default

  // Find invoice by payment intent ID
  const invoices = await payload.find({
    collection: 'invoices',
    where: {
      stripePaymentIntentId: {
        equals: paymentIntentId,
      },
    },
    limit: 1,
  })

  if (invoices.docs.length === 0) {
    throw new Error('Invoice not found for payment intent')
  }

  const invoice = invoices.docs[0]

  // Update invoice status to paid
  await payload.update({
    collection: 'invoices',
    id: invoice.id,
    data: {
      status: 'paid',
      paidAt: new Date().toISOString(),
    },
  })

  // Create notification for client
  await payload.create({
    collection: 'payload-notifications',
    data: {
      recipient: typeof invoice.client === 'string' ? invoice.client : invoice.client.id,
      type: 'payment_marked',
      title: 'Payment Received',
      message: `Your payment for invoice ${invoice.invoiceNumber} has been received. Thank you!`,
    },
  })
}
