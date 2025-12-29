import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { RoleGate } from '@/components/shared/RoleGate'
import { TicketKanban } from '@/components/tickets/TicketKanban'
import { useTickets } from '@/hooks/useTickets'
import { useAuth } from '@/hooks/useAuth'
import { formatRelativeTime, cn } from '@/lib/utils'
import type { SupportTicket, TicketStatus, TicketPriority } from '@/types/database'
import { Plus, Search, Ticket, LayoutGrid, List } from 'lucide-react'
import { TicketForm } from '@/components/tickets/TicketForm'

type ViewMode = 'list' | 'kanban'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_merchant', label: 'Waiting on Merchant' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'technical', label: 'Technical' },
  { value: 'billing', label: 'Billing' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'general', label: 'General' },
]

export function TicketsPage() {
  const { profile } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [myTicketsOnly, setMyTicketsOnly] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const pageSize = 20

  const { data: tickets, isLoading } = useTickets({
    status: (status || undefined) as any,
    priority: (priority || undefined) as any,
    category: category || undefined,
    assignedTo: myTicketsOnly ? profile?.id : undefined,
    limit: pageSize,
  })

  const filteredTickets = tickets?.filter((ticket) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      ticket.subject?.toLowerCase().includes(searchLower) ||
      ticket.description?.toLowerCase().includes(searchLower)
    )
  })

  const columns: Column<SupportTicket>[] = [
    {
      key: 'subject',
      header: 'Subject',
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{row.subject}</p>
          <p className="text-sm text-muted-foreground truncate">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'merchant',
      header: 'Merchant',
      cell: (row) => (
        <span className="text-sm">{(row as any).merchant?.business_name || 'N/A'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status || 'open'} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      cell: (row) => <PriorityBadge priority={row.priority || 'medium'} />,
    },
    {
      key: 'assigned',
      header: 'Assigned To',
      cell: (row) => (
        <span className="text-sm">
          {(row as any).assigned_user?.full_name || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatRelativeTime(row.created_at!)}
        </span>
      ),
    },
  ]

  return (
    <div className="p-6">
      <PageHeader
        title="Support Tickets"
        subtitle="Manage customer support requests"
        actions={
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center border rounded-lg p-1 bg-muted">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn('px-3', viewMode !== 'list' && 'hover:bg-transparent')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className={cn('px-3', viewMode !== 'kanban' && 'hover:bg-transparent')}
                aria-label="Kanban view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            <RoleGate allowed={['support', 'ops', 'admin']}>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            </RoleGate>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Only show status filter in list view - kanban columns represent status */}
        {viewMode === 'list' && (
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-40"
          />
        )}
        <Select
          options={priorityOptions}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-40"
        />
        <Select
          options={categoryOptions}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-40"
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={myTicketsOnly}
            onCheckedChange={(checked) => setMyTicketsOnly(!!checked)}
          />
          My Tickets Only
        </label>
      </div>

      {/* Content Area - Kanban or List View */}
      {viewMode === 'kanban' ? (
        <TicketKanban
          priority={priority as TicketPriority | undefined}
          category={category || undefined}
          assignedTo={myTicketsOnly ? profile?.id : undefined}
          searchQuery={search}
        />
      ) : (
        <>
          {filteredTickets?.length === 0 && !isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tickets found</p>
              </CardContent>
            </Card>
          ) : (
            <DataTable
              columns={columns}
              data={filteredTickets ?? []}
              loading={isLoading}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => {
                window.location.href = `/tickets/${row.id}`
              }}
              pagination={{
                page,
                pageSize,
                total: filteredTickets?.length ?? 0,
                onPageChange: setPage,
              }}
            />
          )}
        </>
      )}

      {showForm && (
        <TicketForm
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
