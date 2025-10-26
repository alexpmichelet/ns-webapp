import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = (await getPayload({ config })) as any
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')

    const where: Record<string, unknown> = {}

    if (role) {
      where.role = { equals: role }
    }

    const users = await payload.find({
      collection: 'users',
      where,
      limit: 100,
    })

    return NextResponse.json({ users: users.docs })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
