import { useState } from 'react'
import { cn } from '@/lib/utils'
import { KanbanCard } from './KanbanCard'
import type { TicketWithRelations, TicketStatus } from '@/types/database'
import { Skeleton } from '@/components/ui/skeleton'

export interface KanbanColumnProps {
  status: TicketStatus
  title: string
  tickets: TicketWithRelations[]
  loading?: boolean
  colorClass?: string
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, status: TicketStatus) => void
  onTicketClick?: (ticket: TicketWithRelations) => void
  onKeyboardMove?: (ticketId: string, direction: 'left' | 'right') => void
}

const statusColors: Record<TicketStatus, string> = {
  open: 'border-t-blue-500',
  in_progress: 'border-t-yellow-500',
  waiting_on_merchant: 'border-t-orange-500',
  resolved: 'border-t-green-500',
  closed: 'border-t-gray-500',
}

export function KanbanColumn({
  status,
  title,
  tickets,
  loading = false,
  colorClass,
  onDragOver,
  onDrop,
  onTicketClick,
  onKeyboardMove,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
    onDragOver?.(e)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isDragOver to false if we're actually leaving the column
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    onDrop?.(e, status)
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg bg-muted/50 border-t-4 transition-colors duration-200',
        // Responsive: full width on mobile, fixed width on desktop
        'w-full md:min-w-[280px] md:max-w-[320px]',
        colorClass || statusColors[status],
        isDragOver && 'bg-primary/10 ring-2 ring-primary ring-inset'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="region"
      aria-label={`${title} column with ${tickets.length} tickets`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b bg-background/50 rounded-t-lg">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="flex items-center justify-center w-6 h-6 text-xs font-medium bg-muted rounded-full">
          {tickets.length}
        </span>
      </div>

      {/* Cards Container */}
      <div
        className={cn(
          'flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)]',
          isDragOver && 'bg-primary/5'
        )}
      >
        {loading ? (
          // Loading skeletons
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-3/4 mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </>
        ) : tickets.length === 0 ? (
          // Empty state with improved visual hierarchy
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">No tickets</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Drag tickets here or change status</p>
          </div>
        ) : (
          // Ticket cards
          tickets.map((ticket) => (
            <KanbanCard
              key={ticket.id}
              ticket={ticket}
              onClick={onTicketClick}
              onKeyboardMove={onKeyboardMove}
            />
          ))
        )}
      </div>
    </div>
  )
}
