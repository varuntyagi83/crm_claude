import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TicketsPage } from './TicketsPage'
import * as useTicketsModule from '@/hooks/useTickets'
import * as useAuthModule from '@/hooks/useAuth'

vi.mock('@/hooks/useTickets', () => ({
  useTickets: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/components/tickets/TicketForm', () => ({
  TicketForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="ticket-form">
      <button onClick={onClose}>Close Form</button>
    </div>
  ),
}))

vi.mock('@/components/tickets/TicketKanban', () => ({
  TicketKanban: () => <div data-testid="ticket-kanban">Kanban Board</div>,
}))

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

const mockTickets = [
  {
    id: 't1',
    subject: 'Payment Issue',
    description: 'Cannot process payments',
    status: 'open',
    priority: 'high',
    category: 'technical',
    merchant_id: 'm1',
    assigned_to: 'u1',
    created_at: '2024-01-15T10:00:00Z',
    merchant: { business_name: 'Test Merchant' },
    assigned_user: { full_name: 'Support User' },
  },
  {
    id: 't2',
    subject: 'Billing Question',
    description: 'Need invoice',
    status: 'in_progress',
    priority: 'medium',
    category: 'billing',
    merchant_id: 'm2',
    assigned_to: null,
    created_at: '2024-01-14T10:00:00Z',
    merchant: { business_name: 'Another Merchant' },
    assigned_user: null,
  },
]

describe('TicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTicketsModule.useTickets).mockReturnValue({
      data: mockTickets,
      isLoading: false,
    } as any)
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'support@example.com' },
      profile: { id: 'u1', email: 'support@example.com', full_name: 'Support User', role: 'support' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)
  })

  it('should render page header', () => {
    renderWithProviders(<TicketsPage />)

    expect(screen.getByText('Support Tickets')).toBeInTheDocument()
    expect(screen.getByText('Manage customer support requests')).toBeInTheDocument()
  })

  it('should render Create Ticket button for support role', () => {
    renderWithProviders(<TicketsPage />)

    expect(screen.getByText('Create Ticket')).toBeInTheDocument()
  })

  it('should render search input', () => {
    renderWithProviders(<TicketsPage />)

    expect(screen.getByPlaceholderText('Search tickets...')).toBeInTheDocument()
  })

  it('should render filter dropdowns', () => {
    renderWithProviders(<TicketsPage />)

    expect(screen.getByDisplayValue('All Priorities')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument()
  })

  it('should render My Tickets Only checkbox', () => {
    renderWithProviders(<TicketsPage />)

    expect(screen.getByText('My Tickets Only')).toBeInTheDocument()
  })

  it('should render view toggle buttons', () => {
    renderWithProviders(<TicketsPage />)

    expect(screen.getByLabelText('List view')).toBeInTheDocument()
    expect(screen.getByLabelText('Kanban view')).toBeInTheDocument()
  })

  it('should show kanban view by default', () => {
    renderWithProviders(<TicketsPage />)

    expect(screen.getByTestId('ticket-kanban')).toBeInTheDocument()
  })

  it('should switch to list view when clicking list button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketsPage />)

    await user.click(screen.getByLabelText('List view'))

    // Kanban should be hidden, table should show
    expect(screen.queryByTestId('ticket-kanban')).not.toBeInTheDocument()
    expect(screen.getByText('Payment Issue')).toBeInTheDocument()
  })

  it('should render tickets in table when in list view', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketsPage />)

    await user.click(screen.getByLabelText('List view'))

    expect(screen.getByText('Payment Issue')).toBeInTheDocument()
    expect(screen.getByText('Billing Question')).toBeInTheDocument()
    expect(screen.getByText('Test Merchant')).toBeInTheDocument()
    expect(screen.getByText('Support User')).toBeInTheDocument()
  })

  it('should filter tickets by search in list view', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketsPage />)

    await user.click(screen.getByLabelText('List view'))

    const searchInput = screen.getByPlaceholderText('Search tickets...')
    await user.type(searchInput, 'Payment')

    expect(screen.getByText('Payment Issue')).toBeInTheDocument()
    expect(screen.queryByText('Billing Question')).not.toBeInTheDocument()
  })

  it('should show status filter only in list view', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketsPage />)

    // In kanban view, status filter should be hidden
    expect(screen.queryByDisplayValue('All Statuses')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('List view'))

    // In list view, status filter should show
    expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument()
  })

  it('should filter by my tickets only', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketsPage />)

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    // useTickets should be called with assignedTo parameter
    expect(useTicketsModule.useTickets).toHaveBeenCalledWith(
      expect.objectContaining({
        assignedTo: 'u1',
      })
    )
  })

  it('should show loading state', async () => {
    vi.mocked(useTicketsModule.useTickets).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    const user = userEvent.setup()
    renderWithProviders(<TicketsPage />)

    await user.click(screen.getByLabelText('List view'))

    // DataTable should show loading state
    expect(screen.queryByText('Payment Issue')).not.toBeInTheDocument()
  })

  it('should show empty state when no tickets in list view', async () => {
    vi.mocked(useTicketsModule.useTickets).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    const user = userEvent.setup()
    renderWithProviders(<TicketsPage />)

    await user.click(screen.getByLabelText('List view'))

    expect(screen.getByText('No tickets found')).toBeInTheDocument()
  })

  it('should open ticket form when clicking Create Ticket', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketsPage />)

    await user.click(screen.getByText('Create Ticket'))

    expect(screen.getByTestId('ticket-form')).toBeInTheDocument()
  })

  it('should close ticket form when form calls onClose', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketsPage />)

    await user.click(screen.getByText('Create Ticket'))
    expect(screen.getByTestId('ticket-form')).toBeInTheDocument()

    await user.click(screen.getByText('Close Form'))
    expect(screen.queryByTestId('ticket-form')).not.toBeInTheDocument()
  })

  it('should not show Create Ticket button for non-support roles', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'sales@example.com' },
      profile: { id: 'u1', email: 'sales@example.com', full_name: 'Sales User', role: 'sales' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => false,
    } as any)

    renderWithProviders(<TicketsPage />)

    // RoleGate should hide the button for sales role
    // Note: RoleGate checks isRole which returns false
    expect(screen.queryByText('Create Ticket')).not.toBeInTheDocument()
  })
})
