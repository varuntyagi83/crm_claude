import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketsApi, type ListTicketsParams } from '@/lib/api/tickets'
import type { SupportTicket } from '@/types/database'

export function useTickets(params: ListTicketsParams = {}) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketsApi.list(params),
    staleTime: 30000,
  })
}

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getById(id!),
    enabled: !!id,
    staleTime: 30000,
  })
}

export function useMerchantTickets(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['merchant-tickets', merchantId],
    queryFn: () => ticketsApi.listByMerchant(merchantId!),
    enabled: !!merchantId,
    staleTime: 30000,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ticket: { merchant_id: string; subject: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'urgent'; category?: string; status?: 'open' | 'in_progress' | 'waiting_on_merchant' | 'resolved' | 'closed'; created_by: string; assigned_to?: string | null }) =>
      ticketsApi.create(ticket),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['merchant-tickets', data.merchant_id] })
      queryClient.invalidateQueries({ queryKey: ['ticket-counts'] })
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SupportTicket> }) =>
      ticketsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] })
      queryClient.invalidateQueries({ queryKey: ['merchant-tickets', data.merchant_id] })
      queryClient.invalidateQueries({ queryKey: ['ticket-counts'] })
    },
  })
}

export function useTicketCounts(userId?: string) {
  return useQuery({
    queryKey: ['ticket-counts', userId],
    queryFn: async () => {
      const [open, urgent, unassigned, assigned] = await Promise.all([
        ticketsApi.countOpen(),
        ticketsApi.countByPriority('urgent'),
        ticketsApi.countUnassigned(),
        userId ? ticketsApi.countAssignedTo(userId) : Promise.resolve(0),
      ])
      return { open, urgent, unassigned, assigned }
    },
    staleTime: 30000,
  })
}
