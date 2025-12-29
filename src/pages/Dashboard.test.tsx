import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Dashboard } from './Dashboard'
import * as useAuthModule from '@/hooks/useAuth'
import * as useMerchantsModule from '@/hooks/useMerchants'
import * as useTasksModule from '@/hooks/useTasks'
import * as useTicketsModule from '@/hooks/useTickets'
import * as useActivitiesModule from '@/hooks/useActivities'
import * as useTransactionsModule from '@/hooks/useTransactions'

// Mock all hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/useMerchants', () => ({
  useMyMerchants: vi.fn(),
  useMerchantCounts: vi.fn(),
}))

vi.mock('@/hooks/useTasks', () => ({
  useMyTasks: vi.fn(),
  useTaskCounts: vi.fn(),
}))

vi.mock('@/hooks/useTickets', () => ({
  useTickets: vi.fn(),
  useTicketCounts: vi.fn(),
}))

vi.mock('@/hooks/useActivities', () => ({
  useRecentActivities: vi.fn(),
}))

vi.mock('@/hooks/useTransactions', () => ({
  useTotalVolume: vi.fn(),
  useFailedRate: vi.fn(),
  useDailyVolume: vi.fn(),
}))

// Mock recharts to avoid rendering issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
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

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(useMerchantsModule.useMyMerchants).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    vi.mocked(useMerchantsModule.useMerchantCounts).mockReturnValue({
      data: { total: 10, active: 8, inactive: 2, suspended: 0, onboarding: 0 },
    } as any)
    vi.mocked(useTasksModule.useMyTasks).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    vi.mocked(useTasksModule.useTaskCounts).mockReturnValue({
      data: { pending: 5, overdue: 2 },
    } as any)
    vi.mocked(useTicketsModule.useTickets).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    vi.mocked(useTicketsModule.useTicketCounts).mockReturnValue({
      data: { open: 15, urgent: 3, assigned: 10 },
    } as any)
    vi.mocked(useActivitiesModule.useRecentActivities).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
    vi.mocked(useTransactionsModule.useTotalVolume).mockReturnValue({
      data: 1000000,
      isLoading: false,
    } as any)
    vi.mocked(useTransactionsModule.useFailedRate).mockReturnValue({
      data: 2.5,
      isLoading: false,
    } as any)
    vi.mocked(useTransactionsModule.useDailyVolume).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
  })

  describe('Page Header', () => {
    it('should render welcome message with user name', () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: { id: 'u1', email: 'user@example.com' },
        profile: { id: 'u1', email: 'user@example.com', full_name: 'John Doe', role: 'sales' },
        loading: false,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        isRole: (role: string) => role === 'sales',
      } as any)

      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Welcome back, John Doe')).toBeInTheDocument()
    })
  })

  describe('Sales Dashboard', () => {
    beforeEach(() => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: { id: 'u1', email: 'sales@example.com' },
        profile: { id: 'u1', email: 'sales@example.com', full_name: 'Sales Rep', role: 'sales' },
        loading: false,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        isRole: (role: string) => role === 'sales',
      } as any)
    })

    it('should show sales metrics', () => {
      renderWithProviders(<Dashboard />)

      // Use getAllByText since text may appear in multiple places
      expect(screen.getAllByText('My Merchants').length).toBeGreaterThan(0)
      expect(screen.getByText('Open Tasks')).toBeInTheDocument()
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    })

    it('should show merchants list card', () => {
      const mockMerchants = [
        { id: 'm1', name: 'Test Merchant', legal_name: 'Test LLC', status: 'active' },
      ]
      vi.mocked(useMerchantsModule.useMyMerchants).mockReturnValue({
        data: mockMerchants,
        isLoading: false,
      } as any)

      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Test Merchant')).toBeInTheDocument()
      expect(screen.getByText('Test LLC')).toBeInTheDocument()
    })

    it('should show empty state when no merchants', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByText('No merchants assigned')).toBeInTheDocument()
    })

    it('should show tasks list card', () => {
      const mockTasks = [
        { id: 't1', title: 'Follow up', merchant: { name: 'Test Merchant' }, due_date: '2024-01-20' },
      ]
      vi.mocked(useTasksModule.useMyTasks).mockReturnValue({
        data: mockTasks,
        isLoading: false,
      } as any)

      renderWithProviders(<Dashboard />)

      expect(screen.getByText('My Tasks')).toBeInTheDocument()
      expect(screen.getByText('Follow up')).toBeInTheDocument()
    })

    it('should show empty state when no tasks', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByText('All caught up!')).toBeInTheDocument()
    })
  })

  describe('Support Dashboard', () => {
    beforeEach(() => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: { id: 'u1', email: 'support@example.com' },
        profile: { id: 'u1', email: 'support@example.com', full_name: 'Support Rep', role: 'support' },
        loading: false,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        isRole: (role: string) => role === 'support',
      } as any)
    })

    it('should show support metrics', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Open Tickets')).toBeInTheDocument()
      expect(screen.getByText('Urgent')).toBeInTheDocument()
      expect(screen.getByText('My Assigned')).toBeInTheDocument()
    })

    it('should show my assigned tickets card', () => {
      const mockTickets = [
        { id: 't1', subject: 'Payment Issue', merchant: { name: 'Test Merchant' }, priority: 'high', assigned_to: 'u1' },
      ]
      vi.mocked(useTicketsModule.useTickets).mockReturnValue({
        data: mockTickets,
        isLoading: false,
      } as any)

      renderWithProviders(<Dashboard />)

      expect(screen.getByText('My Assigned Tickets')).toBeInTheDocument()
      expect(screen.getByText('Payment Issue')).toBeInTheDocument()
    })

    it('should show empty state when no tickets assigned', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByText('No tickets assigned')).toBeInTheDocument()
    })

    it('should show unassigned tickets card', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Unassigned Tickets')).toBeInTheDocument()
    })
  })

  describe('Ops Dashboard', () => {
    beforeEach(() => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: { id: 'u1', email: 'ops@example.com' },
        profile: { id: 'u1', email: 'ops@example.com', full_name: 'Ops User', role: 'ops' },
        loading: false,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        isRole: (role: string) => role === 'ops',
      } as any)
    })

    it('should show ops metrics', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Active Merchants')).toBeInTheDocument()
      expect(screen.getByText('Transaction Volume (30d)')).toBeInTheDocument()
      expect(screen.getByText('Failed Transaction Rate')).toBeInTheDocument()
    })

    it('should show transaction volume chart', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Transaction Volume Trend')).toBeInTheDocument()
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })

    it('should format currency correctly', () => {
      vi.mocked(useTransactionsModule.useTotalVolume).mockReturnValue({
        data: 1000000,
        isLoading: false,
      } as any)

      renderWithProviders(<Dashboard />)

      // Should show formatted currency
      expect(screen.getByText(/\$10,000.00/)).toBeInTheDocument()
    })

    it('should show failed rate percentage', () => {
      vi.mocked(useTransactionsModule.useFailedRate).mockReturnValue({
        data: 2.5,
        isLoading: false,
      } as any)

      renderWithProviders(<Dashboard />)

      expect(screen.getByText('2.50%')).toBeInTheDocument()
    })
  })

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: { id: 'u1', email: 'admin@example.com' },
        profile: { id: 'u1', email: 'admin@example.com', full_name: 'Admin User', role: 'admin' },
        loading: false,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        isRole: (role: string) => role === 'admin',
      } as any)
    })

    it('should show admin metrics', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Total Merchants')).toBeInTheDocument()
      expect(screen.getByText('Active Merchants')).toBeInTheDocument()
      expect(screen.getByText('Open Tickets')).toBeInTheDocument()
      expect(screen.getByText('Transaction Volume (30d)')).toBeInTheDocument()
    })

    it('should show transaction volume chart', () => {
      renderWithProviders(<Dashboard />)

      expect(screen.getByText('Transaction Volume Trend')).toBeInTheDocument()
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading skeletons for sales dashboard', () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: { id: 'u1', email: 'sales@example.com' },
        profile: { id: 'u1', email: 'sales@example.com', full_name: 'Sales Rep', role: 'sales' },
        loading: false,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        isRole: (role: string) => role === 'sales',
      } as any)

      vi.mocked(useMerchantsModule.useMyMerchants).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any)

      renderWithProviders(<Dashboard />)

      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })
})
