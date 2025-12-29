import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TicketStatus } from '@/types/database'

type MerchantStatus = 'active' | 'inactive' | 'suspended' | 'onboarding'

interface StatusBadgeProps {
  status: MerchantStatus | TicketStatus
  className?: string
}

const merchantStatusConfig: Record<
  MerchantStatus,
  { label: string; className: string }
> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  suspended: { label: 'Suspended', className: 'bg-red-100 text-red-800 border-red-200' },
  onboarding: { label: 'Onboarding', className: 'bg-blue-100 text-blue-800 border-blue-200' },
}

const ticketStatusConfig: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  open: { label: 'Open', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  waiting_on_merchant: { label: 'Waiting', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-800 border-green-200' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-800 border-gray-200' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config =
    merchantStatusConfig[status as MerchantStatus] ||
    ticketStatusConfig[status as TicketStatus]

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
