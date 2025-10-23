import { NextRequest, NextResponse } from 'next/server'
import payload from '@/payload'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}

    if (clientId) {
      where.client = { equals: clientId }
    }

    if (status) {
      where.status = { equals: status }
    }

    const invoices = await payload.find({
      collection: 'invoices',
      where,
      limit,
      sort: '-createdAt',
    })

    return NextResponse.json({ invoices: invoices.docs })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
