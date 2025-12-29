import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useMerchantActivities,
  useTicketActivities,
  useRecentActivities,
  useCreateActivity,
} from './useActivities'
import { activitiesApi } from '@/lib/api/activities'

vi.mock('@/lib/api/activities', () => ({
  activitiesApi: {
    listByMerchant: vi.fn(),
    listByTicket: vi.fn(),
    getRecentByUser: vi.fn(),
    create: vi.fn(),
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

describe('useActivities hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useMerchantActivities', () => {
    it('should fetch activities for a merchant', async () => {
      const mockActivities = [
        { id: 'a1', type: 'note', content: 'Note 1', merchant_id: 'm1' },
        { id: 'a2', type: 'call', content: 'Call 1', merchant_id: 'm1' },
      ]
      vi.mocked(activitiesApi.listByMerchant).mockResolvedValue(mockActivities)

      const { result } = renderHook(() => useMerchantActivities('m1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(activitiesApi.listByMerchant).toHaveBeenCalledWith('m1', 50)
      expect(result.current.data).toEqual(mockActivities)
    })

    it('should use custom limit when provided', async () => {
      vi.mocked(activitiesApi.listByMerchant).mockResolvedValue([])

      const { result } = renderHook(() => useMerchantActivities('m1', 100), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(activitiesApi.listByMerchant).toHaveBeenCalledWith('m1', 100)
    })

    it('should not fetch when merchantId is undefined', async () => {
      const { result } = renderHook(() => useMerchantActivities(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(activitiesApi.listByMerchant).not.toHaveBeenCalled()
    })

    it('should handle error state', async () => {
      vi.mocked(activitiesApi.listByMerchant).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useMerchantActivities('m1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useTicketActivities', () => {
    it('should fetch activities for a ticket', async () => {
      const mockActivities = [
        { id: 'a1', type: 'system', content: 'Ticket created', ticket_id: 't1' },
        { id: 'a2', type: 'note', content: 'Comment', ticket_id: 't1' },
      ]
      vi.mocked(activitiesApi.listByTicket).mockResolvedValue(mockActivities)

      const { result } = renderHook(() => useTicketActivities('t1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(activitiesApi.listByTicket).toHaveBeenCalledWith('t1')
      expect(result.current.data).toEqual(mockActivities)
    })

    it('should not fetch when ticketId is undefined', async () => {
      const { result } = renderHook(() => useTicketActivities(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(activitiesApi.listByTicket).not.toHaveBeenCalled()
    })

    it('should handle error state', async () => {
      vi.mocked(activitiesApi.listByTicket).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useTicketActivities('t1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useRecentActivities', () => {
    it('should fetch recent activities for a user', async () => {
      const mockActivities = [
        { id: 'a1', type: 'note', content: 'Recent note', created_by: 'u1' },
      ]
      vi.mocked(activitiesApi.getRecentByUser).mockResolvedValue(mockActivities)

      const { result } = renderHook(() => useRecentActivities('u1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(activitiesApi.getRecentByUser).toHaveBeenCalledWith('u1', 10)
      expect(result.current.data).toEqual(mockActivities)
    })

    it('should use custom limit when provided', async () => {
      vi.mocked(activitiesApi.getRecentByUser).mockResolvedValue([])

      const { result } = renderHook(() => useRecentActivities('u1', 20), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(activitiesApi.getRecentByUser).toHaveBeenCalledWith('u1', 20)
    })

    it('should not fetch when userId is undefined', async () => {
      const { result } = renderHook(() => useRecentActivities(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(activitiesApi.getRecentByUser).not.toHaveBeenCalled()
    })
  })

  describe('useCreateActivity', () => {
    it('should create activity successfully', async () => {
      const newActivity = {
        id: 'a1',
        merchant_id: 'm1',
        type: 'note',
        content: 'New note',
        created_by: 'u1',
      }
      vi.mocked(activitiesApi.create).mockResolvedValue(newActivity)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateActivity(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({
        merchant_id: 'm1',
        type: 'note',
        content: 'New note',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(activitiesApi.create).toHaveBeenCalledWith({
        merchant_id: 'm1',
        type: 'note',
        content: 'New note',
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchant-activities', 'm1'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recent-activities'] })
    })

    it('should invalidate ticket activities when ticket_id is provided', async () => {
      const newActivity = {
        id: 'a1',
        merchant_id: 'm1',
        ticket_id: 't1',
        type: 'note',
        content: 'Ticket note',
        created_by: 'u1',
      }
      vi.mocked(activitiesApi.create).mockResolvedValue(newActivity)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateActivity(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({
        merchant_id: 'm1',
        ticket_id: 't1',
        type: 'note',
        content: 'Ticket note',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ticket-activities', 't1'] })
    })

    it('should handle creation error', async () => {
      vi.mocked(activitiesApi.create).mockRejectedValue(new Error('Create failed'))

      const { result } = renderHook(() => useCreateActivity(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        merchant_id: 'm1',
        type: 'note',
        content: 'Test',
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })
})
