import { Card } from '@/components/ui/card'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { TicketWithRelations } from '@/types/database'
import { User, Building2, GripVertical, MessageSquare } from 'lucide-react'

export interface KanbanCardProps {
  ticket: TicketWithRelations
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, ticketId: string) => void
  onClick?: (ticket: TicketWithRelations) => void
  onKeyboardMove?: (ticketId: string, direction: 'left' | 'right') => void
}

export function KanbanCard({
  ticket,
  isDragging = false,
  onDragStart,
  onClick,
  onKeyboardMove,
}: KanbanCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', ticket.id)
    onDragStart?.(e, ticket.id)
  }

  const handleClick = () => {
    onClick?.(ticket)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(ticket)
    }
    // Arrow keys for moving between columns (accessibility)
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onKeyboardMove?.(ticket.id, 'left')
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      onKeyboardMove?.(ticket.id, 'right')
    }
  }

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Ticket: ${ticket.subject}. Press Enter to view details, arrow keys to change status.`}
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing transition-all duration-200',
        'hover:shadow-md hover:border-primary/50',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isDragging && 'opacity-50 rotate-2 scale-105 shadow-lg'
      )}
    >
      {/* Drag handle and priority */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <PriorityBadge priority={ticket.priority || 'medium'} />
        </div>
        {ticket.category && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {ticket.category}
          </span>
        )}
      </div>

      {/* Subject */}
      <h4 className="font-medium text-sm line-clamp-2 mb-2">
        {ticket.subject}
      </h4>

      {/* Description preview */}
      {ticket.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {ticket.description}
        </p>
      )}

      {/* Footer: Merchant, Assignee, Time */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {/* Merchant */}
          {ticket.merchant && (
            <div className="flex items-center gap-1" title={ticket.merchant.name}>
              <Building2 className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{ticket.merchant.name}</span>
            </div>
          )}

          {/* Assignee */}
          <div className="flex items-center gap-1" title={ticket.assigned_user?.full_name || 'Unassigned'}>
            <User className="h-3 w-3" />
            <span className="truncate max-w-[60px]">
              {ticket.assigned_user?.full_name?.split(' ')[0] || 'Unassigned'}
            </span>
          </div>
        </div>

        {/* Created time */}
        <span title={ticket.created_at || ''}>
          {formatRelativeTime(ticket.created_at!)}
        </span>
      </div>
    </Card>
  )
}
