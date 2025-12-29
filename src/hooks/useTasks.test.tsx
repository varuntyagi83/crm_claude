import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useTasks,
  useTask,
  useMerchantTasks,
  useMyTasks,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useTaskCounts,
} from './useTasks'
import { tasksApi } from '@/lib/api/tasks'
import * as useAuthModule from './useAuth'

vi.mock('@/lib/api/tasks', () => ({
  tasksApi: {
    list: vi.fn(),
    getById: vi.fn(),
    listByMerchant: vi.fn(),
    getMyTasks: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    complete: vi.fn(),
    countPending: vi.fn(),
    countOverdue: vi.fn(),
  },
}))

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTasks hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: 'u1', email: 'test@example.com' },
      profile: { id: 'u1', email: 'test@example.com', full_name: 'Test User', role: 'sales' },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      isRole: () => true,
    } as any)
  })

  describe('useTasks', () => {
    it('should fetch tasks with default parameters', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', assigned_to: 'u1' },
        { id: 'task-2', title: 'Task 2', assigned_to: 'u1' },
      ]
      vi.mocked(tasksApi.list).mockResolvedValue(mockTasks)

      const { result } = renderHook(() => useTasks(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(tasksApi.list).toHaveBeenCalledWith({})
      expect(result.current.data).toEqual(mockTasks)
    })

    it('should pass filter parameters to API', async () => {
      vi.mocked(tasksApi.list).mockResolvedValue([])

      const params = { assignedTo: 'u1', includeCompleted: true }
      const { result } = renderHook(() => useTasks(params), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(tasksApi.list).toHaveBeenCalledWith(params)
    })

    it('should handle error state', async () => {
      vi.mocked(tasksApi.list).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useTasks(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useTask', () => {
    it('should fetch a single task by id', async () => {
      const mockTask = { id: 'task-1', title: 'Test Task', assigned_to: 'u1' }
      vi.mocked(tasksApi.getById).mockResolvedValue(mockTask)

      const { result } = renderHook(() => useTask('task-1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(tasksApi.getById).toHaveBeenCalledWith('task-1')
      expect(result.current.data).toEqual(mockTask)
    })

    it('should not fetch when id is undefined', async () => {
      const { result } = renderHook(() => useTask(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(tasksApi.getById).not.toHaveBeenCalled()
    })
  })

  describe('useMerchantTasks', () => {
    it('should fetch tasks for a merchant', async () => {
      const mockTasks = [{ id: 'task-1', title: 'Merchant Task', merchant_id: 'm1' }]
      vi.mocked(tasksApi.listByMerchant).mockResolvedValue(mockTasks)

      const { result } = renderHook(() => useMerchantTasks('m1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(tasksApi.listByMerchant).toHaveBeenCalledWith('m1', false)
      expect(result.current.data).toEqual(mockTasks)
    })

    it('should include completed tasks when flag is true', async () => {
      vi.mocked(tasksApi.listByMerchant).mockResolvedValue([])

      const { result } = renderHook(() => useMerchantTasks('m1', true), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(tasksApi.listByMerchant).toHaveBeenCalledWith('m1', true)
    })

    it('should not fetch when merchantId is undefined', async () => {
      const { result } = renderHook(() => useMerchantTasks(undefined), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(tasksApi.listByMerchant).not.toHaveBeenCalled()
    })
  })

  describe('useMyTasks', () => {
    it('should fetch tasks for current user', async () => {
      const mockTasks = [{ id: 'task-1', title: 'My Task', assigned_to: 'u1' }]
      vi.mocked(tasksApi.getMyTasks).mockResolvedValue(mockTasks)

      const { result } = renderHook(() => useMyTasks(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(tasksApi.getMyTasks).toHaveBeenCalledWith('u1', false)
      expect(result.current.data).toEqual(mockTasks)
    })

    it('should include completed tasks when flag is true', async () => {
      vi.mocked(tasksApi.getMyTasks).mockResolvedValue([])

      const { result } = renderHook(() => useMyTasks(true), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(tasksApi.getMyTasks).toHaveBeenCalledWith('u1', true)
    })

    it('should not fetch when no profile', async () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        isRole: () => false,
      } as any)

      const { result } = renderHook(() => useMyTasks(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(tasksApi.getMyTasks).not.toHaveBeenCalled()
    })
  })

  describe('useCreateTask', () => {
    it('should create task successfully', async () => {
      const newTask = {
        id: 'task-1',
        title: 'New Task',
        assigned_to: 'u1',
        merchant_id: 'm1',
      }
      vi.mocked(tasksApi.create).mockResolvedValue(newTask)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({
        title: 'New Task',
        assigned_to: 'u1',
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(tasksApi.create).toHaveBeenCalledWith({
        title: 'New Task',
        assigned_to: 'u1',
      })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-tasks'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task-counts'] })
    })

    it('should handle creation error', async () => {
      vi.mocked(tasksApi.create).mockRejectedValue(new Error('Create failed'))

      const { result } = renderHook(() => useCreateTask(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        title: 'New',
        assigned_to: 'u1',
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useUpdateTask', () => {
    it('should update task successfully', async () => {
      const updatedTask = {
        id: 'task-1',
        title: 'Updated',
        merchant_id: 'm1',
        assigned_to: 'u1',
      }
      vi.mocked(tasksApi.update).mockResolvedValue(updatedTask)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateTask(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate({ id: 'task-1', updates: { title: 'Updated' } })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(tasksApi.update).toHaveBeenCalledWith('task-1', { title: 'Updated' })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'task-1'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-tasks'] })
    })

    it('should handle update error', async () => {
      vi.mocked(tasksApi.update).mockRejectedValue(new Error('Update failed'))

      const { result } = renderHook(() => useUpdateTask(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 'task-1', updates: {} })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useCompleteTask', () => {
    it('should complete task successfully', async () => {
      const completedTask = {
        id: 'task-1',
        title: 'Task',
        merchant_id: 'm1',
        completed_at: '2024-01-01T00:00:00Z',
      }
      vi.mocked(tasksApi.complete).mockResolvedValue(completedTask)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCompleteTask(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      })

      result.current.mutate('task-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(tasksApi.complete).toHaveBeenCalledWith('task-1')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tasks'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'task-1'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task-counts'] })
    })

    it('should handle complete error', async () => {
      vi.mocked(tasksApi.complete).mockRejectedValue(new Error('Complete failed'))

      const { result } = renderHook(() => useCompleteTask(), {
        wrapper: createWrapper(),
      })

      result.current.mutate('task-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('useTaskCounts', () => {
    it('should fetch task counts for current user', async () => {
      vi.mocked(tasksApi.countPending).mockResolvedValue(5)
      vi.mocked(tasksApi.countOverdue).mockResolvedValue(2)

      const { result } = renderHook(() => useTaskCounts(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(tasksApi.countPending).toHaveBeenCalledWith('u1')
      expect(tasksApi.countOverdue).toHaveBeenCalledWith('u1')
      expect(result.current.data).toEqual({
        pending: 5,
        overdue: 2,
      })
    })

    it('should return zeros when no profile', async () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        isRole: () => false,
      } as any)

      const { result } = renderHook(() => useTaskCounts(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(tasksApi.countPending).not.toHaveBeenCalled()
    })

    it('should handle count error', async () => {
      vi.mocked(tasksApi.countPending).mockRejectedValue(new Error('Count failed'))

      const { result } = renderHook(() => useTaskCounts(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })
})
