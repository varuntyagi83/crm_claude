import { describe, it, expect, vi, beforeEach } from 'vitest'
import { merchantsApi } from './merchants'
import { supabase } from '../supabase'

vi.mock('../supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

describe('merchantsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('search', () => {
    it('should call rpc with default parameters', async () => {
      const mockData = [{ id: '1', name: 'Test Merchant' }]
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null })

      const result = await merchantsApi.search()

      expect(supabase.rpc).toHaveBeenCalledWith('search_merchants', {
        p_limit: 50,
        p_offset: 0,
        p_query: null,
        p_status: null,
        p_assigned_to: null,
      })
      expect(result).toEqual(mockData)
    })

    it('should pass query parameter when provided', async () => {
      const mockData = [{ id: '1', name: 'Test Merchant' }]
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null })

      await merchantsApi.search({ query: 'test' })

      expect(supabase.rpc).toHaveBeenCalledWith('search_merchants', expect.objectContaining({
        p_query: 'test',
      }))
    })

    it('should pass status parameter when provided', async () => {
      const mockData = [{ id: '1', name: 'Test Merchant' }]
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null })

      await merchantsApi.search({ status: 'active' })

      expect(supabase.rpc).toHaveBeenCalledWith('search_merchants', expect.objectContaining({
        p_status: 'active',
      }))
    })

    it('should pass assignedTo parameter when provided', async () => {
      const mockData = [{ id: '1', name: 'Test Merchant' }]
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null })

      await merchantsApi.search({ assignedTo: 'user-1' })

      expect(supabase.rpc).toHaveBeenCalledWith('search_merchants', expect.objectContaining({
        p_assigned_to: 'user-1',
      }))
    })

    it('should pass limit and offset when provided', async () => {
      const mockData = [{ id: '1', name: 'Test Merchant' }]
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null })

      await merchantsApi.search({ limit: 10, offset: 20 })

      expect(supabase.rpc).toHaveBeenCalledWith('search_merchants', expect.objectContaining({
        p_limit: 10,
        p_offset: 20,
      }))
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Error' } })

      await expect(merchantsApi.search()).rejects.toEqual({ message: 'Error' })
    })

    it('should handle empty query string', async () => {
      const mockData = [{ id: '1', name: 'Test Merchant' }]
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null })

      await merchantsApi.search({ query: '  ' })

      expect(supabase.rpc).toHaveBeenCalledWith('search_merchants', expect.objectContaining({
        p_query: null,
      }))
    })
  })

  describe('getById', () => {
    it('should fetch merchant with related data', async () => {
      const mockMerchant = {
        id: '1',
        name: 'Test Merchant',
        assigned_sales_rep: 'sales-1',
        assigned_support_rep: 'support-1',
      }
      const mockSalesRep = { id: 'sales-1', full_name: 'Sales Rep' }
      const mockSupportRep = { id: 'support-1', full_name: 'Support Rep' }
      const mockContacts = [{ id: 'contact-1', name: 'Contact 1' }]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: mockMerchant, error: null })
          .mockResolvedValueOnce({ data: mockSalesRep, error: null })
          .mockResolvedValueOnce({ data: mockSupportRep, error: null }),
      })

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'contacts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue(Promise.resolve({ data: mockContacts, error: null })),
          } as any
        }
        return mockFrom() as any
      })

      const result = await merchantsApi.getById('1')

      expect(result).toMatchObject({
        id: '1',
        name: 'Test Merchant',
      })
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as any)

      await expect(merchantsApi.getById('1')).rejects.toEqual({ message: 'Not found' })
    })
  })

  describe('getSummary', () => {
    it('should call rpc with merchant id', async () => {
      const mockSummary = { total_revenue: 10000 }
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockSummary, error: null })

      const result = await merchantsApi.getSummary('merchant-1')

      expect(supabase.rpc).toHaveBeenCalledWith('get_merchant_summary', {
        p_merchant_id: 'merchant-1',
      })
      expect(result).toEqual(mockSummary)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'Error' } })

      await expect(merchantsApi.getSummary('1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('update', () => {
    it('should update merchant and return data', async () => {
      const mockMerchant = { id: '1', name: 'Updated Merchant' }
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMerchant, error: null }),
      } as any)

      const result = await merchantsApi.update('1', { name: 'Updated Merchant' })

      expect(result).toEqual(mockMerchant)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(merchantsApi.update('1', {})).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('create', () => {
    it('should create merchant and return data', async () => {
      const mockMerchant = { id: '1', name: 'New Merchant', status: 'active' }
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMerchant, error: null }),
      } as any)

      const result = await merchantsApi.create({ name: 'New Merchant', status: 'active' })

      expect(result).toEqual(mockMerchant)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(merchantsApi.create({ name: 'Test', status: 'active' })).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('getAssignedToUser', () => {
    it('should fetch merchants assigned to user', async () => {
      const mockMerchants = [{ id: '1', name: 'Merchant 1' }]
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockMerchants, error: null }),
      } as any)

      const result = await merchantsApi.getAssignedToUser('user-1')

      expect(result).toEqual(mockMerchants)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(merchantsApi.getAssignedToUser('user-1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('getByStatus', () => {
    it('should fetch merchants by status', async () => {
      const mockMerchants = [{ id: '1', name: 'Active Merchant', status: 'active' }]
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockMerchants, error: null }),
      } as any)

      const result = await merchantsApi.getByStatus('active')

      expect(result).toEqual(mockMerchants)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(merchantsApi.getByStatus('active')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('count', () => {
    it('should return total merchant count', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({ count: 10, error: null }),
      } as any)

      const result = await merchantsApi.count()

      expect(result).toBe(10)
    })

    it('should return 0 when count is null', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({ count: null, error: null }),
      } as any)

      const result = await merchantsApi.count()

      expect(result).toBe(0)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      } as any)

      await expect(merchantsApi.count()).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('countByStatus', () => {
    it('should return count for specific status', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      } as any)

      const result = await merchantsApi.countByStatus('active')

      expect(result).toBe(5)
    })

    it('should return 0 when count is null', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: null }),
      } as any)

      const result = await merchantsApi.countByStatus('active')

      expect(result).toBe(0)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      } as any)

      await expect(merchantsApi.countByStatus('active')).rejects.toEqual({ message: 'Error' })
    })
  })
})
