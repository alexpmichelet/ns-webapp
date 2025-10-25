'use client'

import { useEffect, useMemo, useState } from 'react'
import { authClient } from '@/lib/auth/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { Button } from '@/components/atoms/button'
import Link from 'next/link'

export default function ClientDashboard() {
  const session = authClient.useSession()
  const user = session?.data?.user as { id: string; name: string; role: string } | undefined

  const [tickets, setTickets] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    if (!user?.id) return
    const fetchData = async () => {
      try {
        const [ticketsRes, invoicesRes] = await Promise.all([
          fetch(`/api/tickets?clientId=${user.id}&limit=100`, { cache: 'no-store' }),
          fetch(`/api/invoices?clientId=${user.id}&limit=100`, { cache: 'no-store' }),
        ])
        const ticketsJson = await ticketsRes.json()
        const invoicesJson = await invoicesRes.json()
        setTickets(Array.isArray(ticketsJson.tickets) ? ticketsJson.tickets : [])
        setInvoices(Array.isArray(invoicesJson.invoices) ? invoicesJson.invoices : [])
      } catch (e) {
        setTickets([])
        setInvoices([])
      }
    }
    fetchData()
  }, [user?.id])

  const { activeTickets, completedTickets, pendingInvoices, totalOwed } = useMemo(() => {
    const active = tickets.filter((t: any) => !['paid', 'cancelled'].includes(t.status)).length
    const completed = tickets.filter((t: any) => t.status === 'paid').length
    const pending = invoices.filter((i: any) => ['pending', 'overdue'].includes(i.status)).length
    const owed = invoices
      .filter((i: any) => ['pending', 'overdue'].includes(i.status))
      .reduce((sum: number, i: any) => sum + (Number(i.totalAmount) || 0), 0)
    return {
      activeTickets: active,
      completedTickets: completed,
      pendingInvoices: pending,
      totalOwed: owed,
    }
  }, [tickets, invoices])

  if (!user) return null

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your projects and invoices
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTickets}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTickets}</div>
            <p className="text-xs text-muted-foreground">Tickets completed and paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOwed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Unpaid balance</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link href="/tickets/new">
            <Button>Submit New Ticket</Button>
          </Link>
          <Link href="/tickets">
            <Button variant="outline">View All Tickets</Button>
          </Link>
          <Link href="/invoices">
            <Button variant="outline">View Invoices</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Your latest invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground">No invoices yet</p>
          ) : (
            <div className="space-y-4">
              {invoices.slice(0, 5).map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      ${invoice.totalAmount.toFixed(2)} • Due:{' '}
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        invoice.status === 'paid'
                          ? 'text-green-600'
                          : invoice.status === 'overdue'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                      }`}
                    >
                      {invoice.status}
                    </span>
                    <Link href={`/invoices/${invoice.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
