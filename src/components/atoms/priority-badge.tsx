'use client'

import { Badge } from '@/components/atoms/badge'

type TicketPriority = 'low' | 'medium' | 'high' | 'absolute'

type Props = {
  priority: TicketPriority
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const priorityConfig: Record<TicketPriority, { color: string; textColor: string; label: string }> =
  {
    low: {
      color: 'bg-green-100 border-green-200',
      textColor: 'text-green-800',
      label: 'Low',
    },
    medium: {
      color: 'bg-orange-100 border-orange-200',
      textColor: 'text-orange-800',
      label: 'Medium',
    },
    high: {
      color: 'bg-red-100 border-red-200',
      textColor: 'text-red-800',
      label: 'High',
    },
    absolute: {
      color: 'bg-gray-900 border-gray-800',
      textColor: 'text-white',
      label: 'Critical',
    },
  }

const sizeClasses = {
  sm: 'text-xs h-5 px-2',
  md: 'text-sm h-6 px-3',
  lg: 'text-base h-7 px-4',
}

export default function PriorityBadge({ priority, size = 'md', className = '' }: Props) {
  const config = priorityConfig[priority]
  const sizeClass = sizeClasses[size]

  return (
    <Badge
      variant="outline"
      className={`${config.color} ${config.textColor} ${sizeClass} font-medium border ${className}`}
    >
      {config.label}
    </Badge>
  )
}
