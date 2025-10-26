'use client'

import { Badge } from '@/components/atoms/badge'
import { RadioGroup, RadioGroupItem } from '@/components/atoms/radio-group'
import { Label } from '@/components/atoms/label'
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
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as TicketPriority)}
      className="grid gap-3"
    >
      {(['low', 'medium', 'high', 'absolute'] as TicketPriority[]).map((key) => {
        const s = optionStyles[key]
        return (
          <div key={key} className={`flex items-start gap-3 rounded-md border p-3`}>
            <RadioGroupItem value={key} id={`priority-${key}`} className={`mt-1 ${s.dot}`} />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor={`priority-${key}`} className="font-medium">
                  {s.title}
                </Label>
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
    </RadioGroup>
  )
}

