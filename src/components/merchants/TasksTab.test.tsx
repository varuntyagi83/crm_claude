import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TasksTab } from './TasksTab'
import * as useTasksModule from '@/hooks/useTasks'

vi.mock('@/hooks/useTasks', () => ({
  useMerchantTasks: vi.fn(),
  useCompleteTask: vi.fn(),
}))

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

const mockTasks = [
  {
    id: 't1',
    title: 'Follow up call',
    description: 'Call about contract renewal',
    due_date: tomorrow.toISOString(),
    completed_at: null,
    assigned_user: { full_name: 'Sales Rep' },
  },
  {
    id: 't2',
    title: 'Overdue task',
    description: 'This was due yesterday',
    due_date: yesterday.toISOString(),
    completed_at: null,
    assigned_user: { full_name: 'Another Rep' },
  },
  {
    id: 't3',
    title: 'Completed task',
    description: 'Already done',
    due_date: yesterday.toISOString(),
    completed_at: '2024-01-15',
    assigned_user: { full_name: 'Sales Rep' },
  },
]

describe('TasksTab', () => {
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTasksModule.useMerchantTasks).mockReturnValue({
      data: mockTasks.filter((t) => !t.completed_at),
      isLoading: false,
    } as any)
    vi.mocked(useTasksModule.useCompleteTask).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)
  })

  it('should render section header', () => {
    renderWithProviders(<TasksTab merchantId="m1" />)

    expect(screen.getByText('Tasks')).toBeInTheDocument()
  })

  it('should render Add Task button', () => {
    renderWithProviders(<TasksTab merchantId="m1" />)

    expect(screen.getByText('Add Task')).toBeInTheDocument()
  })

  it('should render Show completed checkbox', () => {
    renderWithProviders(<TasksTab merchantId="m1" />)

    expect(screen.getByText('Show completed')).toBeInTheDocument()
  })

  it('should render tasks', () => {
    renderWithProviders(<TasksTab merchantId="m1" />)

    expect(screen.getByText('Follow up call')).toBeInTheDocument()
    expect(screen.getByText('Call about contract renewal')).toBeInTheDocument()
    expect(screen.getByText('Overdue task')).toBeInTheDocument()
  })

  it('should render assigned user names', () => {
    renderWithProviders(<TasksTab merchantId="m1" />)

    expect(screen.getByText('Assigned: Sales Rep')).toBeInTheDocument()
    expect(screen.getByText('Assigned: Another Rep')).toBeInTheDocument()
  })

  it('should render due dates', () => {
    renderWithProviders(<TasksTab merchantId="m1" />)

    const tomorrowFormatted = tomorrow.toLocaleDateString()
    const yesterdayFormatted = yesterday.toLocaleDateString()

    expect(screen.getByText(`Due: ${tomorrowFormatted}`)).toBeInTheDocument()
    expect(screen.getByText(`Due: ${yesterdayFormatted}`)).toBeInTheDocument()
  })

  it('should show loading state', () => {
    vi.mocked(useTasksModule.useMerchantTasks).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    renderWithProviders(<TasksTab merchantId="m1" />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show empty state when no tasks', () => {
    vi.mocked(useTasksModule.useMerchantTasks).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    renderWithProviders(<TasksTab merchantId="m1" />)

    expect(screen.getByText('All caught up!')).toBeInTheDocument()
  })

  it('should toggle show completed checkbox', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TasksTab merchantId="m1" />)

    // Find the "Show completed" checkbox specifically by its label
    const checkbox = screen.getByRole('checkbox', { name: /show completed/i })
    await user.click(checkbox)

    // useMerchantTasks should be called with true
    expect(useTasksModule.useMerchantTasks).toHaveBeenCalledWith('m1', true)
  })

  it('should complete a task when checkbox clicked', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithProviders(<TasksTab merchantId="m1" />)

    // Find the task checkboxes (excluding the "Show completed" checkbox)
    const checkboxes = screen.getAllByRole('checkbox')
    // First checkbox is "Show completed", subsequent are task checkboxes
    await user.click(checkboxes[1])

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('t1')
    })
  })

  it('should show overdue styling for overdue tasks', () => {
    renderWithProviders(<TasksTab merchantId="m1" />)

    // Overdue date should have destructive text color
    const overdueDate = screen.getByText(`Due: ${yesterday.toLocaleDateString()}`)
    expect(overdueDate).toHaveClass('text-destructive')
  })

  it('should show completed tasks with opacity and strikethrough', () => {
    vi.mocked(useTasksModule.useMerchantTasks).mockReturnValue({
      data: mockTasks,
      isLoading: false,
    } as any)

    renderWithProviders(<TasksTab merchantId="m1" />)

    const completedTitle = screen.getByText('Completed task')
    expect(completedTitle).toHaveClass('line-through')
  })

  it('should disable checkbox for completed tasks', () => {
    vi.mocked(useTasksModule.useMerchantTasks).mockReturnValue({
      data: mockTasks,
      isLoading: false,
    } as any)

    renderWithProviders(<TasksTab merchantId="m1" />)

    // Find checkboxes - the completed task should have a disabled checkbox
    const checkboxes = screen.getAllByRole('checkbox')
    // Last checkbox should be disabled (completed task)
    const completedCheckbox = checkboxes[checkboxes.length - 1]
    expect(completedCheckbox).toBeDisabled()
  })
})
