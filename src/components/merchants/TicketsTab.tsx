import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { RoleGate } from '@/components/shared/RoleGate'
import { useMerchantTickets } from '@/hooks/useTickets'
import { formatRelativeTime } from '@/lib/utils'
import { Plus, Ticket } from 'lucide-react'

interface TicketsTabProps {
  merchantId: string
}

export function TicketsTab({ merchantId }: TicketsTabProps) {
  const { data: tickets, isLoading } = useMerchantTickets(merchantId)

  if (isLoading) {
    return (
      <div className="mt-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Support Tickets</h3>
        <RoleGate allowed={['support', 'ops', 'admin']}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        </RoleGate>
      </div>

      {tickets?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tickets yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets?.map((ticket) => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.id}`}
              className="block"
            >
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          Assigned: {ticket.assigned_user?.full_name || 'Unassigned'}
                        </span>
                        <span>
                          {formatRelativeTime(ticket.created_at!)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={ticket.status || 'open'} />
                      <PriorityBadge priority={ticket.priority || 'medium'} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
