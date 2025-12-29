import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Topbar } from './Topbar'
import * as useAuthModule from '@/hooks/useAuth'

const mockNavigate = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('Topbar', () => {
  const mockSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'user@example.com' },
      profile: {
        id: 'u1',
        email: 'user@example.com',
        full_name: 'Test User',
        role: 'sales',
      },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: mockSignOut,
      isRole: () => true,
    } as any)
  })

  it('should render search input', () => {
    renderWithRouter(<Topbar />)

    expect(screen.getByPlaceholderText('Search merchants...')).toBeInTheDocument()
  })

  it('should render notifications button', () => {
    renderWithRouter(<Topbar />)

    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })

  it('should navigate on search submit', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Topbar />)

    const searchInput = screen.getByPlaceholderText('Search merchants...')
    await user.type(searchInput, 'test merchant')

    const form = searchInput.closest('form')!
    fireEvent.submit(form)

    expect(mockNavigate).toHaveBeenCalledWith('/merchants?q=test%20merchant')
  })

  it('should not navigate on empty search', async () => {
    renderWithRouter(<Topbar />)

    const searchInput = screen.getByPlaceholderText('Search merchants...')
    const form = searchInput.closest('form')!
    fireEvent.submit(form)

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should not navigate on whitespace-only search', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Topbar />)

    const searchInput = screen.getByPlaceholderText('Search merchants...')
    await user.type(searchInput, '   ')

    const form = searchInput.closest('form')!
    fireEvent.submit(form)

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should display user name and email in dropdown', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Topbar />)

    // Find and click the dropdown trigger (the button after the notifications button)
    const buttons = screen.getAllByRole('button')
    const avatarButton = buttons[buttons.length - 1] // Last button is the avatar trigger
    await user.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('user@example.com')).toBeInTheDocument()
    })
  })

  it('should navigate to profile on profile menu item click', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Topbar />)

    // Find and click the dropdown trigger
    const buttons = screen.getAllByRole('button')
    const avatarButton = buttons[buttons.length - 1]
    await user.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Profile'))

    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })

  it('should sign out and navigate to login on sign out click', async () => {
    mockSignOut.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithRouter(<Topbar />)

    // Find and click the dropdown trigger
    const buttons = screen.getAllByRole('button')
    const avatarButton = buttons[buttons.length - 1]
    await user.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Sign out'))

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('should update search value on input change', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Topbar />)

    const searchInput = screen.getByPlaceholderText('Search merchants...')
    await user.type(searchInput, 'new search')

    expect(searchInput).toHaveValue('new search')
  })
})
