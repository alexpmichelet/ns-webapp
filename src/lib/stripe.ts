import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

/**
 * Create or retrieve a Stripe customer for a company
 */
export async function getOrCreateStripeCustomerForCompany(
  companyId: string,
  name: string,
  email?: string,
  metadata?: Record<string, string>,
): Promise<string> {
  const payload = (await import('@/payload')).default

  const company = await payload.findByID({
    collection: 'payload-companies',
    id: companyId,
  })

  if ((company as any).stripeCustomerId) {
    return (company as any).stripeCustomerId as string
  }

  const customer = await stripe.customers.create({
    name,
    email,
    metadata: {
      companyId,
      ...metadata,
    },
  })

  await payload.update({
    collection: 'payload-companies',
    id: companyId,
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
    collection: 'payload-invoices',
    id: invoiceId,
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  // Resolve company
  const company = await payload.findByID({
    collection: 'payload-companies',
    id:
      typeof (invoice as any).client === 'string'
        ? (invoice as any).client
        : (invoice as any).client.id,
  })

  const primaryMemberEmail = undefined as string | undefined
  const customerId = await getOrCreateStripeCustomerForCompany(
    company.id as string,
    (company as any).name,
    primaryMemberEmail,
    {
      companyId: company.id as string,
    },
  )

  const stripeInvoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: 'send_invoice',
    days_until_due: 30,
    metadata: {
      invoiceId: (invoice as any).id,
      invoiceNumber: (invoice as any).invoiceNumber,
    },
    description: `Invoice ${(invoice as any).invoiceNumber}`,
  })

  for (const item of (invoice as any).lineItems || []) {
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: stripeInvoice.id,
      description: (item as any).description,
      quantity: Math.round((item as any).hours),
      unit_amount_decimal: String(Math.round((item as any).rate * 100)),
      currency: 'usd',
    })
  }

  const finalizedInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id)

  await payload.update({
    collection: 'payload-invoices',
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
    collection: 'payload-invoices',
    id: invoiceId,
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  const company = await payload.findByID({
    collection: 'payload-companies',
    id:
      typeof (invoice as any).client === 'string'
        ? (invoice as any).client
        : (invoice as any).client.id,
  })

  const customerId = await getOrCreateStripeCustomerForCompany(
    company.id as string,
    (company as any).name,
  )

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    customer: customerId,
    metadata: {
      invoiceId: (invoice as any).id,
      invoiceNumber: (invoice as any).invoiceNumber,
    },
    description: `Payment for invoice ${(invoice as any).invoiceNumber}`,
  })

  await payload.update({
    collection: 'payload-invoices',
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

  const invoices = await payload.find({
    collection: 'payload-invoices',
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

  await payload.update({
    collection: 'payload-invoices',
    id: (invoice as any).id,
    data: {
      status: 'paid',
      paidAt: new Date().toISOString(),
    },
  })

  // Notify all members of the company (or keep as is to notify a user if desired)
}
