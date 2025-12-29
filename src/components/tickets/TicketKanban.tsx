import { useState, useMemo, useCallback, useOptimistic } from 'react'
import { useNavigate } from 'react-router-dom'
import { KanbanColumn } from './KanbanColumn'
import { useTickets, useUpdateTicket } from '@/hooks/useTickets'
import type { TicketWithRelations, TicketStatus, TicketPriority } from '@/types/database'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface TicketKanbanProps {
  /** Filter by priority */
  priority?: TicketPriority
  /** Filter by category */
  category?: string
  /** Filter by assigned user */
  assignedTo?: string
  /** Search filter applied client-side */
  searchQuery?: string
  /** Only show active statuses (excludes resolved/closed) */
  activeOnly?: boolean
}

interface ColumnConfig {
  status: TicketStatus
  title: string
}

const allColumns: ColumnConfig[] = [
  { status: 'open', title: 'Open' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'waiting_on_merchant', title: 'Waiting on Merchant' },
  { status: 'resolved', title: 'Resolved' },
  { status: 'closed', title: 'Closed' },
]

const activeColumns: ColumnConfig[] = [
  { status: 'open', title: 'Open' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'waiting_on_merchant', title: 'Waiting on Merchant' },
]

export function TicketKanban({
  priority,
  category,
  assignedTo,
  searchQuery,
  activeOnly = false,
}: TicketKanbanProps) {
  const navigate = useNavigate()
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null)

  // Fetch all tickets without status filter so we can distribute them
  const { data: tickets, isLoading, error } = useTickets({
    priority,
    category,
    assignedTo,
  })

  const updateTicket = useUpdateTicket()

  // Filter tickets by search query
  const filteredTickets = useMemo(() => {
    if (!tickets) return []
    if (!searchQuery) return tickets

    const query = searchQuery.toLowerCase()
    return tickets.filter(
      (ticket) =>
        ticket.subject?.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query) ||
        ticket.merchant?.name?.toLowerCase().includes(query)
    )
  }, [tickets, searchQuery])

  // Group tickets by status
  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, TicketWithRelations[]> = {
      open: [],
      in_progress: [],
      waiting_on_merchant: [],
      resolved: [],
      closed: [],
    }

    for (const ticket of filteredTickets) {
      const status = ticket.status || 'open'
      if (grouped[status]) {
        grouped[status].push(ticket)
      }
    }

    return grouped
  }, [filteredTickets])

  // Handle drag start
  const handleDragStart = useCallback((ticketId: string) => {
    setDraggingTicketId(ticketId)
  }, [])

  // Handle drop
  const handleDrop = useCallback(
    async (e: React.DragEvent, newStatus: TicketStatus) => {
      e.preventDefault()
      const ticketId = e.dataTransfer.getData('text/plain')

      if (!ticketId) return

      const ticket = filteredTickets.find((t) => t.id === ticketId)
      if (!ticket || ticket.status === newStatus) {
        setDraggingTicketId(null)
        return
      }

      try {
        await updateTicket.mutateAsync({
          id: ticketId,
          updates: { status: newStatus },
        })
      } catch (err) {
        console.error('Failed to update ticket status:', err)
      } finally {
        setDraggingTicketId(null)
      }
    },
    [filteredTickets, updateTicket]
  )

  // Handle ticket click - navigate to detail page
  const handleTicketClick = useCallback(
    (ticket: TicketWithRelations) => {
      navigate(`/tickets/${ticket.id}`)
    },
    [navigate]
  )

  // Determine which columns to show
  const columns = activeOnly ? activeColumns : allColumns

  // Handle keyboard navigation for accessibility
  const handleKeyboardMove = useCallback(
    async (ticketId: string, direction: 'left' | 'right') => {
      const ticket = filteredTickets.find((t) => t.id === ticketId)
      if (!ticket) return

      const statuses: TicketStatus[] = ['open', 'in_progress', 'waiting_on_merchant', 'resolved', 'closed']
      const currentIndex = statuses.indexOf(ticket.status || 'open')
      const newIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1

      if (newIndex >= 0 && newIndex < statuses.length) {
        try {
          await updateTicket.mutateAsync({
            id: ticketId,
            updates: { status: statuses[newIndex] },
          })
        } catch (err) {
          console.error('Failed to update ticket status:', err)
        }
      }
    },
    [filteredTickets, updateTicket]
  )

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        <p>Error loading tickets: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Updating indicator */}
      {updateTicket.isPending && (
        <div className="absolute top-0 left-0 right-0 bg-primary/10 text-primary text-sm py-1 px-3 rounded-t-lg text-center z-10">
          Updating ticket...
        </div>
      )}

      {/* Kanban Board - responsive: vertical on mobile, horizontal on desktop */}
      <div
        className={cn(
          'flex gap-4 pb-4 pt-2',
          'flex-col md:flex-row md:overflow-x-auto'
        )}
        role="region"
        aria-label="Ticket Kanban Board. Use arrow keys on focused cards to change status."
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            tickets={ticketsByStatus[column.status] || []}
            loading={isLoading}
            onDrop={handleDrop}
            onTicketClick={handleTicketClick}
            onKeyboardMove={handleKeyboardMove}
          />
        ))}
      </div>

      {/* Total count */}
      {!isLoading && (
        <div className="text-sm text-muted-foreground mt-2">
          {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} total
          {searchQuery && ` (filtered)`}
        </div>
      )}
    </div>
  )
}
