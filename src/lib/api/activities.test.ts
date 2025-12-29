import { describe, it, expect, vi, beforeEach } from 'vitest'
import { activitiesApi } from './activities'
import { supabase } from '../supabase'

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

describe('activitiesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listByMerchant', () => {
    it('should fetch activities for a merchant', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      const result = await activitiesApi.listByMerchant('m1')

      expect(supabase.from).toHaveBeenCalledWith('activities')
      expect(result).toEqual([])
    })

    it('should use custom limit', async () => {
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: limitMock,
      } as any)

      await activitiesApi.listByMerchant('m1', 100)

      expect(limitMock).toHaveBeenCalledWith(100)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(activitiesApi.listByMerchant('m1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('listByTicket', () => {
    it('should fetch activities for a ticket', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      const result = await activitiesApi.listByTicket('t1')

      expect(supabase.from).toHaveBeenCalledWith('activities')
      expect(result).toEqual([])
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(activitiesApi.listByTicket('t1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('create', () => {
    it('should create a new activity', async () => {
      // Activity without created_by to avoid profile fetch
      const mockActivity = {
        id: 'a1',
        merchant_id: 'm1',
        type: 'note',
        content: 'Test note',
        created_by: null,
      }

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      } as any)

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockActivity, error: null }),
      } as any)

      const result = await activitiesApi.create({
        merchant_id: 'm1',
        type: 'note',
        content: 'Test note',
      })

      expect(result).toMatchObject({ id: 'a1', content: 'Test note' })
    })

    it('should use performed_by if provided', async () => {
      const insertMock = vi.fn().mockReturnThis()
      // Return activity without created_by to avoid profile fetch
      const mockActivity = { id: 'a1', merchant_id: 'm1', type: 'note', content: 'Test', created_by: null }

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      } as any)

      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockActivity, error: null }),
      } as any)

      await activitiesApi.create({
        merchant_id: 'm1',
        type: 'note',
        content: 'Test',
        performed_by: 'u2',
      })

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ created_by: 'u2' })
      )
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      } as any)

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(
        activitiesApi.create({
          merchant_id: 'm1',
          type: 'note',
          content: 'Test',
        })
      ).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('getRecentByUser', () => {
    it('should fetch recent activities for user', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      const result = await activitiesApi.getRecentByUser('u1')

      expect(result).toEqual([])
    })

    it('should use custom limit', async () => {
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: limitMock,
      } as any)

      await activitiesApi.getRecentByUser('u1', 20)

      expect(limitMock).toHaveBeenCalledWith(20)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(activitiesApi.getRecentByUser('u1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('countByMerchant', () => {
    it('should return count of activities for merchant', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 10, error: null }),
      } as any)

      const result = await activitiesApi.countByMerchant('m1')

      expect(result).toBe(10)
    })

    it('should use custom days parameter', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
      } as any)

      const result = await activitiesApi.countByMerchant('m1', 30)

      expect(result).toBe(5)
    })

    it('should return 0 when count is null', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: null, error: null }),
      } as any)

      const result = await activitiesApi.countByMerchant('m1')

      expect(result).toBe(0)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      } as any)

      await expect(activitiesApi.countByMerchant('m1')).rejects.toEqual({ message: 'Error' })
    })
  })
})
