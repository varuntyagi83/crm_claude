import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usersApi } from './users'
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

describe('usersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should fetch all users', async () => {
      const mockUsers = [
        { id: 'u1', email: 'user1@example.com', full_name: 'User 1', role: 'sales' },
        { id: 'u2', email: 'user2@example.com', full_name: 'User 2', role: 'support' },
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
      } as any)

      const result = await usersApi.list()

      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toEqual(mockUsers)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(usersApi.list()).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('getById', () => {
    it('should fetch a single user by id', async () => {
      const mockUser = { id: 'u1', email: 'user@example.com', full_name: 'User 1', role: 'sales' }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
      } as any)

      const result = await usersApi.getById('u1')

      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toEqual(mockUser)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as any)

      await expect(usersApi.getById('invalid')).rejects.toEqual({ message: 'Not found' })
    })
  })

  describe('update', () => {
    it('should update user successfully', async () => {
      const mockUser = { id: 'u1', full_name: 'Updated Name', role: 'admin' }
      const updateMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
      } as any)

      const result = await usersApi.update('u1', { full_name: 'Updated Name', role: 'admin' })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Updated Name',
          role: 'admin',
          updated_at: expect.any(String),
        })
      )
      expect(result).toEqual(mockUser)
    })

    it('should update only full_name', async () => {
      const mockUser = { id: 'u1', full_name: 'New Name', role: 'sales' }
      const updateMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
      } as any)

      await usersApi.update('u1', { full_name: 'New Name' })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ full_name: 'New Name' })
      )
    })

    it('should update only role', async () => {
      const mockUser = { id: 'u1', full_name: 'User', role: 'admin' }
      const updateMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
      } as any)

      await usersApi.update('u1', { role: 'admin' })

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin' })
      )
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(usersApi.update('u1', { full_name: 'Test' })).rejects.toEqual({
        message: 'Error',
      })
    })
  })

  describe('countByRole', () => {
    it('should return count of users by role', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      } as any)

      const result = await usersApi.countByRole('sales')

      expect(result).toBe(5)
    })

    it('should return 0 when count is null', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: null }),
      } as any)

      const result = await usersApi.countByRole('sales')

      expect(result).toBe(0)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      } as any)

      await expect(usersApi.countByRole('sales')).rejects.toEqual({ message: 'Error' })
    })
  })
})
