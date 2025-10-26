'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth/client'
import { payloadHook } from '@/lib/data/payload'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/atoms/alert'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import TestingCountdown from '@/components/molecules/tickets/TestingCountdown'
import type { PayloadProject, PayloadTicket } from '@/payload-types'
import FeatureTestingModal from '@/components/molecules/tickets/FeatureTestingModal'

function getProjectName(project: string | PayloadProject | null | undefined): string {
  if (!project) return '—'
  if (typeof project === 'string') return project
  try {
    return project.name || project.id || '—'
  } catch {
    return '—'
  }
}

const priorityOrder: Record<string, number> = { absolute: 0, high: 1, medium: 2, low: 3 }

export default function TestingDashboardPage() {
  const session = authClient.useSession()
  const user = session?.data?.user as { id: string } | undefined

  const { data: res, isLoading } = payloadHook.find(
    {
      collection: 'payload-tickets',
      where: {
        status: { equals: 'ready_to_test' },
      },
      limit: 200,
      sort: '-createdAt',
    } as any,
    { enabled: !!user?.id, refetchInterval: 60_000 },
  )

  const tickets: PayloadTicket[] = useMemo(() => {
    const docs = (res as any)?.docs ?? []
    return [...docs].sort((a: any, b: any) => {
      const aDeadline = new Date(
        a.testingDeadline || a.autoApprovalDate || a.updatedAt || a.createdAt,
      ).getTime()
      const bDeadline = new Date(
        b.testingDeadline || b.autoApprovalDate || b.updatedAt || b.createdAt,
      ).getTime()
      if (aDeadline !== bDeadline) return aDeadline - bDeadline
      const pa = priorityOrder[a.priority] ?? 99
      const pb = priorityOrder[b.priority] ?? 99
      if (pa !== pb) return pa - pb
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [res])

  const [active, setActive] = useState<PayloadTicket | null>(null)
  const [open, setOpen] = useState(false)

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Testing Dashboard</h1>
        <p className="text-muted-foreground">Features ready for your testing and approval</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">No Features Awaiting Testing</AlertTitle>
          <AlertDescription className="text-blue-700">
            Everything looks good. New features will appear here when ready to test.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => {
            const projectName = getProjectName(t.project)
            const timeRemainingMs = Math.max(
              0,
              new Date(
                (t.testingDeadline as any) || (t.autoApprovalDate as any) || t.updatedAt,
              ).getTime() - Date.now(),
            )
            const hoursRemaining = Math.floor(timeRemainingMs / 3_600_000)
            const showAutoWarn = hoursRemaining <= 24
            return (
              <Card key={t.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate" title={t.title}>
                        {t.ticketNumber} • {t.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{projectName}</Badge>
                        <Badge variant="secondary">
                          {t.actualHours || 0}h / {t.estimatedHours}h
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">Priority</div>
                      <div className="text-sm font-medium">{t.priority}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <TestingCountdown
                    testingStartDate={t.testingStartDate as any}
                    testingDeadline={(t.testingDeadline as any) || (t.autoApprovalDate as any)}
                  />

                  <div className="testing-status">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500 w-3 h-3 rounded-full" />
                      <span className="text-sm font-medium">Ready for Testing</span>
                    </div>
                    <div className="ml-5 mt-1">
                      <p className="text-xs text-muted-foreground">
                        Deployed{' '}
                        {t.testingStartDate
                          ? new Date(t.testingStartDate as any).toLocaleString()
                          : '—'}{' '}
                        • {hoursRemaining}h to review
                      </p>
                    </div>
                  </div>

                  {showAutoWarn ? (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Auto-Approval Warning</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        This feature will be automatically approved in{' '}
                        <strong>{hoursRemaining}h</strong> if no action is taken.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/tickets/${t.id}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      View details
                    </Link>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActive(t)
                          setOpen(true)
                        }}
                      >
                        Test Feature
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setActive(t)
                          setOpen(true)
                        }}
                      >
                        Quick Actions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <FeatureTestingModal ticket={active} open={open} onOpenChange={setOpen} />
    </div>
  )
}
