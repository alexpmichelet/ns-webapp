'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/atoms/badge'

type Props = {
  createdAt: string | Date
}

function addBusinessDays(start: Date, businessDays: number): Date {
  let daysAdded = 0
  const result = new Date(start)
  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) {
      daysAdded += 1
    }
  }
  return result
}

function getTimeParts(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return { hours, minutes }
}

export default function SlaCountdown({ createdAt }: Props) {
  const created = useMemo(
    () => (typeof createdAt === 'string' ? new Date(createdAt) : createdAt),
    [createdAt],
  )
  const deadline = useMemo(() => addBusinessDays(created, 1), [created])
  const [now, setNow] = useState<number>(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const remainingMs = deadline.getTime() - now
  const overdue = remainingMs <= 0
  const { hours, minutes } = getTimeParts(remainingMs)

  // Colors:
  // - Green: > 6h
  // - Yellow: 2h - 6h
  // - Red: < 2h or overdue
  let color = 'bg-green-100 text-green-800'
  if (overdue || hours < 2) color = 'bg-red-100 text-red-800'
  else if (hours < 6) color = 'bg-yellow-100 text-yellow-800'

  return (
    <div className="flex items-center gap-2">
      <Badge className={color} variant="outline">
        {overdue ? 'OVERDUE' : `${hours}h ${minutes}m`}
      </Badge>
    </div>
  )
}
