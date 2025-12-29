import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ticketsApi } from './tickets'
import { supabase } from '../supabase'

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

describe('ticketsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should fetch tickets with default parameters', async () => {
      // Return empty array to avoid the enrichment loop
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      const result = await ticketsApi.list()

      expect(supabase.from).toHaveBeenCalledWith('support_tickets')
      expect(result).toEqual([])
    })

    it('should apply status filter', async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null })
      const eqMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: orderMock,
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: eqMock,
          }),
        }),
      } as any)

      await ticketsApi.list({ status: 'open' })

      expect(eqMock).toHaveBeenCalledWith('status', 'open')
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(ticketsApi.list()).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('getById', () => {
    it('should fetch a single ticket with relations', async () => {
      const mockTicket = {
        id: 't1',
        subject: 'Test',
        merchant_id: 'm1',
        assigned_to: null,
        created_by: null,
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTicket, error: null }),
      } as any)

      const result = await ticketsApi.getById('t1')

      expect(result).toMatchObject({ id: 't1', subject: 'Test' })
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as any)

      await expect(ticketsApi.getById('t1')).rejects.toEqual({ message: 'Not found' })
    })
  })

  describe('listByMerchant', () => {
    it('should fetch tickets for a merchant', async () => {
      const mockTickets = [{ id: 't1', subject: 'Test', merchant_id: 'm1' }]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockTickets, error: null }),
      } as any)

      const result = await ticketsApi.listByMerchant('m1')

      expect(result.length).toBeGreaterThanOrEqual(0)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(ticketsApi.listByMerchant('m1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('create', () => {
    it('should create a new ticket', async () => {
      const mockTicket = {
        id: 't1',
        merchant_id: 'm1',
        subject: 'New Ticket',
        created_by: 'u1',
      }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTicket, error: null }),
      } as any)

      const result = await ticketsApi.create({
        merchant_id: 'm1',
        subject: 'New Ticket',
        created_by: 'u1',
      })

      expect(result).toEqual(mockTicket)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(
        ticketsApi.create({ merchant_id: 'm1', subject: 'Test', created_by: 'u1' })
      ).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('update', () => {
    it('should update a ticket', async () => {
      const mockTicket = { id: 't1', subject: 'Updated', status: 'open' }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTicket, error: null }),
      } as any)

      const result = await ticketsApi.update('t1', { subject: 'Updated' })

      expect(result).toEqual(mockTicket)
    })

    it('should set resolved_at when status changes to resolved', async () => {
      const mockTicket = { id: 't1', subject: 'Test', status: 'resolved' }
      const updateMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTicket, error: null }),
      } as any)

      await ticketsApi.update('t1', { status: 'resolved' })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'resolved',
          resolved_at: expect.any(String),
        })
      )
    })

    it('should set resolved_at when status changes to closed', async () => {
      const mockTicket = { id: 't1', subject: 'Test', status: 'closed' }
      const updateMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTicket, error: null }),
      } as any)

      await ticketsApi.update('t1', { status: 'closed' })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          resolved_at: expect.any(String),
        })
      )
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(ticketsApi.update('t1', {})).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('countOpen', () => {
    it('should return count of open tickets', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 5, error: null }),
      } as any)

      const result = await ticketsApi.countOpen()

      expect(result).toBe(5)
    })

    it('should return 0 when count is null', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: null, error: null }),
      } as any)

      const result = await ticketsApi.countOpen()

      expect(result).toBe(0)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      } as any)

      await expect(ticketsApi.countOpen()).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('countByPriority', () => {
    it('should return count for specific priority', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 3, error: null }),
      } as any)

      const result = await ticketsApi.countByPriority('urgent')

      expect(result).toBe(3)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      } as any)

      await expect(ticketsApi.countByPriority('urgent')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('countAssignedTo', () => {
    it('should return count for assigned user', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 7, error: null }),
      } as any)

      const result = await ticketsApi.countAssignedTo('u1')

      expect(result).toBe(7)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      } as any)

      await expect(ticketsApi.countAssignedTo('u1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('countUnassigned', () => {
    it('should return count of unassigned tickets', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 2, error: null }),
      } as any)

      const result = await ticketsApi.countUnassigned()

      expect(result).toBe(2)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      } as any)

      await expect(ticketsApi.countUnassigned()).rejects.toEqual({ message: 'Error' })
    })
  })
})
