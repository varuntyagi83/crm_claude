import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TaskForm } from './TaskForm'
import * as useTasksModule from '@/hooks/useTasks'
import * as useMerchantsModule from '@/hooks/useMerchants'
import * as useAuthModule from '@/hooks/useAuth'

vi.mock('@/hooks/useTasks', () => ({
  useCreateTask: vi.fn(),
}))

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
  { id: 'm1', name: 'Test Merchant 1' },
  { id: 'm2', name: 'Test Merchant 2' },
]

describe('TaskForm', () => {
  const mockOnClose = vi.fn()
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'user@example.com' },
      profile: { id: 'u1', email: 'user@example.com', full_name: 'Test User', role: 'sales' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)
    vi.mocked(useTasksModule.useCreateTask).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)
    vi.mocked(useMerchantsModule.useMerchants).mockReturnValue({
      data: mockMerchants,
      isLoading: false,
    } as any)
  })

  it('should render dialog title', () => {
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    expect(screen.getByText('New Task')).toBeInTheDocument()
  })

  it('should render form fields', () => {
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument()
  })

  it('should render merchant selector when no merchantId provided', () => {
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    expect(screen.getByText(/related merchant/i)).toBeInTheDocument()
    expect(screen.getByText('No merchant (personal task)')).toBeInTheDocument()
  })

  it('should not render merchant selector when merchantId provided', () => {
    renderWithProviders(<TaskForm merchantId="m1" onClose={mockOnClose} />)

    expect(screen.queryByLabelText(/related merchant/i)).not.toBeInTheDocument()
  })

  it('should render Cancel and Create Task buttons', () => {
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Create Task')).toBeInTheDocument()
  })

  it('should call onClose when Cancel clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    await user.click(screen.getByText('Cancel'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should update title value', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    const titleInput = screen.getByLabelText(/title/i)
    await user.type(titleInput, 'New task title')

    expect(titleInput).toHaveValue('New task title')
  })

  it('should update description value', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    const descriptionInput = screen.getByLabelText(/description/i)
    await user.type(descriptionInput, 'Task description')

    expect(descriptionInput).toHaveValue('Task description')
  })

  it('should submit form with correct data', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/title/i), 'New task')
    await user.type(screen.getByLabelText(/description/i), 'Task details')

    await user.click(screen.getByText('Create Task'))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New task',
          description: 'Task details',
          assigned_to: 'u1',
        })
      )
    })
  })

  it('should call onClose after successful submission', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/title/i), 'New task')
    await user.click(screen.getByText('Create Task'))

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should disable Create Task button when title is empty', () => {
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    const createButton = screen.getByText('Create Task')
    expect(createButton).toBeDisabled()
  })

  it('should disable Create Task button when loading', () => {
    vi.mocked(useTasksModule.useCreateTask).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any)

    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    const createButton = screen.getByText('Create Task')
    expect(createButton).toBeDisabled()
  })

  it('should show loading spinner when pending', async () => {
    vi.mocked(useTasksModule.useCreateTask).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any)

    const user = userEvent.setup()
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/title/i), 'New task')

    // Button should have the loading spinner
    const button = screen.getByText('Create Task').closest('button')
    expect(button?.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should render merchant options in select', () => {
    renderWithProviders(<TaskForm onClose={mockOnClose} />)

    expect(screen.getByText('Test Merchant 1')).toBeInTheDocument()
    expect(screen.getByText('Test Merchant 2')).toBeInTheDocument()
  })
})
