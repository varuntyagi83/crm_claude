import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TicketsTab } from './TicketsTab'
import * as useTicketsModule from '@/hooks/useTickets'
import * as useAuthModule from '@/hooks/useAuth'

vi.mock('@/hooks/useTickets', () => ({
  useMerchantTickets: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
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
    created_at: '2024-01-15T10:00:00Z',
    assigned_user: { full_name: 'Support User' },
  },
  {
    id: 't2',
    subject: 'Billing Question',
    description: 'Need clarification on invoice',
    status: 'in_progress',
    priority: 'medium',
    created_at: '2024-01-14T10:00:00Z',
    assigned_user: null,
  },
]

describe('TicketsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('should render section header', () => {
    vi.mocked(useTicketsModule.useMerchantTickets).mockReturnValue({
      data: mockTickets,
      isLoading: false,
    } as any)

    renderWithProviders(<TicketsTab merchantId="m1" />)

    expect(screen.getByText('Support Tickets')).toBeInTheDocument()
  })

  it('should render Create Ticket button for support role', () => {
    vi.mocked(useTicketsModule.useMerchantTickets).mockReturnValue({
      data: mockTickets,
      isLoading: false,
    } as any)

    renderWithProviders(<TicketsTab merchantId="m1" />)

    expect(screen.getByText('Create Ticket')).toBeInTheDocument()
  })

  it('should render tickets', () => {
    vi.mocked(useTicketsModule.useMerchantTickets).mockReturnValue({
      data: mockTickets,
      isLoading: false,
    } as any)

    renderWithProviders(<TicketsTab merchantId="m1" />)

    expect(screen.getByText('Payment Issue')).toBeInTheDocument()
    expect(screen.getByText('Cannot process payments')).toBeInTheDocument()
    expect(screen.getByText('Billing Question')).toBeInTheDocument()
  })

  it('should render assigned user names', () => {
    vi.mocked(useTicketsModule.useMerchantTickets).mockReturnValue({
      data: mockTickets,
      isLoading: false,
    } as any)

    renderWithProviders(<TicketsTab merchantId="m1" />)

    expect(screen.getByText('Assigned: Support User')).toBeInTheDocument()
    expect(screen.getByText('Assigned: Unassigned')).toBeInTheDocument()
  })

  it('should render status badges', () => {
    vi.mocked(useTicketsModule.useMerchantTickets).mockReturnValue({
      data: mockTickets,
      isLoading: false,
    } as any)

    renderWithProviders(<TicketsTab merchantId="m1" />)

    // StatusBadge shows labels like "Open", "In Progress"
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('should render priority badges', () => {
    vi.mocked(useTicketsModule.useMerchantTickets).mockReturnValue({
      data: mockTickets,
      isLoading: false,
    } as any)

    renderWithProviders(<TicketsTab merchantId="m1" />)

    // PriorityBadge shows labels like "High", "Medium"
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    vi.mocked(useTicketsModule.useMerchantTickets).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    renderWithProviders(<TicketsTab merchantId="m1" />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show empty state when no tickets', () => {
    vi.mocked(useTicketsModule.useMerchantTickets).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    renderWithProviders(<TicketsTab merchantId="m1" />)

    expect(screen.getByText('No tickets yet')).toBeInTheDocument()
  })

  it('should have links to ticket detail pages', () => {
    vi.mocked(useTicketsModule.useMerchantTickets).mockReturnValue({
      data: mockTickets,
      isLoading: false,
    } as any)

    renderWithProviders(<TicketsTab merchantId="m1" />)

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/tickets/t1')
    expect(links[1]).toHaveAttribute('href', '/tickets/t2')
  })

  it('should not show Create Ticket button for sales role', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'sales@example.com' },
      profile: { id: 'u1', email: 'sales@example.com', full_name: 'Sales User', role: 'sales' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => false,
    } as any)

    vi.mocked(useTicketsModule.useMerchantTickets).mockReturnValue({
      data: mockTickets,
      isLoading: false,
    } as any)

    renderWithProviders(<TicketsTab merchantId="m1" />)

    expect(screen.queryByText('Create Ticket')).not.toBeInTheDocument()
  })
})
