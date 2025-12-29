import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './AppShell'
import * as useAuthModule from '@/hooks/useAuth'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}))

vi.mock('./Topbar', () => ({
  Topbar: () => <div data-testid="topbar">Topbar</div>,
}))

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      isLoading: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => false,
    })

    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    )

    // Should show skeleton loading
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should redirect to login when not authenticated', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => false,
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<AppShell />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('should render layout when authenticated', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'user@example.com' },
      profile: { id: 'u1', email: 'user@example.com', full_name: 'Test', role: 'sales' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<AppShell />}>
            <Route index element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('topbar')).toBeInTheDocument()
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })

  it('should render Outlet for nested routes', () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'user@example.com' },
      profile: { id: 'u1', email: 'user@example.com', full_name: 'Test', role: 'sales' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)

    render(
      <MemoryRouter initialEntries={['/merchants']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/merchants" element={<div>Merchants Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Merchants Page')).toBeInTheDocument()
  })
})
