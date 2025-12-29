import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanbanCard } from './KanbanCard'
import type { TicketWithRelations } from '@/types/database'

describe('KanbanCard', () => {
  const mockTicket: TicketWithRelations = {
    id: 'ticket-1',
    merchant_id: 'merchant-1',
    subject: 'Test Ticket Subject',
    description: 'This is a test description',
    status: 'open',
    priority: 'high',
    category: 'technical',
    assigned_to: 'user-1',
    created_by: 'user-2',
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    merchant: {
      id: 'merchant-1',
      name: 'Test Merchant',
      legal_name: 'Test Merchant LLC',
      status: 'active',
      mcc_code: null,
      metadata: null,
      assigned_sales_rep: null,
      assigned_support_rep: null,
      onboarded_at: null,
      created_at: null,
      updated_at: null,
    },
    assigned_user: {
      id: 'user-1',
      email: 'assignee@test.com',
      full_name: 'John Doe',
      role: 'support',
      created_at: null,
      updated_at: null,
    },
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render ticket subject', () => {
    render(<KanbanCard ticket={mockTicket} />)
    expect(screen.getByText('Test Ticket Subject')).toBeInTheDocument()
  })

  it('should render ticket description', () => {
    render(<KanbanCard ticket={mockTicket} />)
    expect(screen.getByText('This is a test description')).toBeInTheDocument()
  })

  it('should render priority badge', () => {
    render(<KanbanCard ticket={mockTicket} />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('should render category when provided', () => {
    render(<KanbanCard ticket={mockTicket} />)
    expect(screen.getByText('technical')).toBeInTheDocument()
  })

  it('should not render category when not provided', () => {
    const ticketWithoutCategory = { ...mockTicket, category: null }
    render(<KanbanCard ticket={ticketWithoutCategory} />)
    expect(screen.queryByText('technical')).not.toBeInTheDocument()
  })

  it('should render merchant name', () => {
    render(<KanbanCard ticket={mockTicket} />)
    expect(screen.getByText('Test Merchant')).toBeInTheDocument()
  })

  it('should render assignee first name', () => {
    render(<KanbanCard ticket={mockTicket} />)
    expect(screen.getByText('John')).toBeInTheDocument()
  })

  it('should show "Unassigned" when no assignee', () => {
    const ticketWithoutAssignee = { ...mockTicket, assigned_user: undefined }
    render(<KanbanCard ticket={ticketWithoutAssignee} />)
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('should be draggable', () => {
    const { container } = render(<KanbanCard ticket={mockTicket} />)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveAttribute('draggable', 'true')
  })

  it('should call onDragStart when drag starts', () => {
    const handleDragStart = vi.fn()
    const { container } = render(
      <KanbanCard ticket={mockTicket} onDragStart={handleDragStart} />
    )

    const card = container.firstChild as HTMLElement
    const mockDataTransfer = {
      effectAllowed: '',
      setData: vi.fn(),
    }
    fireEvent.dragStart(card, { dataTransfer: mockDataTransfer })

    expect(handleDragStart).toHaveBeenCalled()
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()

    render(<KanbanCard ticket={mockTicket} onClick={handleClick} />)

    const card = screen.getByRole('button')
    fireEvent.click(card)

    expect(handleClick).toHaveBeenCalledWith(mockTicket)
  })

  it('should call onClick on Enter key press', () => {
    const handleClick = vi.fn()
    render(<KanbanCard ticket={mockTicket} onClick={handleClick} />)

    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(handleClick).toHaveBeenCalledWith(mockTicket)
  })

  it('should call onClick on Space key press', () => {
    const handleClick = vi.fn()
    render(<KanbanCard ticket={mockTicket} onClick={handleClick} />)

    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: ' ' })

    expect(handleClick).toHaveBeenCalledWith(mockTicket)
  })

  it('should call onKeyboardMove with left direction on ArrowLeft', () => {
    const handleKeyboardMove = vi.fn()
    render(<KanbanCard ticket={mockTicket} onKeyboardMove={handleKeyboardMove} />)

    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'ArrowLeft' })

    expect(handleKeyboardMove).toHaveBeenCalledWith(mockTicket.id, 'left')
  })

  it('should call onKeyboardMove with right direction on ArrowRight', () => {
    const handleKeyboardMove = vi.fn()
    render(<KanbanCard ticket={mockTicket} onKeyboardMove={handleKeyboardMove} />)

    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'ArrowRight' })

    expect(handleKeyboardMove).toHaveBeenCalledWith(mockTicket.id, 'right')
  })

  it('should have accessible role and label', () => {
    render(<KanbanCard ticket={mockTicket} />)

    const card = screen.getByRole('button')
    expect(card).toHaveAttribute('aria-label')
    expect(card.getAttribute('aria-label')).toContain('Test Ticket Subject')
  })

  it('should be focusable', () => {
    const { container } = render(<KanbanCard ticket={mockTicket} />)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveAttribute('tabIndex', '0')
  })

  it('should apply isDragging styles', () => {
    const { container } = render(<KanbanCard ticket={mockTicket} isDragging />)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('opacity-50')
  })

  it('should use medium priority as default when priority is null', () => {
    const ticketWithoutPriority = { ...mockTicket, priority: null }
    render(<KanbanCard ticket={ticketWithoutPriority} />)
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })
})
