import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanbanColumn } from './KanbanColumn'
import type { TicketWithRelations } from '@/types/database'

describe('KanbanColumn', () => {
  const mockTickets: TicketWithRelations[] = [
    {
      id: 'ticket-1',
      merchant_id: 'merchant-1',
      subject: 'First Ticket',
      description: 'Description 1',
      status: 'open',
      priority: 'high',
      category: 'technical',
      assigned_to: 'user-1',
      created_by: 'user-2',
      resolved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'ticket-2',
      merchant_id: 'merchant-2',
      subject: 'Second Ticket',
      description: 'Description 2',
      status: 'open',
      priority: 'medium',
      category: 'billing',
      assigned_to: null,
      created_by: 'user-2',
      resolved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render column title', () => {
    render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={mockTickets}
      />
    )

    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('should render ticket count', () => {
    render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={mockTickets}
      />
    )

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should render all tickets', () => {
    render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={mockTickets}
      />
    )

    expect(screen.getByText('First Ticket')).toBeInTheDocument()
    expect(screen.getByText('Second Ticket')).toBeInTheDocument()
  })

  it('should show empty state when no tickets', () => {
    render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={[]}
      />
    )

    expect(screen.getByText('No tickets')).toBeInTheDocument()
    expect(screen.getByText('Drag tickets here or change status')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={[]}
        loading
      />
    )

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should not show tickets when loading', () => {
    render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={mockTickets}
        loading
      />
    )

    expect(screen.queryByText('First Ticket')).not.toBeInTheDocument()
    expect(screen.queryByText('Second Ticket')).not.toBeInTheDocument()
  })

  it('should apply correct color class for open status', () => {
    const { container } = render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={[]}
      />
    )

    expect(container.firstChild).toHaveClass('border-t-blue-500')
  })

  it('should apply correct color class for in_progress status', () => {
    const { container } = render(
      <KanbanColumn
        status="in_progress"
        title="In Progress"
        tickets={[]}
      />
    )

    expect(container.firstChild).toHaveClass('border-t-yellow-500')
  })

  it('should apply correct color class for resolved status', () => {
    const { container } = render(
      <KanbanColumn
        status="resolved"
        title="Resolved"
        tickets={[]}
      />
    )

    expect(container.firstChild).toHaveClass('border-t-green-500')
  })

  it('should apply custom color class when provided', () => {
    const { container } = render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={[]}
        colorClass="border-t-purple-500"
      />
    )

    expect(container.firstChild).toHaveClass('border-t-purple-500')
  })

  it('should call onDrop when item is dropped', () => {
    const handleDrop = vi.fn()

    const { container } = render(
      <KanbanColumn
        status="in_progress"
        title="In Progress"
        tickets={[]}
        onDrop={handleDrop}
      />
    )

    const column = container.firstChild as HTMLElement
    const mockDataTransfer = {
      getData: vi.fn().mockReturnValue('ticket-1'),
    }
    fireEvent.drop(column, { dataTransfer: mockDataTransfer })

    expect(handleDrop).toHaveBeenCalledWith(expect.anything(), 'in_progress')
  })

  it('should call onDragOver during drag over', () => {
    const handleDragOver = vi.fn()

    const { container } = render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={[]}
        onDragOver={handleDragOver}
      />
    )

    const column = container.firstChild as HTMLElement
    const mockDataTransfer = {
      dropEffect: '',
    }
    fireEvent.dragOver(column, { dataTransfer: mockDataTransfer })

    expect(handleDragOver).toHaveBeenCalled()
  })

  it('should call onTicketClick when ticket is clicked', () => {
    const handleTicketClick = vi.fn()

    render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={mockTickets}
        onTicketClick={handleTicketClick}
      />
    )

    fireEvent.click(screen.getByText('First Ticket'))
    expect(handleTicketClick).toHaveBeenCalledWith(mockTickets[0])
  })

  it('should have accessible region role', () => {
    render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={mockTickets}
      />
    )

    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  it('should have accessible label with ticket count', () => {
    render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={mockTickets}
      />
    )

    const region = screen.getByRole('region')
    expect(region).toHaveAttribute('aria-label', 'Open column with 2 tickets')
  })

  it('should pass onKeyboardMove to KanbanCard', () => {
    const handleKeyboardMove = vi.fn()

    render(
      <KanbanColumn
        status="open"
        title="Open"
        tickets={mockTickets}
        onKeyboardMove={handleKeyboardMove}
      />
    )

    const card = screen.getByText('First Ticket').closest('[role="button"]')
    fireEvent.keyDown(card!, { key: 'ArrowRight' })

    expect(handleKeyboardMove).toHaveBeenCalledWith('ticket-1', 'right')
  })
})
