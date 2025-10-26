'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

type Props = {
  testingStartDate?: string | Date | null
  testingDeadline?: string | Date | null
}

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null
  return typeof value === 'string' ? new Date(value) : value
}

function getTimeParts(msRemaining: number): { days: number; hours: number } {
  const totalHours = Math.max(0, Math.floor(msRemaining / 3_600_000))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  return { days, hours }
}

function getBarColor(msRemaining: number): string {
  const hours = Math.floor(msRemaining / 3_600_000)
  // Color coding based on time remaining
  if (hours > 72) return 'bg-green-600'
  if (hours > 24) return 'bg-yellow-500'
  if (hours > 6) return 'bg-orange-500'
  return 'bg-red-600'
}

export default function TestingCountdown({ testingStartDate, testingDeadline }: Props) {
  // Tick every minute without setInterval/useEffect
  const { data: now = Date.now() } = useQuery({
    queryKey: ['clock-minute'],
    queryFn: async () => Date.now(),
    refetchInterval: 60_000,
    staleTime: 60_000,
  })
  const start = toDate(testingStartDate)
  const deadline = toDate(testingDeadline)

  const { remainingMs, totalMs, progressPct, barColor, days, hours } = useMemo(() => {
    const startMs = start ? start.getTime() : now
    const endMs = deadline ? deadline.getTime() : now
    const total = Math.max(1, endMs - startMs)
    const remaining = Math.max(0, endMs - now)
    const pct = Math.min(100, Math.max(0, ((total - remaining) / total) * 100))
    const color = getBarColor(remaining)
    const parts = getTimeParts(remaining)
    return {
      remainingMs: remaining,
      totalMs: total,
      progressPct: pct,
      barColor: color,
      days: parts.days,
      hours: parts.hours,
    }
  }, [start, deadline, now])

  const containerColor = useMemo(() => {
    const hoursRemaining = Math.floor(remainingMs / 3_600_000)
    if (hoursRemaining > 72) return 'bg-green-50 border-green-200'
    if (hoursRemaining > 24) return 'bg-yellow-50 border-yellow-200'
    if (hoursRemaining > 6) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }, [remainingMs])

  return (
    <div className={cn('testing-countdown rounded-lg p-4 border', containerColor)}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-blue-900">Testing Period</h4>
          {start ? (
            <p className="text-sm text-blue-700">Started: {start.toLocaleString()}</p>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {days}d {hours}h
          </div>
          <p className="text-xs text-blue-600">remaining</p>
        </div>
      </div>
      <div className="mt-2">
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className={cn('h-2 rounded-full transition-all duration-300', barColor)}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
