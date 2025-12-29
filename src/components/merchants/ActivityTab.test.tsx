import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ActivityTab } from './ActivityTab'
import * as useActivitiesModule from '@/hooks/useActivities'

vi.mock('@/hooks/useActivities', () => ({
  useMerchantActivities: vi.fn(),
  useCreateActivity: vi.fn(),
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

const mockActivities = [
  {
    id: 'a1',
    type: 'note',
    content: 'Called to discuss contract terms',
    created_at: '2024-01-15T10:00:00Z',
    created_user: { full_name: 'John Doe' },
  },
  {
    id: 'a2',
    type: 'call',
    content: 'Follow-up call scheduled for next week',
    created_at: '2024-01-14T10:00:00Z',
    created_user: { full_name: 'Jane Smith' },
  },
  {
    id: 'a3',
    type: 'email',
    content: 'Sent proposal document',
    created_at: '2024-01-13T10:00:00Z',
    created_user: null,
  },
]

describe('ActivityTab', () => {
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useActivitiesModule.useMerchantActivities).mockReturnValue({
      data: mockActivities,
      isLoading: false,
    } as any)
    vi.mocked(useActivitiesModule.useCreateActivity).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)
  })

  it('should render Add Activity form', () => {
    renderWithProviders(<ActivityTab merchantId="m1" />)

    expect(screen.getByText('Add Activity')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter your note/)).toBeInTheDocument()
  })

  it('should render activity type selector', () => {
    renderWithProviders(<ActivityTab merchantId="m1" />)

    expect(screen.getByDisplayValue('Note')).toBeInTheDocument()
  })

  it('should render Activity History section', () => {
    renderWithProviders(<ActivityTab merchantId="m1" />)

    expect(screen.getByText('Activity History')).toBeInTheDocument()
  })

  it('should render activities', () => {
    renderWithProviders(<ActivityTab merchantId="m1" />)

    expect(screen.getByText('Called to discuss contract terms')).toBeInTheDocument()
    expect(screen.getByText('Follow-up call scheduled for next week')).toBeInTheDocument()
    expect(screen.getByText('Sent proposal document')).toBeInTheDocument()
  })

  it('should render activity authors', () => {
    renderWithProviders(<ActivityTab merchantId="m1" />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument() // null created_user
  })

  it('should show loading state', () => {
    vi.mocked(useActivitiesModule.useMerchantActivities).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    renderWithProviders(<ActivityTab merchantId="m1" />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show empty state when no activities', () => {
    vi.mocked(useActivitiesModule.useMerchantActivities).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    renderWithProviders(<ActivityTab merchantId="m1" />)

    expect(screen.getByText('No activity recorded yet')).toBeInTheDocument()
  })

  it('should submit new activity', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithProviders(<ActivityTab merchantId="m1" />)

    const textarea = screen.getByPlaceholderText(/Enter your note/)
    await user.type(textarea, 'New activity content')

    const submitButton = screen.getByText('Add Note')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        merchant_id: 'm1',
        type: 'note',
        content: 'New activity content',
      })
    })
  })

  it('should change activity type', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithProviders(<ActivityTab merchantId="m1" />)

    const select = screen.getByDisplayValue('Note')
    await user.selectOptions(select, 'call')

    // Button text should update
    expect(screen.getByText('Add Call')).toBeInTheDocument()
  })

  it('should not submit empty content', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ActivityTab merchantId="m1" />)

    const submitButton = screen.getByText('Add Note')
    await user.click(submitButton)

    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('should not submit whitespace-only content', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ActivityTab merchantId="m1" />)

    const textarea = screen.getByPlaceholderText(/Enter your note/)
    await user.type(textarea, '   ')

    const submitButton = screen.getByText('Add Note')
    await user.click(submitButton)

    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('should clear content after successful submission', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithProviders(<ActivityTab merchantId="m1" />)

    const textarea = screen.getByPlaceholderText(/Enter your note/)
    await user.type(textarea, 'New activity content')

    const submitButton = screen.getByText('Add Note')
    await user.click(submitButton)

    await waitFor(() => {
      expect(textarea).toHaveValue('')
    })
  })

  it('should disable button when pending', () => {
    vi.mocked(useActivitiesModule.useCreateActivity).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any)

    renderWithProviders(<ActivityTab merchantId="m1" />)

    const submitButton = screen.getByRole('button', { name: /Add Note/i })
    expect(submitButton).toBeDisabled()
  })
})
