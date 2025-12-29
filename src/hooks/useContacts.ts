import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsApi } from '@/lib/api/contacts'
import type { Contact } from '@/types/database'

export function useMerchantContacts(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['merchant-contacts', merchantId],
    queryFn: () => contactsApi.listByMerchant(merchantId!),
    enabled: !!merchantId,
    staleTime: 60000,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contact: Omit<Contact, 'id' | 'created_at'>) =>
      contactsApi.create(contact),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contacts', data.merchant_id] })
      queryClient.invalidateQueries({ queryKey: ['merchant', data.merchant_id] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Contact> }) =>
      contactsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contacts', data.merchant_id] })
      queryClient.invalidateQueries({ queryKey: ['merchant', data.merchant_id] })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, merchantId }: { id: string; merchantId: string }) =>
      contactsApi.delete(id).then(() => merchantId),
    onSuccess: (merchantId) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contacts', merchantId] })
      queryClient.invalidateQueries({ queryKey: ['merchant', merchantId] })
    },
  })
}
