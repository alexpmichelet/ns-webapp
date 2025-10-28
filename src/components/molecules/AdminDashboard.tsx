'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import Link from 'next/link'
import { TicketKanbanBoard } from '@/components/molecules/TicketKanbanBoard'
import { payloadHook } from '@/lib/data/payload'

export default function AdminDashboard() {
  const { data: ticketsRes } = payloadHook.find(
    {
      collection: 'payload-tickets',
      where: { status: { not_equals: 'paid_closed' } },
      limit: 1000,
      sort: '-updatedAt',
    } as any,
    {
      // @ts-ignore
      refetchInterval: 60_000,
    },
  )

  const counts = useMemo(() => {
    const docs = (ticketsRes as any)?.docs || []
    return {
      toEstimate: docs.filter((d: any) => d.status === 'to_estimate').length,
      needsReview: docs.filter((d: any) => d.status === 'needs_client_review').length,
      active: docs.filter((d: any) => d.status !== 'paid_closed').length,
      readyToTest: docs.filter((d: any) => d.status === 'ready_to_test').length,
    }
  }, [ticketsRes])

  // Uninvoiced hours (sum of hours where isBillable && !isInvoiced)
  const { data: logsRes } = payloadHook.find(
    {
      collection: 'payload-time-logs',
      limit: 1000,
      sort: '-date',
    } as any,
    {
      // @ts-ignore
      refetchInterval: 60_000,
    },
  )

  // Monthly revenue (sum of totalAmount for this month where isBillable && isInvoiced)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const endOfMonth = new Date(startOfMonth)
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)
  endOfMonth.setMilliseconds(-1)

  const monthlyRevenueLogs = useMemo(() => {
    const docs = (logsRes as any)?.docs || []
    return docs.filter(
      (log: any) =>
        log.isBillable &&
        log.isInvoiced &&
        log.date >= startOfMonth.toISOString() &&
        log.date <= endOfMonth.toISOString(),
    )
  }, [logsRes, startOfMonth, endOfMonth])

  const activeTickets = counts.active
  const pendingApproval = counts.needsReview
  const readyToTest = counts.readyToTest
  const uninvoicedHours = useMemo(() => {
    const docs = (logsRes as any)?.docs || []
    const filtered = docs.filter((log: any) => log.isBillable && !log.isInvoiced)
    return filtered.reduce((sum: number, log: any) => sum + (Number(log.hours) || 0), 0)
  }, [logsRes])
  const monthlyRevenue = Array.isArray(monthlyRevenueLogs)
    ? monthlyRevenueLogs.reduce((sum: number, log: any) => sum + (Number(log.totalAmount) || 0), 0)
    : 0

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-start gap-10 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage tickets, time logs, and invoices</p>
        </div>

        <div className="flex gap-3">
          {/* Pending Approval KPI */}
          <div className="group relative flex flex-col items-center justify-center px-6 py-3 rounded-lg border bg-card transition-all hover:shadow-md hover:scale-105 ">
            <div className="text-sm font-medium text-muted-foreground mb-1">Pending Approval</div>
            <div className="text-2xl font-bold">{pendingApproval}</div>
          </div>

          {/* Uninvoiced Hours KPI */}
          <div className="group relative flex flex-col items-center justify-center px-6 py-3 rounded-lg border bg-card transition-all hover:shadow-md hover:scale-105 ">
            <div className="text-sm font-medium text-muted-foreground mb-1">Uninvoiced Hours</div>
            <div className="text-2xl font-bold">{uninvoicedHours}h</div>
          </div>

          {/* Estimates Needed KPI - Clickable with notification */}
          <Link href="/tickets/estimation-queue" className="block">
            <div
              className={`group relative flex flex-col items-center justify-center px-6 py-3 rounded-lg border transition-all hover:shadow-lg hover:scale-105 cursor-pointer ${
                counts.toEstimate > 0
                  ? 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300'
                  : 'bg-card hover:shadow-md'
              }`}
            >
              {counts.toEstimate > 0 && (
                <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-pulse">
                  {counts.toEstimate}
                </div>
              )}
              <div
                className={`text-sm font-medium mb-1 ${counts.toEstimate > 0 ? 'text-red-700' : 'text-muted-foreground'}`}
              >
                Estimates Needed
              </div>
              <div className={`text-2xl font-bold ${counts.toEstimate > 0 ? 'text-red-600' : ''}`}>
                {counts.toEstimate}
              </div>
            </div>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Board</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketKanbanBoard />
        </CardContent>
      </Card>
    </div>
  )
}
