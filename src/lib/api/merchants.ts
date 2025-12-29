import { supabase } from '../supabase'
import type { Merchant, MerchantWithReps } from '@/types/database'

export interface SearchMerchantsParams {
  query?: string
  status?: string
  assignedTo?: string
  limit?: number
  offset?: number
}

export const merchantsApi = {
  async search(params: SearchMerchantsParams = {}) {
    // Build params object, only including defined values
    const rpcParams: Record<string, unknown> = {
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
    }

    // Only add optional params if they have actual values
    if (params.query && params.query.trim()) {
      rpcParams.p_query = params.query.trim()
    } else {
      rpcParams.p_query = null
    }

    if (params.status && params.status.trim()) {
      rpcParams.p_status = params.status.trim()
    } else {
      rpcParams.p_status = null
    }

    if (params.assignedTo && params.assignedTo.trim()) {
      rpcParams.p_assigned_to = params.assignedTo.trim()
    } else {
      rpcParams.p_assigned_to = null
    }

    const { data, error } = await supabase.rpc('search_merchants', rpcParams)
    if (error) throw error
    return data as Merchant[]
  },

  async getById(id: string): Promise<MerchantWithReps> {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error

    // Fetch related data separately to avoid type issues
    const merchant = data as Merchant
    const result: MerchantWithReps = { ...merchant }

    if (merchant.assigned_sales_rep) {
      const { data: salesRep } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', merchant.assigned_sales_rep)
        .single()
      result.sales_rep = salesRep
    }

    if (merchant.assigned_support_rep) {
      const { data: supportRep } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', merchant.assigned_support_rep)
        .single()
      result.support_rep = supportRep
    }

    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('merchant_id', id)
    result.contacts = contacts ?? []

    return result
  },

  async getSummary(id: string) {
    const { data, error } = await supabase.rpc('get_merchant_summary', {
      p_merchant_id: id,
    })
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Merchant>) {
    const { data, error } = await supabase
      .from('merchants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async create(merchant: Omit<Merchant, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('merchants')
      .insert(merchant)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getAssignedToUser(userId: string) {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .or(`assigned_sales_rep.eq.${userId},assigned_support_rep.eq.${userId}`)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getByStatus(status: string) {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('status', status)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  },

  async count() {
    const { count, error } = await supabase
      .from('merchants')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    return count ?? 0
  },

  async countByStatus(status: string) {
    const { count, error } = await supabase
      .from('merchants')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
    if (error) throw error
    return count ?? 0
  },
}
