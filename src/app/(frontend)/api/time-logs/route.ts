import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = (await getPayload({ config })) as any
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')

    const timeLogs = await payload.find({
      collection: 'payload-time-logs',
      limit,
      sort: '-date',
    })

    return NextResponse.json({ timeLogs: timeLogs.docs })
  } catch (error) {
    console.error('Error fetching time logs:', error)
    return NextResponse.json({ error: 'Failed to fetch time logs' }, { status: 500 })
  }
}
