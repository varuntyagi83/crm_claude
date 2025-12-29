import { supabase } from '../supabase'
import type { Contact } from '@/types/database'

export const contactsApi = {
  async listByMerchant(merchantId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true })
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(contact: Omit<Contact, 'id' | 'created_at'>) {
    // If this is being set as primary, unset other primaries first
    if (contact.is_primary) {
      await supabase
        .from('contacts')
        .update({ is_primary: false })
        .eq('merchant_id', contact.merchant_id)
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Contact>) {
    // If setting as primary, unset other primaries first
    if (updates.is_primary) {
      const { data: current } = await supabase
        .from('contacts')
        .select('merchant_id')
        .eq('id', id)
        .single()

      if (current) {
        await supabase
          .from('contacts')
          .update({ is_primary: false })
          .eq('merchant_id', current.merchant_id)
          .neq('id', id)
      }
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getPrimary(merchantId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('is_primary', true)
      .single()
    if (error && error.code !== 'PGRST116') throw error // Ignore not found
    return data
  },
}
