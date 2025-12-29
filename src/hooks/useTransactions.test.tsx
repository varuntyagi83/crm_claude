import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useMerchantTransactions,
  useMerchantVolume,
  useTotalVolume,
  useFailedRate,
  useDailyVolume,
} from './useTransactions'
import { transactionsApi } from '@/lib/api/transactions'

vi.mock('@/lib/api/transactions', () => ({
  transactionsApi: {
    listByMerchant: vi.fn(),
    getVolumeByMerchant: vi.fn(),
    getTotalVolume: vi.fn(),
    getFailedRate: vi.fn(),
    getDailyVolume: vi.fn(),
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

describe('useTransactions hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useMerchantTransactions', () => {
    it('should fetch transactions for a merchant', async () => {
      const mockTransactions = [
        { id: 't1', merchant_id: 'm1', amount_cents: 10000, status: 'completed' },
        { id: 't2', merchant_id: 'm1', amount_cents: 5000, status: 'completed' },
      ]
      vi.mocked(transactionsApi.listByMerchant).mockResolvedValue(mockTransactions)

      const params = { merchantId: 'm1' }
      const { result } = renderHook(() => useMerchantTransactions(params), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(transactionsApi.listByMerchant).toHaveBeenCalledWith(params)
      expect(result.current.data).toEqual(mockTransactions)
    })

    it('should pass all filter parameters to API', async () => {
      vi.mocked(transactionsApi.listByMerchant).mockResolvedValue([])

      const params = {
        merchantId: 'm1',
        status: 'completed',
        type: 'payment',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 50,
      }

      const { result } = renderHook(() => useMerchantTransactions(params), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(transactionsApi.listByMerchant).toHaveBeenCalledWith(params)
    })

    it('should not fetch when merchantId is not provided', async () => {
      const params = { merchantId: '' }
      const { result } = renderHook(() => useMerchantTransactions(params), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(transactionsApi.listByMerchant).not.toHaveBeenCalled()
    })

    it('should handle error state', async () => {
      vi.mocked(transactionsApi.listByMerchant).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useMerchantTransactions({ merchantId: 'm1' }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useMerchantVolume', () => {
    it('should fetch volume for a merchant', async () => {
      const mockVolume = { total: 150000, transactions: [] }
      vi.mocked(transactionsApi.getVolumeByMerchant).mockResolvedValue(mockVolume)

      const { result } = renderHook(() => useMerchantVolume('m1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(transactionsApi.getVolumeByMerchant).toHaveBeenCalledWith('m1', 30)
      expect(result.current.data).toEqual(mockVolume)
    })

    it('should use custom days parameter', async () => {
      vi.mocked(transactionsApi.getVolumeByMerchant).mockResolvedValue({ total: 0, transactions: [] })

      const { result } = renderHook(() => useMerchantVolume('m1', 7), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(transactionsApi.getVolumeByMerchant).toHaveBeenCalledWith('m1', 7)
    })

    it('should not fetch when merchantId is undefined', async () => {
      const { result } = renderHook(() => useMerchantVolume(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(transactionsApi.getVolumeByMerchant).not.toHaveBeenCalled()
    })

    it('should handle error state', async () => {
      vi.mocked(transactionsApi.getVolumeByMerchant).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useMerchantVolume('m1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useTotalVolume', () => {
    it('should fetch total volume', async () => {
      vi.mocked(transactionsApi.getTotalVolume).mockResolvedValue(5000000)

      const { result } = renderHook(() => useTotalVolume(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(transactionsApi.getTotalVolume).toHaveBeenCalledWith(30)
      expect(result.current.data).toBe(5000000)
    })

    it('should use custom days parameter', async () => {
      vi.mocked(transactionsApi.getTotalVolume).mockResolvedValue(1000000)

      const { result } = renderHook(() => useTotalVolume(7), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(transactionsApi.getTotalVolume).toHaveBeenCalledWith(7)
    })

    it('should handle error state', async () => {
      vi.mocked(transactionsApi.getTotalVolume).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useTotalVolume(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useFailedRate', () => {
    it('should fetch failed rate', async () => {
      vi.mocked(transactionsApi.getFailedRate).mockResolvedValue(2.5)

      const { result } = renderHook(() => useFailedRate(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(transactionsApi.getFailedRate).toHaveBeenCalledWith(30)
      expect(result.current.data).toBe(2.5)
    })

    it('should use custom days parameter', async () => {
      vi.mocked(transactionsApi.getFailedRate).mockResolvedValue(1.5)

      const { result } = renderHook(() => useFailedRate(7), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(transactionsApi.getFailedRate).toHaveBeenCalledWith(7)
    })

    it('should handle error state', async () => {
      vi.mocked(transactionsApi.getFailedRate).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useFailedRate(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useDailyVolume', () => {
    it('should fetch daily volume', async () => {
      const mockDailyVolume = [
        { date: '2024-01-01', amount: 1000 },
        { date: '2024-01-02', amount: 1500 },
      ]
      vi.mocked(transactionsApi.getDailyVolume).mockResolvedValue(mockDailyVolume)

      const { result } = renderHook(() => useDailyVolume(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(transactionsApi.getDailyVolume).toHaveBeenCalledWith(30)
      expect(result.current.data).toEqual(mockDailyVolume)
    })

    it('should use custom days parameter', async () => {
      vi.mocked(transactionsApi.getDailyVolume).mockResolvedValue([])

      const { result } = renderHook(() => useDailyVolume(7), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(transactionsApi.getDailyVolume).toHaveBeenCalledWith(7)
    })

    it('should handle error state', async () => {
      vi.mocked(transactionsApi.getDailyVolume).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useDailyVolume(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })
})
