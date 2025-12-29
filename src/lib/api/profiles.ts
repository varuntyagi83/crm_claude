import { supabase } from '../supabase'
import type { Profile, UserRole } from '@/types/database'

export const profilesApi = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getByRole(role: UserRole) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('full_name', { ascending: true })
    if (error) throw error
    return data
  },

  async listAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getSalesReps() {
    return this.getByRole('sales')
  },

  async getSupportReps() {
    return this.getByRole('support')
  },

  async getOpsTeam() {
    return this.getByRole('ops')
  },
}
