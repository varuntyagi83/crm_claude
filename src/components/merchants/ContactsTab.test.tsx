import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContactsTab } from './ContactsTab'
import * as useContactsModule from '@/hooks/useContacts'
import * as useAuthModule from '@/hooks/useAuth'

vi.mock('@/hooks/useContacts', () => ({
  useMerchantContacts: vi.fn(),
  useDeleteContact: vi.fn(),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('./ContactForm', () => ({
  ContactForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="contact-form">
      <button onClick={onClose}>Close Form</button>
    </div>
  ),
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

const mockContacts = [
  {
    id: 'c1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    role: 'owner',
    is_primary: true,
    merchant_id: 'm1',
  },
  {
    id: 'c2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: null,
    role: 'manager',
    is_primary: false,
    merchant_id: 'm1',
  },
]

describe('ContactsTab', () => {
  const mockDeleteMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useContactsModule.useMerchantContacts).mockReturnValue({
      data: mockContacts,
      isLoading: false,
    } as any)
    vi.mocked(useContactsModule.useDeleteContact).mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as any)
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'sales@example.com' },
      profile: { id: 'u1', email: 'sales@example.com', full_name: 'Sales User', role: 'sales' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('should render section header', () => {
    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    expect(screen.getByText('Contacts')).toBeInTheDocument()
  })

  it('should render Add Contact button for sales role', () => {
    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    expect(screen.getByText('Add Contact')).toBeInTheDocument()
  })

  it('should render contacts', () => {
    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('555-1234')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('should render Primary badge for primary contact', () => {
    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    expect(screen.getByText('Primary')).toBeInTheDocument()
  })

  it('should render contact roles', () => {
    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    expect(screen.getByText('owner')).toBeInTheDocument()
    expect(screen.getByText('manager')).toBeInTheDocument()
  })

  it('should show empty state when no contacts', () => {
    vi.mocked(useContactsModule.useMerchantContacts).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    expect(screen.getByText('No contacts added yet')).toBeInTheDocument()
  })

  it('should open contact form when clicking Add Contact', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    await user.click(screen.getByText('Add Contact'))

    expect(screen.getByTestId('contact-form')).toBeInTheDocument()
  })

  it('should close contact form when form calls onClose', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    await user.click(screen.getByText('Add Contact'))
    expect(screen.getByTestId('contact-form')).toBeInTheDocument()

    await user.click(screen.getByText('Close Form'))
    expect(screen.queryByTestId('contact-form')).not.toBeInTheDocument()
  })

  it('should have email links', () => {
    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    const emailLinks = screen.getAllByRole('link')
    const johnEmailLink = emailLinks.find((link) => link.getAttribute('href') === 'mailto:john@example.com')
    expect(johnEmailLink).toBeInTheDocument()
  })

  it('should have phone links', () => {
    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    const phoneLinks = screen.getAllByRole('link')
    const phoneLink = phoneLinks.find((link) => link.getAttribute('href') === 'tel:555-1234')
    expect(phoneLink).toBeInTheDocument()
  })

  it('should delete contact when clicking delete button', async () => {
    mockDeleteMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    // Find delete buttons (buttons with trash icon)
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons.find((btn) => btn.querySelector('.text-destructive') || btn.classList.contains('text-destructive'))

    if (deleteButton) {
      await user.click(deleteButton)
    }

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalled()
    })
  })

  it('should not show Add Contact button for support role', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'support@example.com' },
      profile: { id: 'u1', email: 'support@example.com', full_name: 'Support User', role: 'support' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => false,
    } as any)

    renderWithProviders(<ContactsTab merchantId="m1" contacts={[]} />)

    expect(screen.queryByText('Add Contact')).not.toBeInTheDocument()
  })
})
