import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoleGate } from './RoleGate'
import type { Profile } from '@/types/database'

// Mock the useAuth hook
const mockUseAuth = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('RoleGate', () => {
  const mockAdminProfile: Profile = {
    id: 'admin-1',
    email: 'admin@test.com',
    full_name: 'Admin User',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockSalesProfile: Profile = {
    id: 'sales-1',
    email: 'sales@test.com',
    full_name: 'Sales User',
    role: 'sales',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockSupportProfile: Profile = {
    id: 'support-1',
    email: 'support@test.com',
    full_name: 'Support User',
    role: 'support',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockOpsProfile: Profile = {
    id: 'ops-1',
    email: 'ops@test.com',
    full_name: 'Ops User',
    role: 'ops',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  it('should render children when user has allowed role', () => {
    mockUseAuth.mockReturnValue({ profile: mockAdminProfile })

    render(
      <RoleGate allowed={['admin']}>
        <div>Admin Content</div>
      </RoleGate>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('should render children when user has one of allowed roles', () => {
    mockUseAuth.mockReturnValue({ profile: mockSalesProfile })

    render(
      <RoleGate allowed={['admin', 'sales', 'support']}>
        <div>Multiple Roles Content</div>
      </RoleGate>
    )

    expect(screen.getByText('Multiple Roles Content')).toBeInTheDocument()
  })

  it('should not render children when user does not have allowed role', () => {
    mockUseAuth.mockReturnValue({ profile: mockSalesProfile })

    render(
      <RoleGate allowed={['admin']}>
        <div>Admin Only Content</div>
      </RoleGate>
    )

    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument()
  })

  it('should render fallback when user does not have allowed role', () => {
    mockUseAuth.mockReturnValue({ profile: mockSalesProfile })

    render(
      <RoleGate allowed={['admin']} fallback={<div>Access Denied</div>}>
        <div>Admin Only Content</div>
      </RoleGate>
    )

    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument()
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('should render nothing when no fallback provided and access denied', () => {
    mockUseAuth.mockReturnValue({ profile: mockSalesProfile })

    const { container } = render(
      <RoleGate allowed={['admin']}>
        <div>Admin Only Content</div>
      </RoleGate>
    )

    expect(container.textContent).toBe('')
  })

  it('should not render children when profile is null', () => {
    mockUseAuth.mockReturnValue({ profile: null })

    render(
      <RoleGate allowed={['admin', 'sales', 'support', 'ops']}>
        <div>Protected Content</div>
      </RoleGate>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should render fallback when profile is null', () => {
    mockUseAuth.mockReturnValue({ profile: null })

    render(
      <RoleGate allowed={['admin']} fallback={<div>Please log in</div>}>
        <div>Protected Content</div>
      </RoleGate>
    )

    expect(screen.getByText('Please log in')).toBeInTheDocument()
  })

  describe('role combinations', () => {
    it('should allow admin access to admin-only content', () => {
      mockUseAuth.mockReturnValue({ profile: mockAdminProfile })

      render(
        <RoleGate allowed={['admin']}>
          <div>Admin Content</div>
        </RoleGate>
      )

      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })

    it('should allow support access to support and ops content', () => {
      mockUseAuth.mockReturnValue({ profile: mockSupportProfile })

      render(
        <RoleGate allowed={['support', 'ops']}>
          <div>Support/Ops Content</div>
        </RoleGate>
      )

      expect(screen.getByText('Support/Ops Content')).toBeInTheDocument()
    })

    it('should allow ops access to ops content', () => {
      mockUseAuth.mockReturnValue({ profile: mockOpsProfile })

      render(
        <RoleGate allowed={['ops']}>
          <div>Ops Content</div>
        </RoleGate>
      )

      expect(screen.getByText('Ops Content')).toBeInTheDocument()
    })

    it('should deny sales access to admin-only content', () => {
      mockUseAuth.mockReturnValue({ profile: mockSalesProfile })

      render(
        <RoleGate allowed={['admin']}>
          <div>Admin Content</div>
        </RoleGate>
      )

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })

    it('should allow all roles when all are specified', () => {
      mockUseAuth.mockReturnValue({ profile: mockSalesProfile })

      render(
        <RoleGate allowed={['admin', 'sales', 'support', 'ops']}>
          <div>Everyone Content</div>
        </RoleGate>
      )

      expect(screen.getByText('Everyone Content')).toBeInTheDocument()
    })
  })

  describe('complex children', () => {
    it('should render multiple children', () => {
      mockUseAuth.mockReturnValue({ profile: mockAdminProfile })

      render(
        <RoleGate allowed={['admin']}>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </RoleGate>
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
      expect(screen.getByText('Child 3')).toBeInTheDocument()
    })

    it('should render nested components', () => {
      mockUseAuth.mockReturnValue({ profile: mockAdminProfile })

      render(
        <RoleGate allowed={['admin']}>
          <div>
            <span>Nested</span>
            <button>Click Me</button>
          </div>
        </RoleGate>
      )

      expect(screen.getByText('Nested')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument()
    })
  })
})
