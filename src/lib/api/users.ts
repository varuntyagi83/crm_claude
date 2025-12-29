import { supabase } from '../supabase'
import type { Profile, UserRole } from '@/types/database'

export interface UpdateUserParams {
  full_name?: string
  role?: UserRole
}

export const usersApi = {
  async list() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
    if (error) throw error
    return data as Profile[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Profile
  },

  async update(id: string, updates: UpdateUserParams) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },

  async countByRole(role: UserRole) {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', role)
    if (error) throw error
    return count ?? 0
  },
}
