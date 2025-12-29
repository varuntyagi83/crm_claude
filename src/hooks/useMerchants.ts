import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { merchantsApi, type SearchMerchantsParams } from '@/lib/api/merchants'
import type { Merchant } from '@/types/database'

export function useMerchants(params: SearchMerchantsParams = {}) {
  return useQuery({
    queryKey: ['merchants', params],
    queryFn: () => merchantsApi.search(params),
    staleTime: 30000, // 30 seconds
  })
}

export function useMerchant(id: string | undefined) {
  return useQuery({
    queryKey: ['merchant', id],
    queryFn: () => merchantsApi.getById(id!),
    enabled: !!id,
    staleTime: 30000,
  })
}

export function useMerchantSummary(id: string | undefined) {
  return useQuery({
    queryKey: ['merchant-summary', id],
    queryFn: () => merchantsApi.getSummary(id!),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  })
}

export function useMyMerchants(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-merchants', userId],
    queryFn: () => merchantsApi.getAssignedToUser(userId!),
    enabled: !!userId,
    staleTime: 30000,
  })
}

export function useUpdateMerchant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Merchant> }) =>
      merchantsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] })
      queryClient.invalidateQueries({ queryKey: ['merchant', data.id] })
      queryClient.invalidateQueries({ queryKey: ['merchant-summary', data.id] })
    },
  })
}

export function useCreateMerchant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (merchant: Omit<Merchant, 'id' | 'created_at' | 'updated_at'>) =>
      merchantsApi.create(merchant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] })
    },
  })
}

export function useMerchantCounts() {
  return useQuery({
    queryKey: ['merchant-counts'],
    queryFn: async () => {
      const [total, active, suspended] = await Promise.all([
        merchantsApi.count(),
        merchantsApi.countByStatus('active'),
        merchantsApi.countByStatus('suspended'),
      ])
      return { total, active, suspended }
    },
    staleTime: 60000,
  })
}
