import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TicketPriority } from '@/types/database'

interface PriorityBadgeProps {
  priority: TicketPriority
  className?: string
}

const priorityConfig: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 border-red-200' },
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
