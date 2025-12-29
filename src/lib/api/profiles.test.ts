import { describe, it, expect, vi, beforeEach } from 'vitest'
import { profilesApi } from './profiles'
import { supabase } from '../supabase'

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

describe('profilesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getById', () => {
    it('should fetch profile by id', async () => {
      const mockProfile = {
        id: 'u1',
        email: 'user@example.com',
        full_name: 'Test User',
        role: 'sales',
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      } as any)

      const result = await profilesApi.getById('u1')

      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toEqual(mockProfile)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as any)

      await expect(profilesApi.getById('invalid')).rejects.toEqual({ message: 'Not found' })
    })
  })

  describe('getByRole', () => {
    it('should fetch profiles by role', async () => {
      const mockProfiles = [
        { id: 'u1', email: 'sales1@example.com', full_name: 'Sales 1', role: 'sales' },
        { id: 'u2', email: 'sales2@example.com', full_name: 'Sales 2', role: 'sales' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
      } as any)

      const result = await profilesApi.getByRole('sales')

      expect(result).toEqual(mockProfiles)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(profilesApi.getByRole('sales')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('listAll', () => {
    it('should fetch all profiles', async () => {
      const mockProfiles = [
        { id: 'u1', email: 'user1@example.com', full_name: 'User 1', role: 'sales' },
        { id: 'u2', email: 'user2@example.com', full_name: 'User 2', role: 'support' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
      } as any)

      const result = await profilesApi.listAll()

      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toEqual(mockProfiles)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(profilesApi.listAll()).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('update', () => {
    it('should update profile successfully', async () => {
      const mockProfile = { id: 'u1', full_name: 'Updated Name', role: 'sales' }
      const updateMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      } as any)

      const result = await profilesApi.update('u1', { full_name: 'Updated Name' })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Updated Name',
          updated_at: expect.any(String),
        })
      )
      expect(result).toEqual(mockProfile)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(profilesApi.update('u1', { full_name: 'Test' })).rejects.toEqual({
        message: 'Error',
      })
    })
  })

  describe('getSalesReps', () => {
    it('should fetch sales profiles', async () => {
      const mockProfiles = [
        { id: 'u1', email: 'sales@example.com', full_name: 'Sales Rep', role: 'sales' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
      } as any)

      const result = await profilesApi.getSalesReps()

      expect(result).toEqual(mockProfiles)
    })
  })

  describe('getSupportReps', () => {
    it('should fetch support profiles', async () => {
      const mockProfiles = [
        { id: 'u1', email: 'support@example.com', full_name: 'Support Rep', role: 'support' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
      } as any)

      const result = await profilesApi.getSupportReps()

      expect(result).toEqual(mockProfiles)
    })
  })

  describe('getOpsTeam', () => {
    it('should fetch ops profiles', async () => {
      const mockProfiles = [
        { id: 'u1', email: 'ops@example.com', full_name: 'Ops Team', role: 'ops' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
      } as any)

      const result = await profilesApi.getOpsTeam()

      expect(result).toEqual(mockProfiles)
    })
  })
})
