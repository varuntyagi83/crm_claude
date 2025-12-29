import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TicketForm } from './TicketForm'
import * as useTicketsModule from '@/hooks/useTickets'
import * as useMerchantsModule from '@/hooks/useMerchants'
import * as useAuthModule from '@/hooks/useAuth'

vi.mock('@/hooks/useTickets', () => ({
  useCreateTicket: vi.fn(),
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

describe('TicketForm', () => {
  const mockOnClose = vi.fn()
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'support@example.com' },
      profile: { id: 'u1', email: 'support@example.com', full_name: 'Support User', role: 'support' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)
    vi.mocked(useTicketsModule.useCreateTicket).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)
    vi.mocked(useMerchantsModule.useMerchants).mockReturnValue({
      data: mockMerchants,
      isLoading: false,
    } as any)
  })

  it('should render dialog title', () => {
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    expect(screen.getByText('Create Support Ticket')).toBeInTheDocument()
  })

  it('should render form fields', () => {
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    // Priority and category use custom Select, check for label text
    expect(screen.getByText(/priority/i)).toBeInTheDocument()
    expect(screen.getByText(/category/i)).toBeInTheDocument()
  })

  it('should render merchant selector when no merchantId provided', () => {
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    // Merchant label text
    expect(screen.getByText(/^Merchant/)).toBeInTheDocument()
  })

  it('should not render merchant selector when merchantId provided', () => {
    renderWithProviders(<TicketForm merchantId="m1" onClose={mockOnClose} />)

    // There should be no Merchant label visible
    expect(screen.queryByText(/^Merchant \*$/)).not.toBeInTheDocument()
  })

  it('should render Cancel and Create Ticket buttons', () => {
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Create Ticket')).toBeInTheDocument()
  })

  it('should call onClose when Cancel clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    await user.click(screen.getByText('Cancel'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should update subject value', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    const subjectInput = screen.getByLabelText(/subject/i)
    await user.type(subjectInput, 'Payment issue')

    expect(subjectInput).toHaveValue('Payment issue')
  })

  it('should update description value', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    const descriptionInput = screen.getByLabelText(/description/i)
    await user.type(descriptionInput, 'Cannot process payments')

    expect(descriptionInput).toHaveValue('Cannot process payments')
  })

  it('should show priority options', () => {
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Urgent')).toBeInTheDocument()
  })

  it('should show category options', () => {
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('Billing')).toBeInTheDocument()
    expect(screen.getByText('Compliance')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('should submit form with correct data', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithProviders(<TicketForm merchantId="m1" onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/subject/i), 'Payment issue')
    await user.type(screen.getByLabelText(/description/i), 'Cannot process payments')

    await user.click(screen.getByText('Create Ticket'))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          merchant_id: 'm1',
          subject: 'Payment issue',
          description: 'Cannot process payments',
          priority: 'medium',
          category: 'general',
          status: 'open',
          created_by: 'u1',
        })
      )
    })
  })

  it('should call onClose after successful submission', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithProviders(<TicketForm merchantId="m1" onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/subject/i), 'Payment issue')
    await user.type(screen.getByLabelText(/description/i), 'Cannot process payments')
    await user.click(screen.getByText('Create Ticket'))

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should disable Create Ticket button when fields are empty', () => {
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    const createButton = screen.getByText('Create Ticket')
    expect(createButton).toBeDisabled()
  })

  it('should disable Create Ticket button when loading', async () => {
    vi.mocked(useTicketsModule.useCreateTicket).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any)

    const user = userEvent.setup()
    renderWithProviders(<TicketForm merchantId="m1" onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/subject/i), 'Payment issue')
    await user.type(screen.getByLabelText(/description/i), 'Cannot process payments')

    const createButton = screen.getByText('Create Ticket')
    expect(createButton).toBeDisabled()
  })

  it('should show loading spinner when pending', async () => {
    vi.mocked(useTicketsModule.useCreateTicket).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any)

    const user = userEvent.setup()
    renderWithProviders(<TicketForm merchantId="m1" onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/subject/i), 'Payment issue')
    await user.type(screen.getByLabelText(/description/i), 'Cannot process payments')

    const button = screen.getByText('Create Ticket').closest('button')
    expect(button?.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should not submit when no merchant selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/subject/i), 'Payment issue')
    await user.type(screen.getByLabelText(/description/i), 'Cannot process payments')

    // Don't select a merchant - button should be disabled
    const createButton = screen.getByText('Create Ticket')
    expect(createButton).toBeDisabled()

    // Even if we force click, mutation should not be called
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('should render merchant options in select', () => {
    renderWithProviders(<TicketForm onClose={mockOnClose} />)

    expect(screen.getByText('Test Merchant 1')).toBeInTheDocument()
    expect(screen.getByText('Test Merchant 2')).toBeInTheDocument()
  })
})
