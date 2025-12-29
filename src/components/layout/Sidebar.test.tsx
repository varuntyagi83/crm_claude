import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import * as useAuthModule from '@/hooks/useAuth'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render logo and app name', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => false,
    })

    renderWithRouter(<Sidebar />)

    expect(screen.getByText('Merchant CRM')).toBeInTheDocument()
  })

  it('should show nav items for admin role', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'admin@example.com' },
      profile: { id: 'u1', email: 'admin@example.com', full_name: 'Admin', role: 'admin' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    renderWithRouter(<Sidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Merchants')).toBeInTheDocument()
    expect(screen.getByText('Tickets')).toBeInTheDocument()
    expect(screen.getByText('My Tasks')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should show limited nav items for sales role', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'sales@example.com' },
      profile: { id: 'u1', email: 'sales@example.com', full_name: 'Sales', role: 'sales' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    renderWithRouter(<Sidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Merchants')).toBeInTheDocument()
    expect(screen.getByText('My Tasks')).toBeInTheDocument()
    expect(screen.queryByText('Tickets')).not.toBeInTheDocument()
    expect(screen.queryByText('Users')).not.toBeInTheDocument()
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  it('should show support-specific nav items', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'support@example.com' },
      profile: { id: 'u1', email: 'support@example.com', full_name: 'Support', role: 'support' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    renderWithRouter(<Sidebar />)

    expect(screen.getByText('Tickets')).toBeInTheDocument()
    expect(screen.queryByText('Users')).not.toBeInTheDocument()
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  it('should display user role in footer', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'admin@example.com' },
      profile: { id: 'u1', email: 'admin@example.com', full_name: 'Admin', role: 'admin' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    renderWithRouter(<Sidebar />)

    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('should show no nav items when no profile', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => false,
    })

    renderWithRouter(<Sidebar />)

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Merchants')).not.toBeInTheDocument()
  })

  it('should have navigation links with correct hrefs', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'admin@example.com' },
      profile: { id: 'u1', email: 'admin@example.com', full_name: 'Admin', role: 'admin' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    renderWithRouter(<Sidebar />)

    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('Merchants').closest('a')).toHaveAttribute('href', '/merchants')
    expect(screen.getByText('Tickets').closest('a')).toHaveAttribute('href', '/tickets')
    expect(screen.getByText('My Tasks').closest('a')).toHaveAttribute('href', '/tasks')
    expect(screen.getByText('Users').closest('a')).toHaveAttribute('href', '/users')
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/settings')
  })
})
