import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MerchantsPage } from './MerchantsPage'
import * as useMerchantsModule from '@/hooks/useMerchants'
import * as useAuthModule from '@/hooks/useAuth'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/hooks/useMerchants', () => ({
  useMerchants: vi.fn(),
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

const mockMerchants = [
  {
    id: 'm1',
    name: 'Test Merchant',
    legal_name: 'Test Merchant LLC',
    status: 'active',
    mcc_code: '5411',
    onboarded_at: '2024-01-15',
  },
  {
    id: 'm2',
    name: 'Another Merchant',
    legal_name: 'Another LLC',
    status: 'inactive',
    mcc_code: null,
    onboarded_at: null,
  },
]

describe('MerchantsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useMerchantsModule.useMerchants).mockReturnValue({
      data: mockMerchants,
      isLoading: false,
    } as any)
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'admin@example.com' },
      profile: { id: 'u1', email: 'admin@example.com', full_name: 'Admin User', role: 'admin' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)
  })

  it('should render page header', () => {
    renderWithProviders(<MerchantsPage />)

    expect(screen.getByText('Merchants')).toBeInTheDocument()
    expect(screen.getByText('Manage your merchant accounts')).toBeInTheDocument()
  })

  it('should render Add Merchant button for admin', () => {
    renderWithProviders(<MerchantsPage />)

    expect(screen.getByText('Add Merchant')).toBeInTheDocument()
  })

  it('should render search input', () => {
    renderWithProviders(<MerchantsPage />)

    expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument()
  })

  it('should render status filter', () => {
    renderWithProviders(<MerchantsPage />)

    expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument()
  })

  it('should render Search button', () => {
    renderWithProviders(<MerchantsPage />)

    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('should render merchants in table', () => {
    renderWithProviders(<MerchantsPage />)

    expect(screen.getByText('Test Merchant')).toBeInTheDocument()
    expect(screen.getByText('Test Merchant LLC')).toBeInTheDocument()
    expect(screen.getByText('Another Merchant')).toBeInTheDocument()
  })

  it('should render status badges', () => {
    renderWithProviders(<MerchantsPage />)

    // "Active" and "Inactive" appear in both filter dropdown and status badges
    const activeElements = screen.getAllByText('Active')
    const inactiveElements = screen.getAllByText('Inactive')
    expect(activeElements.length).toBeGreaterThan(0)
    expect(inactiveElements.length).toBeGreaterThan(0)
  })

  it('should render MCC codes', () => {
    renderWithProviders(<MerchantsPage />)

    expect(screen.getByText('5411')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    vi.mocked(useMerchantsModule.useMerchants).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    renderWithProviders(<MerchantsPage />)

    // DataTable shows loading state
    expect(screen.queryByText('Test Merchant')).not.toBeInTheDocument()
  })

  it('should show empty state when no merchants', () => {
    vi.mocked(useMerchantsModule.useMerchants).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    renderWithProviders(<MerchantsPage />)

    expect(screen.getByText('No merchants found')).toBeInTheDocument()
  })

  it('should update search query value', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MerchantsPage />)

    const searchInput = screen.getByPlaceholderText('Search by name...')
    await user.type(searchInput, 'Test')

    expect(searchInput).toHaveValue('Test')
  })

  it('should navigate to new merchant page when clicking Add Merchant', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MerchantsPage />)

    await user.click(screen.getByText('Add Merchant'))

    expect(mockNavigate).toHaveBeenCalledWith('/merchants/new')
  })

  it('should navigate to merchant detail on row click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MerchantsPage />)

    // Click the first merchant row
    const row = screen.getByText('Test Merchant').closest('tr')
    if (row) {
      await user.click(row)
    }

    expect(mockNavigate).toHaveBeenCalledWith('/merchants/m1')
  })

  it('should not show Add Merchant button for non-admin', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'sales@example.com' },
      profile: { id: 'u1', email: 'sales@example.com', full_name: 'Sales User', role: 'sales' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => false,
    } as any)

    renderWithProviders(<MerchantsPage />)

    expect(screen.queryByText('Add Merchant')).not.toBeInTheDocument()
  })

  it('should show Clear button when filters are applied', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MerchantsPage />)

    const searchInput = screen.getByPlaceholderText('Search by name...')
    await user.type(searchInput, 'Test')

    // Submit the search form
    const searchButton = screen.getByText('Search')
    await user.click(searchButton)

    // Clear button should appear
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('should clear filters when clicking Clear', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MerchantsPage />)

    const searchInput = screen.getByPlaceholderText('Search by name...')
    await user.type(searchInput, 'Test')
    await user.click(screen.getByText('Search'))

    // Clear button should appear
    await user.click(screen.getByText('Clear'))

    // Search input should be cleared
    expect(searchInput).toHaveValue('')
  })

  it('should filter by status', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MerchantsPage />)

    const statusSelect = screen.getByDisplayValue('All Statuses')
    await user.selectOptions(statusSelect, 'active')

    // useMerchants should be called with status filter
    expect(useMerchantsModule.useMerchants).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
      })
    )
  })
})
