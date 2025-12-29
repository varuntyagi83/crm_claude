import { supabase } from '../supabase'
import type { Task, TaskWithRelations, Profile, Merchant } from '@/types/database'

export interface ListTasksParams {
  assignedTo?: string
  merchantId?: string
  includeCompleted?: boolean
  limit?: number
}

export const tasksApi = {
  async list(params: ListTasksParams = {}): Promise<TaskWithRelations[]> {
    let query = supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })

    if (params.assignedTo) query = query.eq('assigned_to', params.assignedTo)
    if (params.merchantId) query = query.eq('merchant_id', params.merchantId)
    if (!params.includeCompleted) query = query.is('completed_at', null)
    if (params.limit) query = query.limit(params.limit)

    const { data: tasks, error } = await query
    if (error) throw error

    if (!tasks || tasks.length === 0) return []

    // Batch fetch all unique user IDs and merchant IDs to avoid N+1 queries
    const userIds = [...new Set(tasks.map(t => t.assigned_to).filter((id): id is string => Boolean(id)))]
    const merchantIds = [...new Set(tasks.map(t => t.merchant_id).filter((id): id is string => Boolean(id)))]

    const userMap = new Map<string, Profile>()
    const merchantMap = new Map<string, Merchant>()

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      users?.forEach(user => userMap.set(user.id, user))
    }

    if (merchantIds.length > 0) {
      const { data: merchants } = await supabase
        .from('merchants')
        .select('*')
        .in('id', merchantIds)
      merchants?.forEach(merchant => merchantMap.set(merchant.id, merchant))
    }

    return tasks.map(task => ({
      ...task,
      assigned_user: task.assigned_to ? userMap.get(task.assigned_to) ?? null : null,
      merchant: task.merchant_id ? merchantMap.get(task.merchant_id) ?? null : null,
    }))
  },

  async getById(id: string): Promise<TaskWithRelations> {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error

    const result: TaskWithRelations = { ...task }

    if (task.assigned_to) {
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', task.assigned_to)
        .single()
      result.assigned_user = user
    }

    if (task.created_by) {
      const { data: creator } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', task.created_by)
        .single()
      result.created_user = creator
    }

    if (task.merchant_id) {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', task.merchant_id)
        .single()
      result.merchant = merchant
    }

    return result
  },

  async listByMerchant(merchantId: string, includeCompleted = false): Promise<TaskWithRelations[]> {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (!includeCompleted) query = query.is('completed_at', null)

    const { data: tasks, error } = await query
    if (error) throw error

    if (!tasks || tasks.length === 0) return []

    // Batch fetch all unique user IDs to avoid N+1 queries
    const userIds = [...new Set(tasks.map(t => t.assigned_to).filter((id): id is string => Boolean(id)))]
    const userMap = new Map<string, Profile>()

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      users?.forEach(user => userMap.set(user.id, user))
    }

    return tasks.map(task => ({
      ...task,
      assigned_user: task.assigned_to ? userMap.get(task.assigned_to) ?? null : null,
    }))
  },

  async create(task: { title: string; description?: string | null; merchant_id: string; assigned_to: string; due_date?: string | null; created_by?: string }) {
    if (!task.merchant_id) {
      throw new Error('merchant_id is required for task creation')
    }

    const payload = {
      ...task,
      created_by: task.created_by || task.assigned_to,
    }
    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async complete(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async uncomplete(id: string) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed_at: null })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async countPending(userId: string) {
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .is('completed_at', null)
    if (error) throw error
    return count ?? 0
  },

  async countOverdue(userId: string) {
    const today = new Date().toISOString().split('T')[0]
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .is('completed_at', null)
      .lt('due_date', today)
    if (error) throw error
    return count ?? 0
  },

  async getMyTasks(userId: string, includeCompleted = false): Promise<TaskWithRelations[]> {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (!includeCompleted) query = query.is('completed_at', null)

    const { data: tasks, error } = await query
    if (error) throw error

    if (!tasks || tasks.length === 0) return []

    // Batch fetch all unique merchant IDs to avoid N+1 queries
    const merchantIds = [...new Set(tasks.map(t => t.merchant_id).filter((id): id is string => Boolean(id)))]
    const merchantMap = new Map<string, Merchant>()

    if (merchantIds.length > 0) {
      const { data: merchants } = await supabase
        .from('merchants')
        .select('*')
        .in('id', merchantIds)
      merchants?.forEach(merchant => merchantMap.set(merchant.id, merchant))
    }

    return tasks.map(task => ({
      ...task,
      merchant: task.merchant_id ? merchantMap.get(task.merchant_id) ?? null : null,
    }))
  },
}
