import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import type { Profile, UserRole } from '@/types/database'
import { createProfile } from './factories'

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Mock auth context values
interface MockAuthContextValue {
  user: { id: string; email: string } | null
  profile: Profile | null
  loading: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isRole: (...roles: UserRole[]) => boolean
}

const defaultMockAuth: MockAuthContextValue = {
  user: null,
  profile: null,
  loading: false,
  isLoading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  isRole: () => false,
}

// Create mock auth with a specific role
export const createMockAuth = (role: UserRole, overrides: Partial<MockAuthContextValue> = {}): MockAuthContextValue => {
  const profile = createProfile({ role })
  return {
    user: { id: profile.id, email: profile.email },
    profile,
    loading: false,
    isLoading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    isRole: (...roles: UserRole[]) => roles.includes(role),
    ...overrides,
  }
}

// Auth context mock module
let mockAuthContextValue = defaultMockAuth

export const setMockAuthContext = (value: MockAuthContextValue) => {
  mockAuthContextValue = value
}

export const resetMockAuthContext = () => {
  mockAuthContextValue = defaultMockAuth
}

// Mock AuthProvider component
export const MockAuthProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>
}

// All providers wrapper
interface AllProvidersProps {
  children: ReactNode
  queryClient?: QueryClient
}

const AllProviders = ({ children, queryClient }: AllProvidersProps) => {
  const client = queryClient || createTestQueryClient()

  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Custom render function with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  authContext?: MockAuthContextValue
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } => {
  const { queryClient = createTestQueryClient(), authContext, ...renderOptions } = options

  if (authContext) {
    setMockAuthContext(authContext)
  }

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders queryClient={queryClient}>{children}</AllProviders>
  )

  const result = render(ui, { wrapper: Wrapper, ...renderOptions })

  return {
    ...result,
    queryClient,
  }
}

// Render with just Router
export const renderWithRouter = (ui: ReactElement, options: RenderOptions = {}): RenderResult => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  )
  return render(ui, { wrapper: Wrapper, ...options })
}

// Render with just QueryClient
export const renderWithQueryClient = (
  ui: ReactElement,
  queryClient: QueryClient = createTestQueryClient()
): RenderResult & { queryClient: QueryClient } => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const result = render(ui, { wrapper: Wrapper })
  return { ...result, queryClient }
}

// Hook testing utilities
import { renderHook, type RenderHookResult, type RenderHookOptions } from '@testing-library/react'

export const renderHookWithProviders = <TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps> & { queryClient?: QueryClient }
): RenderHookResult<TResult, TProps> & { queryClient: QueryClient } => {
  const queryClient = options?.queryClient || createTestQueryClient()

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )

  const result = renderHook(hook, { wrapper, ...options })

  return {
    ...result,
    queryClient,
  }
}

// Wait utilities
export const waitForLoadingToFinish = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
