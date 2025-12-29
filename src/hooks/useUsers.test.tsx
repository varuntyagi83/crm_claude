import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useUsers, useUser, useUpdateUser } from './useUsers'
import { usersApi } from '@/lib/api/users'

vi.mock('@/lib/api/users', () => ({
  usersApi: {
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useUsers hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useUsers', () => {
    it('should fetch all users', async () => {
      const mockUsers = [
        { id: 'u1', email: 'user1@example.com', full_name: 'User 1', role: 'sales' },
        { id: 'u2', email: 'user2@example.com', full_name: 'User 2', role: 'support' },
      ]
      vi.mocked(usersApi.list).mockResolvedValue(mockUsers)

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(usersApi.list).toHaveBeenCalled()
      expect(result.current.data).toEqual(mockUsers)
    })

    it('should handle error state', async () => {
      vi.mocked(usersApi.list).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useUser', () => {
    it('should fetch a single user by id', async () => {
      const mockUser = { id: 'u1', email: 'user1@example.com', full_name: 'User 1', role: 'sales' }
      vi.mocked(usersApi.getById).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useUser('u1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(usersApi.getById).toHaveBeenCalledWith('u1')
      expect(result.current.data).toEqual(mockUser)
    })

    it('should not fetch when id is undefined', async () => {
      const { result } = renderHook(() => useUser(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(usersApi.getById).not.toHaveBeenCalled()
    })

    it('should handle error state', async () => {
      vi.mocked(usersApi.getById).mockRejectedValue(new Error('Not found'))

      const { result } = renderHook(() => useUser('invalid-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useUpdateUser', () => {
    it('should update user successfully', async () => {
      const updatedUser = { id: 'u1', email: 'user1@example.com', full_name: 'Updated Name', role: 'admin' }
      vi.mocked(usersApi.update).mockResolvedValue(updatedUser)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({ id: 'u1', updates: { full_name: 'Updated Name', role: 'admin' } })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(usersApi.update).toHaveBeenCalledWith('u1', { full_name: 'Updated Name', role: 'admin' })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 'u1'] })
    })

    it('should handle update with partial data', async () => {
      const updatedUser = { id: 'u1', email: 'user1@example.com', full_name: 'Just Name', role: 'sales' }
      vi.mocked(usersApi.update).mockResolvedValue(updatedUser)

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 'u1', updates: { full_name: 'Just Name' } })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(usersApi.update).toHaveBeenCalledWith('u1', { full_name: 'Just Name' })
    })

    it('should handle update error', async () => {
      vi.mocked(usersApi.update).mockRejectedValue(new Error('Update failed'))

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 'u1', updates: { full_name: 'Test' } })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })
})
