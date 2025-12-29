import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContactForm } from './ContactForm'
import * as useContactsModule from '@/hooks/useContacts'

vi.mock('@/hooks/useContacts', () => ({
  useCreateContact: vi.fn(),
  useUpdateContact: vi.fn(),
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

const mockContact = {
  id: 'c1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  role: 'owner',
  is_primary: true,
  merchant_id: 'm1',
}

describe('ContactForm', () => {
  const mockOnClose = vi.fn()
  const mockCreateMutateAsync = vi.fn()
  const mockUpdateMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useContactsModule.useCreateContact).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
    } as any)
    vi.mocked(useContactsModule.useUpdateContact).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as any)
  })

  describe('Add Contact mode', () => {
    it('should render dialog title for add mode', () => {
      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      // Title and button both say "Add Contact", use getAllByText
      const elements = screen.getAllByText('Add Contact')
      expect(elements.length).toBeGreaterThan(0)
    })

    it('should render form fields', () => {
      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^role$/i)).toBeInTheDocument()
    })

    it('should render primary contact checkbox', () => {
      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      expect(screen.getByText('Set as primary contact')).toBeInTheDocument()
    })

    it('should render Cancel and Add Contact buttons', () => {
      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add contact/i })).toBeInTheDocument()
    })

    it('should call onClose when Cancel clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      await user.click(screen.getByText('Cancel'))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should update form values', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)

      await user.type(nameInput, 'Jane Smith')
      await user.type(emailInput, 'jane@example.com')
      await user.type(phoneInput, '555-5678')

      expect(nameInput).toHaveValue('Jane Smith')
      expect(emailInput).toHaveValue('jane@example.com')
      expect(phoneInput).toHaveValue('555-5678')
    })

    it('should create contact on submit', async () => {
      mockCreateMutateAsync.mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      await user.type(screen.getByLabelText(/name/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
      await user.click(screen.getByRole('button', { name: /add contact/i }))

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            merchant_id: 'm1',
            name: 'Jane Smith',
            email: 'jane@example.com',
          })
        )
      })
    })

    it('should call onClose after successful creation', async () => {
      mockCreateMutateAsync.mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      await user.type(screen.getByLabelText(/name/i), 'Jane Smith')
      await user.click(screen.getByRole('button', { name: /add contact/i }))

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should disable button when name is empty', () => {
      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      const addButton = screen.getByRole('button', { name: /add contact/i })
      expect(addButton).toBeDisabled()
    })
  })

  describe('Edit Contact mode', () => {
    it('should render dialog title for edit mode', () => {
      renderWithProviders(<ContactForm merchantId="m1" contact={mockContact} onClose={mockOnClose} />)

      expect(screen.getByText('Edit Contact')).toBeInTheDocument()
    })

    it('should pre-fill form with contact data', () => {
      renderWithProviders(<ContactForm merchantId="m1" contact={mockContact} onClose={mockOnClose} />)

      expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe')
      expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com')
      expect(screen.getByLabelText(/phone/i)).toHaveValue('555-1234')
      expect(screen.getByLabelText(/^role$/i)).toHaveValue('owner')
    })

    it('should render Save Changes button', () => {
      renderWithProviders(<ContactForm merchantId="m1" contact={mockContact} onClose={mockOnClose} />)

      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    it('should update contact on submit', async () => {
      mockUpdateMutateAsync.mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderWithProviders(<ContactForm merchantId="m1" contact={mockContact} onClose={mockOnClose} />)

      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'John Updated')

      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'c1',
            updates: expect.objectContaining({
              name: 'John Updated',
            }),
          })
        )
      })
    })

    it('should call onClose after successful update', async () => {
      mockUpdateMutateAsync.mockResolvedValue(undefined)
      const user = userEvent.setup()
      renderWithProviders(<ContactForm merchantId="m1" contact={mockContact} onClose={mockOnClose} />)

      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('Loading state', () => {
    it('should disable button when creating', () => {
      vi.mocked(useContactsModule.useCreateContact).mockReturnValue({
        mutateAsync: mockCreateMutateAsync,
        isPending: true,
      } as any)

      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      const addButton = screen.getByRole('button', { name: /add contact/i })
      expect(addButton).toBeDisabled()
    })

    it('should disable button when updating', () => {
      vi.mocked(useContactsModule.useUpdateContact).mockReturnValue({
        mutateAsync: mockUpdateMutateAsync,
        isPending: true,
      } as any)

      renderWithProviders(<ContactForm merchantId="m1" contact={mockContact} onClose={mockOnClose} />)

      const saveButton = screen.getByText('Save Changes')
      expect(saveButton).toBeDisabled()
    })

    it('should show loading spinner when pending', () => {
      vi.mocked(useContactsModule.useCreateContact).mockReturnValue({
        mutateAsync: mockCreateMutateAsync,
        isPending: true,
      } as any)

      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      const button = screen.getByRole('button', { name: /add contact/i }).closest('button')
      expect(button?.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Primary contact toggle', () => {
    it('should toggle primary contact checkbox', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ContactForm merchantId="m1" onClose={mockOnClose} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)
      expect(checkbox).toBeChecked()
    })

    it('should preserve primary status when editing', () => {
      renderWithProviders(<ContactForm merchantId="m1" contact={mockContact} onClose={mockOnClose} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })
  })
})
