import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SettingsPage } from './SettingsPage'
import * as useAuthModule from '@/hooks/useAuth'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render page header', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'user@example.com' },
      profile: { id: 'u1', email: 'user@example.com', full_name: 'Test User', role: 'admin' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    renderWithRouter(<SettingsPage />)

    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Manage application settings')).toBeInTheDocument()
  })

  it('should render General settings card', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'user@example.com' },
      profile: { id: 'u1', email: 'user@example.com', full_name: 'Test User', role: 'admin' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    renderWithRouter(<SettingsPage />)

    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Application Name')).toBeInTheDocument()
    expect(screen.getByText('Timezone')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Merchant CRM')).toBeInTheDocument()
    expect(screen.getByDisplayValue('UTC')).toBeInTheDocument()
  })

  it('should render Notifications card', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'user@example.com' },
      profile: { id: 'u1', email: 'user@example.com', full_name: 'Test User', role: 'admin' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    renderWithRouter(<SettingsPage />)

    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Email Notifications')).toBeInTheDocument()
    expect(screen.getByText('Ticket Alerts')).toBeInTheDocument()
    expect(screen.getByText('Notification settings coming soon.')).toBeInTheDocument()
  })

  it('should render Security card with user info', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'user@example.com' },
      profile: { id: 'u1', email: 'user@example.com', full_name: 'Test User', role: 'admin' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    renderWithRouter(<SettingsPage />)

    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.getByText('Current User')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('admin')).toBeInTheDocument()
    expect(screen.getByText('Change Password')).toBeInTheDocument()
  })

  it('should render Appearance card', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'user@example.com' },
      profile: { id: 'u1', email: 'user@example.com', full_name: 'Test User', role: 'admin' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    renderWithRouter(<SettingsPage />)

    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
    expect(screen.getByText('Compact Mode')).toBeInTheDocument()
    expect(screen.getByText('Theme customization coming soon.')).toBeInTheDocument()
  })

  it('should render System Information card', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'user@example.com' },
      profile: { id: 'u1', email: 'user@example.com', full_name: 'Test User', role: 'admin' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    renderWithRouter(<SettingsPage />)

    expect(screen.getByText('System Information')).toBeInTheDocument()
    expect(screen.getByText('Version')).toBeInTheDocument()
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
    expect(screen.getByText('Database')).toBeInTheDocument()
    expect(screen.getByText('Supabase PostgreSQL')).toBeInTheDocument()
    expect(screen.getByText('Environment')).toBeInTheDocument()
    expect(screen.getByText('Production')).toBeInTheDocument()
    expect(screen.getByText('API Status')).toBeInTheDocument()
    expect(screen.getByText('Healthy')).toBeInTheDocument()
  })

  it('should show empty values when no profile', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => false,
    })

    renderWithRouter(<SettingsPage />)

    // Security card should have empty email and role
    const emailInput = screen.getAllByRole('textbox').find(
      (input) => (input as HTMLInputElement).value === ''
    )
    expect(emailInput).toBeDefined()
  })
})
