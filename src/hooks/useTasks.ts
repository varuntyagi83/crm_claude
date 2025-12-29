import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, type ListTasksParams } from '@/lib/api/tasks'
import type { Task } from '@/types/database'
import { useAuth } from './useAuth'

export function useTasks(params: ListTasksParams = {}) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksApi.list(params),
    staleTime: 30000,
  })
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getById(id!),
    enabled: !!id,
    staleTime: 30000,
  })
}

export function useMerchantTasks(merchantId: string | undefined, includeCompleted = false) {
  return useQuery({
    queryKey: ['merchant-tasks', merchantId, includeCompleted],
    queryFn: () => tasksApi.listByMerchant(merchantId!, includeCompleted),
    enabled: !!merchantId,
    staleTime: 30000,
  })
}

export function useMyTasks(includeCompleted = false) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['my-tasks', profile?.id, includeCompleted],
    queryFn: () => tasksApi.getMyTasks(profile!.id, includeCompleted),
    enabled: !!profile?.id,
    staleTime: 30000,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (task: { title: string; description?: string | null; merchant_id?: string | null; assigned_to: string; due_date?: string | null; created_by?: string }) =>
      tasksApi.create(task),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['merchant-tasks', data.merchant_id] })
      queryClient.invalidateQueries({ queryKey: ['task-counts'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      tasksApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', data.id] })
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['merchant-tasks', data.merchant_id] })
      queryClient.invalidateQueries({ queryKey: ['task-counts'] })
    },
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', data.id] })
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['merchant-tasks', data.merchant_id] })
      queryClient.invalidateQueries({ queryKey: ['task-counts'] })
    },
  })
}

export function useTaskCounts() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['task-counts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { pending: 0, overdue: 0 }
      const [pending, overdue] = await Promise.all([
        tasksApi.countPending(profile.id),
        tasksApi.countOverdue(profile.id),
      ])
      return { pending, overdue }
    },
    enabled: !!profile?.id,
    staleTime: 30000,
  })
}
