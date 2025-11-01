'use client'

import { Badge } from '@/components/atoms/badge'
import type { TicketPriority } from '@/collections/Tickets'

type Props = {
  value: TicketPriority
  onChange: (value: TicketPriority) => void
}

const optionStyles: Record<
  TicketPriority,
  { dot: string; badge: string; title: string; desc: string; warn?: string }
> = {
  low: {
    dot: 'border-green-600',
    badge: 'bg-green-100 text-green-800',
    title: 'Low Priority - When time allows',
    desc: 'Non-urgent features and improvements',
  },
  medium: {
    dot: 'border-yellow-600',
    badge: 'bg-yellow-100 text-yellow-800',
    title: 'Medium Priority - Normal queue',
    desc: 'Standard features with normal timeline',
  },
  high: {
    dot: 'border-orange-600',
    badge: 'bg-orange-100 text-orange-800',
    title: 'High Priority - Important',
    desc: 'Important features, next available slot',
  },
  absolute: {
    dot: 'border-red-600',
    badge: 'bg-red-100 text-red-800',
    title: '🚨 Absolute Priority - Critical',
    desc: 'Critical issues, interrupts current work',
    warn: 'This will interrupt ongoing development',
  },
}

export default function PrioritySelector({ value, onChange }: Props) {
  return (
    <div className="grid gap-3" role="radiogroup" aria-label="Select priority">
      {(['low', 'medium', 'high', 'absolute'] as TicketPriority[]).map((key) => {
        const s = optionStyles[key]
        const isSelected = value === key
        return (
          <div
            key={key}
            onClick={() => onChange(key)}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChange(key)
              }
            }}
            className={`flex items-start gap-3 rounded-md border-2 p-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isSelected
                ? 'border-gray-800 bg-gray-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div
              className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                isSelected ? 'border-blue-600 bg-blue-600' : s.dot
              }`}
            >
              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{s.title}</span>
                <Badge className={s.badge} variant="secondary">
                  {key.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
              {s.warn ? <p className="text-xs text-red-600">{s.warn}</p> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
