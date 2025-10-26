'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Button } from '@/components/atoms/button'
import Link from 'next/link'
import { TicketKanbanBoard } from '@/components/molecules/TicketKanbanBoard'
import { payloadHook } from '@/lib/data/payload'

export default function AdminDashboard() {
  const { data: toEstimateCount } = payloadHook.count(
    {
      collection: 'payload-tickets',
      where: { status: { equals: 'to_estimate' } },
    } as any,
    {
      refetchInterval: 60_000,
    },
  )

  const { data: needsClientReviewCount } = payloadHook.count(
    {
      collection: 'payload-tickets',
      where: { status: { equals: 'needs_client_review' } },
    },
    {
      refetchInterval: 60_000,
    },
  )

  const { data: activeTicketsCount } = payloadHook.count(
    {
      collection: 'payload-tickets',
      where: { status: { not_equals: 'paid_closed' } },
    } as any,
    { refetchInterval: 60_000 },
  )

  // Uninvoiced hours (sum of hours where isBillable && !isInvoiced)
  const { data: uninvoicedLogs } = payloadHook.find(
    {
      collection: 'payload-time-logs',
      where: { isBillable: { equals: true }, isInvoiced: { equals: false } },
      limit: 1000,
      sort: '-date',
    } as any,
    { refetchInterval: 60_000 },
  )

  // Monthly revenue (sum of totalAmount for this month where isBillable && isInvoiced)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const endOfMonth = new Date(startOfMonth)
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)
  endOfMonth.setMilliseconds(-1)

  const { data: monthlyRevenueLogs } = payloadHook.find(
    {
      collection: 'payload-time-logs',
      where: {
        isBillable: { equals: true },
        isInvoiced: { equals: true },
        date: {
          greater_than_equal: startOfMonth.toISOString(),
          less_than_equal: endOfMonth.toISOString(),
        },
      },
      limit: 1000,
      sort: '-date',
    } as any,
    { refetchInterval: 60_000 },
  )

  const activeTickets = activeTicketsCount?.totalDocs ?? 0
  const pendingApproval = needsClientReviewCount?.totalDocs ?? 0
  const uninvoicedHours = Array.isArray(uninvoicedLogs?.docs)
    ? uninvoicedLogs?.docs.reduce((sum: number, log: any) => sum + (Number(log.hours) || 0), 0)
    : 0
  const monthlyRevenue = Array.isArray((monthlyRevenueLogs as any)?.docs)
    ? (monthlyRevenueLogs as any).docs.reduce(
        (sum: number, log: any) => sum + (Number(log.totalAmount) || 0),
        0,
      )
    : 0

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage tickets, time logs, and invoices</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTickets}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApproval}</div>
            <p className="text-xs text-muted-foreground">Awaiting client</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uninvoiced Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uninvoicedHours}h</div>
            <p className="text-xs text-muted-foreground">Ready to invoice</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimates Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(toEstimateCount as any)?.totalDocs ?? 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting agency estimate</p>
            <div className="mt-3">
              <Link href="/tickets/estimation-queue">
                <Button size="sm" variant="outline">
                  Open Estimation Queue
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
