import { describe, it, expect, vi, beforeEach } from 'vitest'
import { contactsApi } from './contacts'
import { supabase } from '../supabase'

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

describe('contactsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listByMerchant', () => {
    it('should fetch contacts for a merchant', async () => {
      const mockContacts = [
        { id: 'c1', name: 'Contact 1', is_primary: true },
        { id: 'c2', name: 'Contact 2', is_primary: false },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockContacts, error: null }),
        }),
      } as any)

      const result = await contactsApi.listByMerchant('merchant-1')

      expect(result).toEqual(mockContacts)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
        }),
      } as any)

      await expect(contactsApi.listByMerchant('merchant-1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('getById', () => {
    it('should fetch a single contact', async () => {
      const mockContact = { id: 'c1', name: 'Contact 1' }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContact, error: null }),
      } as any)

      const result = await contactsApi.getById('c1')

      expect(result).toEqual(mockContact)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as any)

      await expect(contactsApi.getById('c1')).rejects.toEqual({ message: 'Not found' })
    })
  })

  describe('create', () => {
    it('should create a non-primary contact', async () => {
      const mockContact = { id: 'c1', name: 'New Contact', is_primary: false, merchant_id: 'm1' }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContact, error: null }),
      } as any)

      const result = await contactsApi.create({
        merchant_id: 'm1',
        name: 'New Contact',
        is_primary: false,
      })

      expect(result).toEqual(mockContact)
    })

    it('should unset other primaries when creating primary contact', async () => {
      const mockContact = { id: 'c1', name: 'Primary', is_primary: true, merchant_id: 'm1' }
      const updateMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'contacts') {
          return {
            update: updateMock,
            eq: vi.fn().mockResolvedValue({ error: null }),
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockContact, error: null }),
          } as any
        }
        return {} as any
      })

      await contactsApi.create({
        merchant_id: 'm1',
        name: 'Primary',
        is_primary: true,
      })

      expect(updateMock).toHaveBeenCalledWith({ is_primary: false })
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(
        contactsApi.create({ merchant_id: 'm1', name: 'Test' })
      ).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('update', () => {
    it('should update a contact', async () => {
      const mockContact = { id: 'c1', name: 'Updated', is_primary: false, merchant_id: 'm1' }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContact, error: null }),
      } as any)

      const result = await contactsApi.update('c1', { name: 'Updated' })

      expect(result).toEqual(mockContact)
    })

    it('should unset other primaries when updating to primary', async () => {
      const mockCurrentContact = { merchant_id: 'm1' }
      const mockContact = { id: 'c1', name: 'Primary', is_primary: true, merchant_id: 'm1' }

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: select to get merchant_id
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockCurrentContact, error: null }),
          } as any
        }
        if (callCount === 2) {
          // Second call: update other contacts
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockResolvedValue({ error: null }),
          } as any
        }
        // Third call: update the contact
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockContact, error: null }),
        } as any
      })

      const result = await contactsApi.update('c1', { is_primary: true })

      expect(result).toEqual(mockContact)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(contactsApi.update('c1', { name: 'Test' })).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('delete', () => {
    it('should delete a contact', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any)

      await expect(contactsApi.delete('c1')).resolves.toBeUndefined()
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Error' } }),
      } as any)

      await expect(contactsApi.delete('c1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('getPrimary', () => {
    it('should get primary contact for a merchant', async () => {
      const mockContact = { id: 'c1', name: 'Primary', is_primary: true }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockContact, error: null }),
        }),
      } as any)

      const result = await contactsApi.getPrimary('m1')

      expect(result).toEqual(mockContact)
    })

    it('should return null when no primary found (PGRST116)', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      } as any)

      const result = await contactsApi.getPrimary('m1')

      expect(result).toBeNull()
    })

    it('should throw error on other failures', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'Error' } }),
        }),
      } as any)

      await expect(contactsApi.getPrimary('m1')).rejects.toEqual({ code: 'OTHER', message: 'Error' })
    })
  })
})
