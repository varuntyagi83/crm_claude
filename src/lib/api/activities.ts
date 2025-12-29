import { supabase } from '../supabase'
import type { ActivityWithUser, ActivityType, Profile } from '@/types/database'

export const activitiesApi = {
  async listByMerchant(merchantId: string, limit: number = 50): Promise<ActivityWithUser[]> {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    if (!activities || activities.length === 0) return []

    // Batch fetch all unique user IDs in a single query
    const userIds = [...new Set(activities.map(a => a.created_by).filter((id): id is string => Boolean(id)))]
    const userMap = new Map<string, Profile>()

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      users?.forEach(user => userMap.set(user.id, user))
    }

    return activities.map(activity => ({
      ...activity,
      created_user: activity.created_by ? userMap.get(activity.created_by) ?? null : null,
    }))
  },

  async listByTicket(ticketId: string): Promise<ActivityWithUser[]> {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) throw error
    if (!activities || activities.length === 0) return []

    // Batch fetch all unique user IDs in a single query
    const userIds = [...new Set(activities.map(a => a.created_by).filter((id): id is string => Boolean(id)))]
    const userMap = new Map<string, Profile>()

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      users?.forEach(user => userMap.set(user.id, user))
    }

    return activities.map(activity => ({
      ...activity,
      created_user: activity.created_by ? userMap.get(activity.created_by) ?? null : null,
    }))
  },

  async create(activity: {
    merchant_id: string
    type: ActivityType
    content: string
    ticket_id?: string
    performed_by?: string
  }): Promise<ActivityWithUser> {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('activities')
      .insert({
        merchant_id: activity.merchant_id,
        type: activity.type,
        content: activity.content,
        ticket_id: activity.ticket_id,
        created_by: activity.performed_by || user?.id,
      })
      .select('*')
      .single()

    if (error) throw error

    const result: ActivityWithUser = { ...data }

    if (data.created_by) {
      const { data: creator } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.created_by)
        .single()
      result.created_user = creator
    }

    return result
  },

  async getRecentByUser(userId: string, limit: number = 10) {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    if (!activities || activities.length === 0) return []

    // Batch fetch all unique merchant IDs in a single query
    const merchantIds = [...new Set(activities.map(a => a.merchant_id).filter(Boolean))]
    const merchantMap = new Map<string, unknown>()

    if (merchantIds.length > 0) {
      const { data: merchants } = await supabase
        .from('merchants')
        .select('*')
        .in('id', merchantIds)
      merchants?.forEach(merchant => merchantMap.set(merchant.id, merchant))
    }

    return activities.map(activity => ({
      ...activity,
      merchant: merchantMap.get(activity.merchant_id) ?? null,
    }))
  },

  async countByMerchant(merchantId: string, days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { count, error } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .gte('created_at', startDate.toISOString())

    if (error) throw error
    return count ?? 0
  },
}
