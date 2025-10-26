'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Button } from '@/components/atoms/button'
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage tickets, time logs, and invoices</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTickets}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApproval}</div>
            <p className="text-xs text-muted-foreground">Awaiting client</p>
          </CardContent>
        </Card>

        {/*  <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready To Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyToTest}</div>
            <p className="text-xs text-muted-foreground">Client testing window</p>
            <div className="mt-3">
              <Link href="/tickets/testing">
                <Button size="sm" variant="outline">
                  Open Testing Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card> */}

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
            <div className="text-2xl font-bold">{counts.toEstimate}</div>
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
