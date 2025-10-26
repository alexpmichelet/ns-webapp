'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Button } from '@/components/atoms/button'
import Link from 'next/link'
import { TicketKanbanBoard } from '@/components/molecules/TicketKanbanBoard'

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ toEstimate: 0, needsReview: 0, active: 0 })
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/tickets?status=active&limit=1000', { cache: 'no-store' })
        const json = await res.json()
        const docs = Array.isArray(json.tickets) ? json.tickets : []
        if (mounted) {
          setCounts({
            toEstimate: docs.filter((d: any) => d.status === 'to_estimate').length,
            needsReview: docs.filter((d: any) => d.status === 'needs_client_review').length,
            active: docs.filter((d: any) => d.status !== 'paid_closed').length,
          })
        }
      } catch {}
    }
    load()
    const id = setInterval(load, 60_000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  // Uninvoiced hours (sum of hours where isBillable && !isInvoiced)
  const [uninvoicedLogs, setUninvoicedLogs] = useState<any[]>([])
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/time-logs?limit=1000', { cache: 'no-store' })
        const json = await res.json()
        if (mounted) setUninvoicedLogs(Array.isArray(json.timeLogs) ? json.timeLogs : [])
      } catch {}
    }
    load()
    const id = setInterval(load, 60_000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  // Monthly revenue (sum of totalAmount for this month where isBillable && isInvoiced)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const endOfMonth = new Date(startOfMonth)
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)
  endOfMonth.setMilliseconds(-1)

  const [monthlyRevenueLogs, setMonthlyRevenueLogs] = useState<any[]>([])
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/time-logs?limit=1000', { cache: 'no-store' })
        const json = await res.json()
        if (!Array.isArray(json.timeLogs)) return
        const filtered = json.timeLogs.filter(
          (log: any) =>
            log.isBillable &&
            log.isInvoiced &&
            log.date >= startOfMonth.toISOString() &&
            log.date <= endOfMonth.toISOString(),
        )
        if (mounted) setMonthlyRevenueLogs(filtered)
      } catch {}
    }
    load()
    const id = setInterval(load, 60_000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const activeTickets = counts.active
  const pendingApproval = counts.needsReview
  const uninvoicedHours = Array.isArray(uninvoicedLogs)
    ? uninvoicedLogs.reduce((sum: number, log: any) => sum + (Number(log.hours) || 0), 0)
    : 0
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
