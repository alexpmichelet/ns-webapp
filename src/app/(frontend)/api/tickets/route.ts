import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = (await getPayload({ config })) as any
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = {}

    if (status === 'active') {
      where.status = {
        not_in: ['paid_closed'],
      }
    } else if (status) {
      where.status = { equals: status }
    }

    const tickets = await payload.find({
      collection: 'payload-tickets',
      where,
      limit,
      sort: '-createdAt',
    })

    return NextResponse.json({ tickets: tickets.docs })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}
