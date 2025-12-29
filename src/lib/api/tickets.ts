import { supabase } from '../supabase'
import type { SupportTicket, TicketWithRelations, TicketStatus, TicketPriority, Profile, Merchant } from '@/types/database'

export interface ListTicketsParams {
  status?: TicketStatus
  priority?: TicketPriority
  assignedTo?: string
  merchantId?: string
  category?: string
  limit?: number
  offset?: number
}

export const ticketsApi = {
  async list(params: ListTicketsParams = {}): Promise<TicketWithRelations[]> {
    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (params.status) query = query.eq('status', params.status)
    if (params.priority) query = query.eq('priority', params.priority)
    if (params.assignedTo) query = query.eq('assigned_to', params.assignedTo)
    if (params.merchantId) query = query.eq('merchant_id', params.merchantId)
    if (params.category) query = query.eq('category', params.category)
    if (params.limit) query = query.limit(params.limit)
    if (params.offset) query = query.range(params.offset, params.offset + (params.limit ?? 50) - 1)

    const { data: tickets, error } = await query
    if (error) throw error
    if (!tickets || tickets.length === 0) return []

    // Batch fetch all unique user IDs and merchant IDs
    const userIds = [...new Set(tickets.map(t => t.assigned_to).filter((id): id is string => Boolean(id)))]
    const merchantIds = [...new Set(tickets.map(t => t.merchant_id).filter(Boolean))]

    const userMap = new Map<string, Profile>()
    const merchantMap = new Map<string, Merchant>()

    // Batch fetch users
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      users?.forEach(user => userMap.set(user.id, user))
    }

    // Batch fetch merchants
    if (merchantIds.length > 0) {
      const { data: merchants } = await supabase
        .from('merchants')
        .select('*')
        .in('id', merchantIds)
      merchants?.forEach(merchant => merchantMap.set(merchant.id, merchant))
    }

    return tickets.map(ticket => ({
      ...ticket,
      assigned_user: ticket.assigned_to ? userMap.get(ticket.assigned_to) ?? null : null,
      merchant: merchantMap.get(ticket.merchant_id) ?? null,
    }))
  },

  async getById(id: string): Promise<TicketWithRelations> {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error

    const result: TicketWithRelations = { ...ticket }

    if (ticket.assigned_to) {
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ticket.assigned_to)
        .single()
      result.assigned_user = user
    }

    if (ticket.created_by) {
      const { data: creator } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ticket.created_by)
        .single()
      result.created_user = creator
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', ticket.merchant_id)
      .single()
    result.merchant = merchant

    return result
  },

  async listByMerchant(merchantId: string): Promise<TicketWithRelations[]> {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
    if (error) throw error
    if (!tickets || tickets.length === 0) return []

    // Batch fetch all unique user IDs in a single query
    const userIds = [...new Set(tickets.map(t => t.assigned_to).filter((id): id is string => Boolean(id)))]
    const userMap = new Map<string, Profile>()

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      users?.forEach(user => userMap.set(user.id, user))
    }

    return tickets.map(ticket => ({
      ...ticket,
      assigned_user: ticket.assigned_to ? userMap.get(ticket.assigned_to) ?? null : null,
    }))
  },

  async create(ticket: { merchant_id: string; subject: string; description?: string; priority?: TicketPriority; category?: string; status?: TicketStatus; created_by: string; assigned_to?: string | null }) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert(ticket)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<SupportTicket>) {
    const payload: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    // Auto-set resolved_at when status changes to resolved/closed
    if (updates.status === 'resolved' || updates.status === 'closed') {
      payload.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async countOpen() {
    const { count, error } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress', 'waiting_on_merchant'])
    if (error) throw error
    return count ?? 0
  },

  async countByPriority(priority: TicketPriority) {
    const { count, error } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('priority', priority)
      .in('status', ['open', 'in_progress', 'waiting_on_merchant'])
    if (error) throw error
    return count ?? 0
  },

  async countAssignedTo(userId: string) {
    const { count, error } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .in('status', ['open', 'in_progress', 'waiting_on_merchant'])
    if (error) throw error
    return count ?? 0
  },

  async countUnassigned() {
    const { count, error } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .is('assigned_to', null)
      .in('status', ['open', 'in_progress', 'waiting_on_merchant'])
    if (error) throw error
    return count ?? 0
  },
}
