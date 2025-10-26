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
  throw new Error('Invoices are disabled')
}

/**
 * Create a payment intent for an invoice
 */
export async function createPaymentIntent(
  invoiceId: string,
  amount: number,
  currency: string = 'usd',
): Promise<Stripe.PaymentIntent> {
  throw new Error('Invoices are disabled')
}

/**
 * Handle successful payment webhook
 */
export async function handlePaymentSuccess(paymentIntentId: string): Promise<void> {
  // No-op; invoices disabled
}
