import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

// Test component that uses the auth hook
function TestComponent() {
  const { user, profile, loading, isRole, signIn, signOut } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div data-testid="user">{user?.email || 'No user'}</div>
      <div data-testid="profile">{profile?.full_name || 'No profile'}</div>
      <div data-testid="is-admin">{isRole('admin') ? 'Yes' : 'No'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        const TestWithoutProvider = () => {
          useAuth()
          return null
        }
        render(<TestWithoutProvider />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('AuthProvider', () => {
    it('should show loading state initially', async () => {
      vi.mocked(supabase.auth.getSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves to keep loading
      )

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should set user to null when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('user')).toHaveTextContent('No user')
      expect(screen.getByTestId('profile')).toHaveTextContent('No profile')
    })

    it('should fetch profile when session exists', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'admin',
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      } as any)

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      } as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      expect(screen.getByTestId('profile')).toHaveTextContent('Test User')
      expect(screen.getByTestId('is-admin')).toHaveTextContent('Yes')
    })

    it('should handle profile fetch error gracefully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      } as any)

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('profile')).toHaveTextContent('No profile')
      consoleSpy.mockRestore()
    })

    it('should call signInWithPassword on signIn', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any)
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {},
        error: null,
      } as any)

      const user = userEvent.setup()

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      await user.click(screen.getByText('Sign In'))

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      })
    })

    it('should throw error on signIn failure', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any)
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {},
        error: { message: 'Invalid credentials' },
      } as any)

      let caughtError: Error | null = null

      function TestWithErrorBoundary() {
        const { signIn, loading } = useAuth()

        const handleSignIn = async () => {
          try {
            await signIn('test@example.com', 'wrong-password')
          } catch (error) {
            caughtError = error as Error
          }
        }

        if (loading) return <div>Loading...</div>

        return <button onClick={handleSignIn}>Sign In</button>
      }

      const user = userEvent.setup()

      render(
        <AuthProvider>
          <TestWithErrorBoundary />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      await user.click(screen.getByText('Sign In'))

      expect(caughtError).toEqual({ message: 'Invalid credentials' })
    })

    it('should call signOut and clear state', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockProfile = { id: 'user-1', full_name: 'Test', role: 'sales' }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      } as any)
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any)
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      } as any)

      const user = userEvent.setup()

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      await user.click(screen.getByText('Sign Out'))

      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should throw error on signOut failure', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any)
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { message: 'Sign out failed' },
      } as any)

      let caughtError: Error | null = null

      function TestWithErrorBoundary() {
        const { signOut, loading } = useAuth()

        const handleSignOut = async () => {
          try {
            await signOut()
          } catch (error) {
            caughtError = error as Error
          }
        }

        if (loading) return <div>Loading...</div>

        return <button onClick={handleSignOut}>Sign Out</button>
      }

      const user = userEvent.setup()

      render(
        <AuthProvider>
          <TestWithErrorBoundary />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      await user.click(screen.getByText('Sign Out'))

      expect(caughtError).toEqual({ message: 'Sign out failed' })
    })

    it('should return false from isRole when no profile', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      expect(screen.getByTestId('is-admin')).toHaveTextContent('No')
    })

    it('should check multiple roles with isRole', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockProfile = { id: 'user-1', full_name: 'Test', role: 'support' }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      } as any)
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      } as any)

      function MultiRoleTest() {
        const { isRole, loading } = useAuth()

        if (loading) return <div>Loading...</div>

        return (
          <div>
            <div data-testid="is-support-or-admin">
              {isRole('support', 'admin') ? 'Yes' : 'No'}
            </div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <MultiRoleTest />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-support-or-admin')).toHaveTextContent('Yes')
      })
    })

    it('should handle auth state change with sign in', async () => {
      let authStateCallback: ((event: string, session: any) => void) | null = null

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any)

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: vi.fn() } } } as any
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
      })

      // Simulate auth state change
      const mockUser = { id: 'user-2', email: 'new@example.com' }
      const mockProfile = { id: 'user-2', full_name: 'New User', role: 'sales' }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      } as any)

      if (authStateCallback) {
        authStateCallback('SIGNED_IN', { user: mockUser })
      }

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('new@example.com')
      })
    })

    it('should handle auth state change with sign out', async () => {
      let authStateCallback: ((event: string, session: any) => void) | null = null

      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockProfile = { id: 'user-1', full_name: 'Test', role: 'sales' }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      } as any)

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: vi.fn() } } } as any
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      } as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      // Simulate sign out
      if (authStateCallback) {
        authStateCallback('SIGNED_OUT', null)
      }

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
      })
    })

    it('should cleanup subscription on unmount', async () => {
      const unsubscribeMock = vi.fn()

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any)

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } },
      } as any)

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })
})
