import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useMerchantContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from './useContacts'
import { contactsApi } from '@/lib/api/contacts'

vi.mock('@/lib/api/contacts', () => ({
  contactsApi: {
    listByMerchant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

describe('useContacts hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useMerchantContacts', () => {
    it('should fetch contacts for a merchant', async () => {
      const mockContacts = [
        { id: 'c1', name: 'Contact 1', merchant_id: 'm1', is_primary: true },
        { id: 'c2', name: 'Contact 2', merchant_id: 'm1', is_primary: false },
      ]
      vi.mocked(contactsApi.listByMerchant).mockResolvedValue(mockContacts)

      const { result } = renderHook(() => useMerchantContacts('m1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(contactsApi.listByMerchant).toHaveBeenCalledWith('m1')
      expect(result.current.data).toEqual(mockContacts)
    })

    it('should not fetch when merchantId is undefined', async () => {
      const { result } = renderHook(() => useMerchantContacts(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(contactsApi.listByMerchant).not.toHaveBeenCalled()
    })

    it('should handle error state', async () => {
      vi.mocked(contactsApi.listByMerchant).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useMerchantContacts('m1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useCreateContact', () => {
    it('should create contact successfully', async () => {
      const newContact = {
        id: 'c1',
        name: 'New Contact',
        email: 'new@example.com',
        merchant_id: 'm1',
        is_primary: false,
      }
      vi.mocked(contactsApi.create).mockResolvedValue(newContact)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateContact(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({
        name: 'New Contact',
        email: 'new@example.com',
        merchant_id: 'm1',
        is_primary: false,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(contactsApi.create).toHaveBeenCalledWith({
        name: 'New Contact',
        email: 'new@example.com',
        merchant_id: 'm1',
        is_primary: false,
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchant-contacts', 'm1'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchant', 'm1'] })
    })

    it('should handle creation error', async () => {
      vi.mocked(contactsApi.create).mockRejectedValue(new Error('Create failed'))

      const { result } = renderHook(() => useCreateContact(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        name: 'New',
        merchant_id: 'm1',
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useUpdateContact', () => {
    it('should update contact successfully', async () => {
      const updatedContact = {
        id: 'c1',
        name: 'Updated Contact',
        merchant_id: 'm1',
        is_primary: true,
      }
      vi.mocked(contactsApi.update).mockResolvedValue(updatedContact)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateContact(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({ id: 'c1', updates: { name: 'Updated Contact' } })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(contactsApi.update).toHaveBeenCalledWith('c1', { name: 'Updated Contact' })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchant-contacts', 'm1'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchant', 'm1'] })
    })

    it('should handle update error', async () => {
      vi.mocked(contactsApi.update).mockRejectedValue(new Error('Update failed'))

      const { result } = renderHook(() => useUpdateContact(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 'c1', updates: { name: 'Test' } })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useDeleteContact', () => {
    it('should delete contact successfully', async () => {
      vi.mocked(contactsApi.delete).mockResolvedValue(undefined)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useDeleteContact(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({ id: 'c1', merchantId: 'm1' })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(contactsApi.delete).toHaveBeenCalledWith('c1')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchant-contacts', 'm1'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['merchant', 'm1'] })
    })

    it('should handle delete error', async () => {
      vi.mocked(contactsApi.delete).mockRejectedValue(new Error('Delete failed'))

      const { result } = renderHook(() => useDeleteContact(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 'c1', merchantId: 'm1' })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })
})
