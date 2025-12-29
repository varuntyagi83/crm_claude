import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransactionsTab } from './TransactionsTab'
import * as useTransactionsModule from '@/hooks/useTransactions'

vi.mock('@/hooks/useTransactions', () => ({
  useMerchantTransactions: vi.fn(),
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

const mockTransactions = [
  {
    id: 'tx1',
    type: 'payment',
    amount_cents: 10000,
    currency: 'USD',
    status: 'completed',
    card_brand: 'Visa',
    last_four: '4242',
    processed_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'tx2',
    type: 'refund',
    amount_cents: 5000,
    currency: 'USD',
    status: 'completed',
    card_brand: 'Mastercard',
    last_four: '1234',
    processed_at: '2024-01-14T10:00:00Z',
  },
  {
    id: 'tx3',
    type: 'payment',
    amount_cents: 7500,
    currency: 'USD',
    status: 'failed',
    card_brand: 'Visa',
    last_four: '5678',
    processed_at: '2024-01-13T10:00:00Z',
  },
]

describe('TransactionsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTransactionsModule.useMerchantTransactions).mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    } as any)
  })

  it('should render section header', () => {
    renderWithProviders(<TransactionsTab merchantId="m1" />)

    expect(screen.getByText('Transaction History')).toBeInTheDocument()
  })

  it('should render Export CSV button', () => {
    renderWithProviders(<TransactionsTab merchantId="m1" />)

    expect(screen.getByText('Export CSV')).toBeInTheDocument()
  })

  it('should render filter dropdowns', () => {
    renderWithProviders(<TransactionsTab merchantId="m1" />)

    expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All Types')).toBeInTheDocument()
  })

  it('should render transactions in table', () => {
    renderWithProviders(<TransactionsTab merchantId="m1" />)

    // "payment" appears in both the filter options and table, use getAllByText
    const paymentElements = screen.getAllByText('payment')
    expect(paymentElements.length).toBeGreaterThan(0)
    const refundElements = screen.getAllByText('refund')
    expect(refundElements.length).toBeGreaterThan(0)
  })

  it('should render transaction amounts', () => {
    renderWithProviders(<TransactionsTab merchantId="m1" />)

    // Payment: $100.00
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    // Refund: -$50.00
    expect(screen.getByText('-$50.00')).toBeInTheDocument()
  })

  it('should render transaction statuses', () => {
    renderWithProviders(<TransactionsTab merchantId="m1" />)

    const completedBadges = screen.getAllByText('completed')
    expect(completedBadges.length).toBe(2) // 2 completed transactions
    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  it('should render card info', () => {
    renderWithProviders(<TransactionsTab merchantId="m1" />)

    expect(screen.getByText(/Visa.*4242/)).toBeInTheDocument()
    expect(screen.getByText(/Mastercard.*1234/)).toBeInTheDocument()
  })

  it('should show loading state', () => {
    vi.mocked(useTransactionsModule.useMerchantTransactions).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    renderWithProviders(<TransactionsTab merchantId="m1" />)

    // DataTable should show loading state
    expect(screen.queryByText('payment')).not.toBeInTheDocument()
  })

  it('should show empty state when no transactions', () => {
    vi.mocked(useTransactionsModule.useMerchantTransactions).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    renderWithProviders(<TransactionsTab merchantId="m1" />)

    expect(screen.getByText('No transactions found')).toBeInTheDocument()
  })

  it('should filter by status', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsTab merchantId="m1" />)

    const statusSelect = screen.getByDisplayValue('All Statuses')
    await user.selectOptions(statusSelect, 'completed')

    // useMerchantTransactions should be called with status filter
    expect(useTransactionsModule.useMerchantTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
      })
    )
  })

  it('should filter by type', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsTab merchantId="m1" />)

    const typeSelect = screen.getByDisplayValue('All Types')
    await user.selectOptions(typeSelect, 'refund')

    // useMerchantTransactions should be called with type filter
    expect(useTransactionsModule.useMerchantTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'refund',
      })
    )
  })

  it('should render formatted dates', () => {
    renderWithProviders(<TransactionsTab merchantId="m1" />)

    // Dates should be formatted as locale strings
    const dateString = new Date('2024-01-15T10:00:00Z').toLocaleString()
    expect(screen.getByText(dateString)).toBeInTheDocument()
  })

  it('should style refund amounts with destructive color', () => {
    renderWithProviders(<TransactionsTab merchantId="m1" />)

    const refundAmount = screen.getByText('-$50.00')
    expect(refundAmount).toHaveClass('text-destructive')
  })
})
