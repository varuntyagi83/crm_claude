import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UsersPage } from './UsersPage'
import * as useUsersModule from '@/hooks/useUsers'

vi.mock('@/hooks/useUsers', () => ({
  useUsers: vi.fn(),
  useUpdateUser: vi.fn(),
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

const mockUsers = [
  { id: 'u1', email: 'admin@example.com', full_name: 'Admin User', role: 'admin', created_at: '2024-01-01' },
  { id: 'u2', email: 'sales@example.com', full_name: 'Sales User', role: 'sales', created_at: '2024-01-02' },
  { id: 'u3', email: 'support@example.com', full_name: 'Support User', role: 'support', created_at: '2024-01-03' },
  { id: 'u4', email: 'ops@example.com', full_name: 'Ops User', role: 'ops', created_at: '2024-01-04' },
]

describe('UsersPage', () => {
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useUsersModule.useUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
    } as any)
    vi.mocked(useUsersModule.useUpdateUser).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)
  })

  it('should render page header', () => {
    renderWithProviders(<UsersPage />)

    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Manage system users and roles')).toBeInTheDocument()
  })

  it('should render search input', () => {
    renderWithProviders(<UsersPage />)

    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument()
  })

  it('should render role filter', () => {
    renderWithProviders(<UsersPage />)

    expect(screen.getByDisplayValue('All Roles')).toBeInTheDocument()
  })

  it('should render role stats cards', () => {
    renderWithProviders(<UsersPage />)

    // Each role should show count
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('sales')).toBeInTheDocument()
    expect(screen.getByText('support')).toBeInTheDocument()
    expect(screen.getByText('ops')).toBeInTheDocument()
  })

  it('should render users in table', () => {
    renderWithProviders(<UsersPage />)

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('Sales User')).toBeInTheDocument()
    expect(screen.getByText('Support User')).toBeInTheDocument()
    expect(screen.getByText('Ops User')).toBeInTheDocument()
  })

  it('should filter users by search', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)

    const searchInput = screen.getByPlaceholderText('Search users...')
    await user.type(searchInput, 'Admin')

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.queryByText('Sales User')).not.toBeInTheDocument()
  })

  it('should filter users by role', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)

    const roleSelect = screen.getByDisplayValue('All Roles')
    await user.selectOptions(roleSelect, 'sales')

    expect(screen.getByText('Sales User')).toBeInTheDocument()
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument()
  })

  it('should show edit dialog when clicking edit button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UsersPage />)

    // Find and click the first edit button
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find((btn) => btn.querySelector('svg'))
    if (editButton) {
      await user.click(editButton)
    }

    await waitFor(() => {
      expect(screen.getByText('Edit User')).toBeInTheDocument()
    })
  })

  it('should show loading state', () => {
    vi.mocked(useUsersModule.useUsers).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    renderWithProviders(<UsersPage />)

    // DataTable should show loading state
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument()
  })

  it('should show empty state when no users', () => {
    vi.mocked(useUsersModule.useUsers).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    renderWithProviders(<UsersPage />)

    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('should render role badges with correct formatting', () => {
    renderWithProviders(<UsersPage />)

    // Role badges capitalize first letter - use getAllByText since there may be multiple
    const adminBadges = screen.getAllByText('Admin')
    const salesBadges = screen.getAllByText('Sales')
    const supportBadges = screen.getAllByText('Support')
    const opsBadges = screen.getAllByText('Ops')

    expect(adminBadges.length).toBeGreaterThan(0)
    expect(salesBadges.length).toBeGreaterThan(0)
    expect(supportBadges.length).toBeGreaterThan(0)
    expect(opsBadges.length).toBeGreaterThan(0)
  })

  it('should display join dates', () => {
    renderWithProviders(<UsersPage />)

    // Users have created_at dates
    expect(screen.getByText('1/1/2024')).toBeInTheDocument()
    expect(screen.getByText('1/2/2024')).toBeInTheDocument()
  })
})
