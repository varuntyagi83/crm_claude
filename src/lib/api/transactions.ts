import { supabase } from '../supabase'
import type { Transaction } from '@/types/database'

export interface ListTransactionsParams {
  merchantId: string
  status?: string
  type?: string
  startDate?: string
  endDate?: string
  limit?: number
  cursor?: string
}

export const transactionsApi = {
  async listByMerchant(params: ListTransactionsParams) {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('merchant_id', params.merchantId)
      .order('processed_at', { ascending: false })

    if (params.status) query = query.eq('status', params.status)
    if (params.type) query = query.eq('type', params.type)
    if (params.startDate) query = query.gte('processed_at', params.startDate)
    if (params.endDate) query = query.lte('processed_at', params.endDate)
    if (params.cursor) query = query.lt('processed_at', params.cursor)

    query = query.limit(params.limit ?? 100)

    const { data, error } = await query
    if (error) throw error
    return data as Transaction[]
  },

  async getVolumeByMerchant(merchantId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('transactions')
      .select('amount_cents, processed_at')
      .eq('merchant_id', merchantId)
      .eq('status', 'completed')
      .gte('processed_at', startDate.toISOString())

    if (error) throw error

    const total = data.reduce((sum, t) => sum + t.amount_cents, 0)
    return { total, transactions: data }
  },

  async getTotalVolume(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('transactions')
      .select('amount_cents')
      .eq('status', 'completed')
      .gte('processed_at', startDate.toISOString())

    if (error) throw error
    return data.reduce((sum, t) => sum + t.amount_cents, 0)
  },

  async getFailedRate(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: all, error: allError } = await supabase
      .from('transactions')
      .select('status')
      .gte('processed_at', startDate.toISOString())

    if (allError) throw allError

    const total = all.length
    const failed = all.filter(t => t.status === 'failed').length

    return total > 0 ? (failed / total) * 100 : 0
  },

  async getDailyVolume(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('transactions')
      .select('amount_cents, processed_at')
      .eq('status', 'completed')
      .gte('processed_at', startDate.toISOString())
      .order('processed_at', { ascending: true })

    if (error) throw error

    // Group by day
    const byDay = new Map<string, number>()
    data.forEach(t => {
      const day = t.processed_at.split('T')[0]
      byDay.set(day, (byDay.get(day) ?? 0) + t.amount_cents)
    })

    return Array.from(byDay.entries()).map(([date, amount]) => ({
      date,
      amount: amount / 100, // Convert to dollars
    }))
  },
}
