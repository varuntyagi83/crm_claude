import { describe, it, expect, vi, beforeEach } from 'vitest'
import { transactionsApi } from './transactions'
import { supabase } from '../supabase'

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  },
}))

describe('transactionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listByMerchant', () => {
    it('should fetch transactions for a merchant', async () => {
      const mockTransactions = [
        { id: 't1', merchant_id: 'm1', amount_cents: 10000, status: 'completed' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
      } as any)

      const result = await transactionsApi.listByMerchant({ merchantId: 'm1' })

      expect(supabase.from).toHaveBeenCalledWith('transactions')
      expect(result).toEqual(mockTransactions)
    })

    it('should apply status filter', async () => {
      const eqMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: eqMock,
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await transactionsApi.listByMerchant({ merchantId: 'm1', status: 'completed' })

      expect(eqMock).toHaveBeenCalledWith('status', 'completed')
    })

    it('should apply type filter', async () => {
      const eqMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: eqMock,
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await transactionsApi.listByMerchant({ merchantId: 'm1', type: 'payment' })

      expect(eqMock).toHaveBeenCalledWith('type', 'payment')
    })

    it('should apply date range filters', async () => {
      const gteMock = vi.fn().mockReturnThis()
      const lteMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: gteMock,
        lte: lteMock,
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await transactionsApi.listByMerchant({
        merchantId: 'm1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      })

      expect(gteMock).toHaveBeenCalledWith('processed_at', '2024-01-01')
      expect(lteMock).toHaveBeenCalledWith('processed_at', '2024-01-31')
    })

    it('should apply cursor for pagination', async () => {
      const ltMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        lt: ltMock,
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await transactionsApi.listByMerchant({ merchantId: 'm1', cursor: '2024-01-15' })

      expect(ltMock).toHaveBeenCalledWith('processed_at', '2024-01-15')
    })

    it('should apply custom limit', async () => {
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: limitMock,
      } as any)

      await transactionsApi.listByMerchant({ merchantId: 'm1', limit: 50 })

      expect(limitMock).toHaveBeenCalledWith(50)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(transactionsApi.listByMerchant({ merchantId: 'm1' })).rejects.toEqual({
        message: 'Error',
      })
    })
  })

  describe('getVolumeByMerchant', () => {
    it('should return total volume for merchant', async () => {
      const mockData = [
        { amount_cents: 10000, processed_at: '2024-01-01' },
        { amount_cents: 5000, processed_at: '2024-01-02' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any)

      const result = await transactionsApi.getVolumeByMerchant('m1')

      expect(result.total).toBe(15000)
      expect(result.transactions).toEqual(mockData)
    })

    it('should use custom days parameter', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await transactionsApi.getVolumeByMerchant('m1', 7)

      expect(supabase.from).toHaveBeenCalledWith('transactions')
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(transactionsApi.getVolumeByMerchant('m1')).rejects.toEqual({
        message: 'Error',
      })
    })
  })

  describe('getTotalVolume', () => {
    it('should return total volume across all merchants', async () => {
      const mockData = [{ amount_cents: 10000 }, { amount_cents: 20000 }]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any)

      const result = await transactionsApi.getTotalVolume()

      expect(result).toBe(30000)
    })

    it('should use custom days parameter', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await transactionsApi.getTotalVolume(7)

      expect(supabase.from).toHaveBeenCalledWith('transactions')
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(transactionsApi.getTotalVolume()).rejects.toEqual({
        message: 'Error',
      })
    })
  })

  describe('getFailedRate', () => {
    it('should calculate failed rate correctly', async () => {
      const mockData = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'failed' },
        { status: 'completed' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any)

      const result = await transactionsApi.getFailedRate()

      expect(result).toBe(25) // 1 failed out of 4 = 25%
    })

    it('should return 0 when no transactions', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      const result = await transactionsApi.getFailedRate()

      expect(result).toBe(0)
    })

    it('should use custom days parameter', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await transactionsApi.getFailedRate(7)

      expect(supabase.from).toHaveBeenCalledWith('transactions')
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(transactionsApi.getFailedRate()).rejects.toEqual({
        message: 'Error',
      })
    })
  })

  describe('getDailyVolume', () => {
    it('should return daily volume grouped by date', async () => {
      const mockData = [
        { amount_cents: 10000, processed_at: '2024-01-01T10:00:00Z' },
        { amount_cents: 5000, processed_at: '2024-01-01T15:00:00Z' },
        { amount_cents: 20000, processed_at: '2024-01-02T10:00:00Z' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any)

      const result = await transactionsApi.getDailyVolume()

      expect(result).toEqual([
        { date: '2024-01-01', amount: 150 }, // (10000 + 5000) / 100
        { date: '2024-01-02', amount: 200 }, // 20000 / 100
      ])
    })

    it('should use custom days parameter', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await transactionsApi.getDailyVolume(7)

      expect(supabase.from).toHaveBeenCalledWith('transactions')
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(transactionsApi.getDailyVolume()).rejects.toEqual({
        message: 'Error',
      })
    })
  })
})
