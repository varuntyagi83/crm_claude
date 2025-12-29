import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useTickets,
  useTicket,
  useMerchantTickets,
  useCreateTicket,
  useUpdateTicket,
  useTicketCounts,
} from './useTickets'
import { ticketsApi } from '@/lib/api/tickets'

vi.mock('@/lib/api/tickets', () => ({
  ticketsApi: {
    list: vi.fn(),
    getById: vi.fn(),
    listByMerchant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    countOpen: vi.fn(),
    countByPriority: vi.fn(),
    countUnassigned: vi.fn(),
    countAssignedTo: vi.fn(),
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

describe('useTickets hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useTickets', () => {
    it('should fetch tickets with default parameters', async () => {
      const mockTickets = [
        { id: 't1', subject: 'Ticket 1', status: 'open' },
        { id: 't2', subject: 'Ticket 2', status: 'in_progress' },
      ]
      vi.mocked(ticketsApi.list).mockResolvedValue(mockTickets)

      const { result } = renderHook(() => useTickets(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(ticketsApi.list).toHaveBeenCalledWith({})
      expect(result.current.data).toEqual(mockTickets)
    })

    it('should pass filter parameters to API', async () => {
      vi.mocked(ticketsApi.list).mockResolvedValue([])

      const params = { status: 'open' as const, priority: 'urgent' as const }
      const { result } = renderHook(() => useTickets(params), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(ticketsApi.list).toHaveBeenCalledWith(params)
    })

    it('should handle error state', async () => {
      vi.mocked(ticketsApi.list).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useTickets(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useTicket', () => {
    it('should fetch a single ticket by id', async () => {
      const mockTicket = { id: 't1', subject: 'Test Ticket', status: 'open' }
      vi.mocked(ticketsApi.getById).mockResolvedValue(mockTicket)

      const { result } = renderHook(() => useTicket('t1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(ticketsApi.getById).toHaveBeenCalledWith('t1')
      expect(result.current.data).toEqual(mockTicket)
    })

    it('should not fetch when id is undefined', async () => {
      const { result } = renderHook(() => useTicket(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(ticketsApi.getById).not.toHaveBeenCalled()
    })
  })

  describe('useMerchantTickets', () => {
    it('should fetch tickets for a merchant', async () => {
      const mockTickets = [{ id: 't1', subject: 'Merchant Ticket', merchant_id: 'm1' }]
      vi.mocked(ticketsApi.listByMerchant).mockResolvedValue(mockTickets)

      const { result } = renderHook(() => useMerchantTickets('m1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(ticketsApi.listByMerchant).toHaveBeenCalledWith('m1')
      expect(result.current.data).toEqual(mockTickets)
    })

    it('should not fetch when merchantId is undefined', async () => {
      const { result } = renderHook(() => useMerchantTickets(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(ticketsApi.listByMerchant).not.toHaveBeenCalled()
    })
  })

  describe('useCreateTicket', () => {
    it('should create ticket successfully', async () => {
      const newTicket = {
        id: 't1',
        merchant_id: 'm1',
        subject: 'New Ticket',
        created_by: 'u1',
      }
      vi.mocked(ticketsApi.create).mockResolvedValue(newTicket)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateTicket(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({
        merchant_id: 'm1',
        subject: 'New Ticket',
        created_by: 'u1',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(ticketsApi.create).toHaveBeenCalledWith({
        merchant_id: 'm1',
        subject: 'New Ticket',
        created_by: 'u1',
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tickets'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchant-tickets', 'm1'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ticket-counts'] })
    })

    it('should handle creation error', async () => {
      vi.mocked(ticketsApi.create).mockRejectedValue(new Error('Create failed'))

      const { result } = renderHook(() => useCreateTicket(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        merchant_id: 'm1',
        subject: 'New',
        created_by: 'u1',
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useUpdateTicket', () => {
    it('should update ticket successfully', async () => {
      const updatedTicket = {
        id: 't1',
        merchant_id: 'm1',
        subject: 'Updated',
        status: 'in_progress',
      }
      vi.mocked(ticketsApi.update).mockResolvedValue(updatedTicket)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateTicket(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({ id: 't1', updates: { status: 'in_progress' } })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(ticketsApi.update).toHaveBeenCalledWith('t1', { status: 'in_progress' })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tickets'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ticket', 't1'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchant-tickets', 'm1'] })
    })

    it('should handle update error', async () => {
      vi.mocked(ticketsApi.update).mockRejectedValue(new Error('Update failed'))

      const { result } = renderHook(() => useUpdateTicket(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 't1', updates: {} })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useTicketCounts', () => {
    it('should fetch all ticket counts without userId', async () => {
      vi.mocked(ticketsApi.countOpen).mockResolvedValue(10)
      vi.mocked(ticketsApi.countByPriority).mockResolvedValue(3)
      vi.mocked(ticketsApi.countUnassigned).mockResolvedValue(5)

      const { result } = renderHook(() => useTicketCounts(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual({
        open: 10,
        urgent: 3,
        unassigned: 5,
        assigned: 0,
      })
    })

    it('should fetch assigned count when userId provided', async () => {
      vi.mocked(ticketsApi.countOpen).mockResolvedValue(10)
      vi.mocked(ticketsApi.countByPriority).mockResolvedValue(3)
      vi.mocked(ticketsApi.countUnassigned).mockResolvedValue(5)
      vi.mocked(ticketsApi.countAssignedTo).mockResolvedValue(7)

      const { result } = renderHook(() => useTicketCounts('user-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(ticketsApi.countAssignedTo).toHaveBeenCalledWith('user-1')
      expect(result.current.data).toEqual({
        open: 10,
        urgent: 3,
        unassigned: 5,
        assigned: 7,
      })
    })

    it('should handle count error', async () => {
      vi.mocked(ticketsApi.countOpen).mockRejectedValue(new Error('Count failed'))

      const { result } = renderHook(() => useTicketCounts(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })
})
