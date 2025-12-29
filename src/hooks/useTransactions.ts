import { useQuery } from '@tanstack/react-query'
import { transactionsApi, type ListTransactionsParams } from '@/lib/api/transactions'

export function useMerchantTransactions(params: ListTransactionsParams) {
  return useQuery({
    queryKey: ['merchant-transactions', params],
    queryFn: () => transactionsApi.listByMerchant(params),
    enabled: !!params.merchantId,
    staleTime: 60000,
  })
}

export function useMerchantVolume(merchantId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ['merchant-volume', merchantId, days],
    queryFn: () => transactionsApi.getVolumeByMerchant(merchantId!, days),
    enabled: !!merchantId,
    staleTime: 60000,
  })
}

export function useTotalVolume(days = 30) {
  return useQuery({
    queryKey: ['total-volume', days],
    queryFn: () => transactionsApi.getTotalVolume(days),
    staleTime: 60000,
  })
}

export function useFailedRate(days = 30) {
  return useQuery({
    queryKey: ['failed-rate', days],
    queryFn: () => transactionsApi.getFailedRate(days),
    staleTime: 60000,
  })
}

export function useDailyVolume(days = 30) {
  return useQuery({
    queryKey: ['daily-volume', days],
    queryFn: () => transactionsApi.getDailyVolume(days),
    staleTime: 60000,
  })
}
