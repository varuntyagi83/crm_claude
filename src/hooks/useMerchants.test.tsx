import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useMerchants,
  useMerchant,
  useMerchantSummary,
  useMyMerchants,
  useUpdateMerchant,
  useCreateMerchant,
  useMerchantCounts,
} from './useMerchants'
import { merchantsApi } from '@/lib/api/merchants'

vi.mock('@/lib/api/merchants', () => ({
  merchantsApi: {
    search: vi.fn(),
    getById: vi.fn(),
    getSummary: vi.fn(),
    getAssignedToUser: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    countByStatus: vi.fn(),
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

describe('useMerchants hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useMerchants', () => {
    it('should fetch merchants with default parameters', async () => {
      const mockMerchants = [
        { id: 'm1', name: 'Merchant 1', status: 'active' },
        { id: 'm2', name: 'Merchant 2', status: 'active' },
      ]
      vi.mocked(merchantsApi.search).mockResolvedValue(mockMerchants)

      const { result } = renderHook(() => useMerchants(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(merchantsApi.search).toHaveBeenCalledWith({})
      expect(result.current.data).toEqual(mockMerchants)
    })

    it('should pass search parameters to API', async () => {
      vi.mocked(merchantsApi.search).mockResolvedValue([])

      const params = { query: 'test', status: 'active' as const, limit: 10 }
      const { result } = renderHook(() => useMerchants(params), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(merchantsApi.search).toHaveBeenCalledWith(params)
    })

    it('should handle error state', async () => {
      vi.mocked(merchantsApi.search).mockRejectedValue(new Error('Failed to fetch'))

      const { result } = renderHook(() => useMerchants(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe('useMerchant', () => {
    it('should fetch a single merchant by id', async () => {
      const mockMerchant = { id: 'm1', name: 'Merchant 1', status: 'active' }
      vi.mocked(merchantsApi.getById).mockResolvedValue(mockMerchant)

      const { result } = renderHook(() => useMerchant('m1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(merchantsApi.getById).toHaveBeenCalledWith('m1')
      expect(result.current.data).toEqual(mockMerchant)
    })

    it('should not fetch when id is undefined', async () => {
      const { result } = renderHook(() => useMerchant(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(merchantsApi.getById).not.toHaveBeenCalled()
    })

    it('should handle error state', async () => {
      vi.mocked(merchantsApi.getById).mockRejectedValue(new Error('Not found'))

      const { result } = renderHook(() => useMerchant('invalid-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useMerchantSummary', () => {
    it('should fetch merchant summary', async () => {
      const mockSummary = { total_revenue: 10000, transaction_count: 100 }
      vi.mocked(merchantsApi.getSummary).mockResolvedValue(mockSummary)

      const { result } = renderHook(() => useMerchantSummary('m1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(merchantsApi.getSummary).toHaveBeenCalledWith('m1')
      expect(result.current.data).toEqual(mockSummary)
    })

    it('should not fetch when id is undefined', async () => {
      const { result } = renderHook(() => useMerchantSummary(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(merchantsApi.getSummary).not.toHaveBeenCalled()
    })
  })

  describe('useMyMerchants', () => {
    it('should fetch merchants assigned to user', async () => {
      const mockMerchants = [{ id: 'm1', name: 'My Merchant', status: 'active' }]
      vi.mocked(merchantsApi.getAssignedToUser).mockResolvedValue(mockMerchants)

      const { result } = renderHook(() => useMyMerchants('user-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(merchantsApi.getAssignedToUser).toHaveBeenCalledWith('user-1')
      expect(result.current.data).toEqual(mockMerchants)
    })

    it('should not fetch when userId is undefined', async () => {
      const { result } = renderHook(() => useMyMerchants(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(merchantsApi.getAssignedToUser).not.toHaveBeenCalled()
    })
  })

  describe('useUpdateMerchant', () => {
    it('should update merchant successfully', async () => {
      const updatedMerchant = { id: 'm1', name: 'Updated', status: 'active' }
      vi.mocked(merchantsApi.update).mockResolvedValue(updatedMerchant)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateMerchant(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({ id: 'm1', updates: { name: 'Updated' } })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(merchantsApi.update).toHaveBeenCalledWith('m1', { name: 'Updated' })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchants'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchant', 'm1'] })
    })

    it('should handle mutation error', async () => {
      vi.mocked(merchantsApi.update).mockRejectedValue(new Error('Update failed'))

      const { result } = renderHook(() => useUpdateMerchant(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 'm1', updates: { name: 'Updated' } })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useCreateMerchant', () => {
    it('should create merchant successfully', async () => {
      const newMerchant = { id: 'm1', name: 'New Merchant', status: 'active' }
      vi.mocked(merchantsApi.create).mockResolvedValue(newMerchant)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateMerchant(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({ name: 'New Merchant', status: 'active' })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(merchantsApi.create).toHaveBeenCalledWith({ name: 'New Merchant', status: 'active' })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchants'] })
    })

    it('should handle creation error', async () => {
      vi.mocked(merchantsApi.create).mockRejectedValue(new Error('Create failed'))

      const { result } = renderHook(() => useCreateMerchant(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ name: 'New', status: 'active' })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useMerchantCounts', () => {
    it('should fetch all merchant counts', async () => {
      vi.mocked(merchantsApi.count).mockResolvedValue(100)
      vi.mocked(merchantsApi.countByStatus).mockImplementation(async (status) => {
        if (status === 'active') return 80
        if (status === 'suspended') return 10
        return 0
      })

      const { result } = renderHook(() => useMerchantCounts(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual({
        total: 100,
        active: 80,
        suspended: 10,
      })
    })

    it('should handle count error', async () => {
      vi.mocked(merchantsApi.count).mockRejectedValue(new Error('Count failed'))

      const { result } = renderHook(() => useMerchantCounts(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })
})
