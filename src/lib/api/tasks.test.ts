import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tasksApi } from './tasks'
import { supabase } from '../supabase'

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

describe('tasksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should fetch tasks with default parameters', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      const result = await tasksApi.list()

      expect(supabase.from).toHaveBeenCalledWith('tasks')
      expect(result).toEqual([])
    })

    it('should apply assignedTo filter', async () => {
      const eqMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: eqMock,
        is: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await tasksApi.list({ assignedTo: 'user-1' })

      expect(eqMock).toHaveBeenCalledWith('assigned_to', 'user-1')
    })

    it('should apply merchantId filter', async () => {
      const eqMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: eqMock,
        is: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await tasksApi.list({ merchantId: 'm1' })

      expect(eqMock).toHaveBeenCalledWith('merchant_id', 'm1')
    })

    it('should include completed tasks when flag is true', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await tasksApi.list({ includeCompleted: true })

      expect(supabase.from).toHaveBeenCalledWith('tasks')
    })

    it('should apply limit', async () => {
      const limitMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        limit: limitMock.mockResolvedValue({ data: [], error: null }),
      } as any)

      await tasksApi.list({ limit: 10 })

      expect(limitMock).toHaveBeenCalledWith(10)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(tasksApi.list()).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('getById', () => {
    it('should fetch a single task', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        assigned_to: null,
        created_by: null,
        merchant_id: null,
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
      } as any)

      const result = await tasksApi.getById('task-1')

      expect(result).toMatchObject({ id: 'task-1', title: 'Test Task' })
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as any)

      await expect(tasksApi.getById('invalid')).rejects.toEqual({ message: 'Not found' })
    })
  })

  describe('listByMerchant', () => {
    it('should fetch tasks for a merchant', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      const result = await tasksApi.listByMerchant('m1')

      expect(result).toEqual([])
    })

    it('should include completed when flag is true', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await tasksApi.listByMerchant('m1', true)

      expect(supabase.from).toHaveBeenCalledWith('tasks')
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(tasksApi.listByMerchant('m1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('create', () => {
    it('should create a new task', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'New Task',
        assigned_to: 'u1',
        merchant_id: 'm1',
      }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
      } as any)

      const result = await tasksApi.create({
        title: 'New Task',
        assigned_to: 'u1',
      })

      expect(result).toEqual(mockTask)
    })

    it('should use assigned_to as created_by if not provided', async () => {
      const insertMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'task-1' }, error: null }),
      } as any)

      await tasksApi.create({
        title: 'Task',
        assigned_to: 'u1',
      })

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ created_by: 'u1' })
      )
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(
        tasksApi.create({ title: 'Test', assigned_to: 'u1' })
      ).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('update', () => {
    it('should update a task', async () => {
      const mockTask = { id: 'task-1', title: 'Updated' }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
      } as any)

      const result = await tasksApi.update('task-1', { title: 'Updated' })

      expect(result).toEqual(mockTask)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(tasksApi.update('task-1', {})).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('complete', () => {
    it('should mark task as completed', async () => {
      const updateMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'task-1', completed_at: '2024-01-01' }, error: null }),
      } as any)

      const result = await tasksApi.complete('task-1')

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ completed_at: expect.any(String) })
      )
      expect(result.completed_at).toBeDefined()
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(tasksApi.complete('task-1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('uncomplete', () => {
    it('should mark task as uncompleted', async () => {
      const updateMock = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'task-1', completed_at: null }, error: null }),
      } as any)

      const result = await tasksApi.uncomplete('task-1')

      expect(updateMock).toHaveBeenCalledWith({ completed_at: null })
      expect(result.completed_at).toBeNull()
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(tasksApi.uncomplete('task-1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('countPending', () => {
    it('should return count of pending tasks', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ count: 5, error: null }),
      } as any)

      const result = await tasksApi.countPending('u1')

      expect(result).toBe(5)
    })

    it('should return 0 when count is null', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ count: null, error: null }),
      } as any)

      const result = await tasksApi.countPending('u1')

      expect(result).toBe(0)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      } as any)

      await expect(tasksApi.countPending('u1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('countOverdue', () => {
    it('should return count of overdue tasks', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        lt: vi.fn().mockResolvedValue({ count: 3, error: null }),
      } as any)

      const result = await tasksApi.countOverdue('u1')

      expect(result).toBe(3)
    })

    it('should return 0 when count is null', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        lt: vi.fn().mockResolvedValue({ count: null, error: null }),
      } as any)

      const result = await tasksApi.countOverdue('u1')

      expect(result).toBe(0)
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        lt: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      } as any)

      await expect(tasksApi.countOverdue('u1')).rejects.toEqual({ message: 'Error' })
    })
  })

  describe('getMyTasks', () => {
    it('should fetch tasks for current user', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      const result = await tasksApi.getMyTasks('u1')

      expect(result).toEqual([])
    })

    it('should include completed when flag is true', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any)

      await tasksApi.getMyTasks('u1', true)

      expect(supabase.from).toHaveBeenCalledWith('tasks')
    })

    it('should throw error on failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      } as any)

      await expect(tasksApi.getMyTasks('u1')).rejects.toEqual({ message: 'Error' })
    })
  })
})
