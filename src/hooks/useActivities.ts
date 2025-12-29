import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activitiesApi } from '@/lib/api/activities'
import type { ActivityType } from '@/types/database'

export function useMerchantActivities(merchantId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ['merchant-activities', merchantId, limit],
    queryFn: () => activitiesApi.listByMerchant(merchantId!, limit),
    enabled: !!merchantId,
    staleTime: 30000,
  })
}

export function useTicketActivities(ticketId: string | undefined) {
  return useQuery({
    queryKey: ['ticket-activities', ticketId],
    queryFn: () => activitiesApi.listByTicket(ticketId!),
    enabled: !!ticketId,
    staleTime: 30000,
  })
}

export function useRecentActivities(userId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ['recent-activities', userId, limit],
    queryFn: () => activitiesApi.getRecentByUser(userId!, limit),
    enabled: !!userId,
    staleTime: 30000,
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (activity: {
      merchant_id: string
      type: ActivityType
      content: string
      ticket_id?: string
    }) => activitiesApi.create(activity),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-activities', data.merchant_id] })
      if (data.ticket_id) {
        queryClient.invalidateQueries({ queryKey: ['ticket-activities', data.ticket_id] })
      }
      queryClient.invalidateQueries({ queryKey: ['recent-activities'] })
    },
  })
}
