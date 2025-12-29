import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TasksPage } from './TasksPage'
import * as useTasksModule from '@/hooks/useTasks'

vi.mock('@/hooks/useTasks', () => ({
  useMyTasks: vi.fn(),
  useCompleteTask: vi.fn(),
}))

vi.mock('@/components/tasks/TaskForm', () => ({
  TaskForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="task-form">
      <button onClick={onClose}>Close Form</button>
    </div>
  ),
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

// Helper to create dates
const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const nextWeek = new Date(today)
nextWeek.setDate(nextWeek.getDate() + 5)
const nextMonth = new Date(today)
nextMonth.setMonth(nextMonth.getMonth() + 1)

const mockTasks = [
  { id: 't1', title: 'Overdue Task', description: 'This is overdue', due_date: yesterday.toISOString(), completed_at: null, merchant_id: 'm1' },
  { id: 't2', title: 'Today Task', description: 'Due today', due_date: today.toISOString(), completed_at: null, merchant_id: 'm2' },
  { id: 't3', title: 'This Week Task', description: 'Due this week', due_date: nextWeek.toISOString(), completed_at: null, merchant_id: null },
  { id: 't4', title: 'Later Task', description: 'Due later', due_date: nextMonth.toISOString(), completed_at: null, merchant_id: null },
  { id: 't5', title: 'No Due Date Task', description: 'No due date', due_date: null, completed_at: null, merchant_id: null },
  { id: 't6', title: 'Completed Task', description: 'Already done', due_date: yesterday.toISOString(), completed_at: '2024-01-15', merchant_id: null },
]

describe('TasksPage', () => {
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTasksModule.useMyTasks).mockReturnValue({
      data: mockTasks.filter((t) => !t.completed_at),
      isLoading: false,
    } as any)
    vi.mocked(useTasksModule.useCompleteTask).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)
  })

  it('should render page header', () => {
    renderWithProviders(<TasksPage />)

    expect(screen.getByText('My Tasks')).toBeInTheDocument()
    expect(screen.getByText('Track and manage your assigned tasks')).toBeInTheDocument()
  })

  it('should render New Task button', () => {
    renderWithProviders(<TasksPage />)

    expect(screen.getByText('New Task')).toBeInTheDocument()
  })

  it('should render search input', () => {
    renderWithProviders(<TasksPage />)

    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument()
  })

  it('should render Show Completed checkbox', () => {
    renderWithProviders(<TasksPage />)

    expect(screen.getByText('Show Completed')).toBeInTheDocument()
  })

  it('should render task sections', () => {
    renderWithProviders(<TasksPage />)

    expect(screen.getByText('Overdue Task')).toBeInTheDocument()
    expect(screen.getByText('Today Task')).toBeInTheDocument()
    expect(screen.getByText('This Week Task')).toBeInTheDocument()
    expect(screen.getByText('Later Task')).toBeInTheDocument()
    expect(screen.getByText('No Due Date Task')).toBeInTheDocument()
  })

  it('should filter tasks by search', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TasksPage />)

    const searchInput = screen.getByPlaceholderText('Search tasks...')
    await user.type(searchInput, 'Overdue')

    expect(screen.getByText('Overdue Task')).toBeInTheDocument()
    expect(screen.queryByText('Today Task')).not.toBeInTheDocument()
  })

  it('should show completed tasks when checkbox checked', async () => {
    vi.mocked(useTasksModule.useMyTasks).mockReturnValue({
      data: mockTasks,
      isLoading: false,
    } as any)

    const user = userEvent.setup()
    renderWithProviders(<TasksPage />)

    const checkbox = screen.getByRole('checkbox', { name: /show completed/i })
    await user.click(checkbox)

    // useMyTasks should have been called with true
    expect(useTasksModule.useMyTasks).toHaveBeenCalledWith(true)
  })

  it('should show loading state', () => {
    vi.mocked(useTasksModule.useMyTasks).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    renderWithProviders(<TasksPage />)

    // Should show skeletons when loading
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show empty state when no tasks', () => {
    vi.mocked(useTasksModule.useMyTasks).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    renderWithProviders(<TasksPage />)

    expect(screen.getByText('All caught up! No pending tasks.')).toBeInTheDocument()
  })

  it('should open task form when clicking New Task', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TasksPage />)

    await user.click(screen.getByText('New Task'))

    expect(screen.getByTestId('task-form')).toBeInTheDocument()
  })

  it('should close task form when form calls onClose', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TasksPage />)

    await user.click(screen.getByText('New Task'))
    expect(screen.getByTestId('task-form')).toBeInTheDocument()

    await user.click(screen.getByText('Close Form'))
    expect(screen.queryByTestId('task-form')).not.toBeInTheDocument()
  })

  it('should render task descriptions', () => {
    renderWithProviders(<TasksPage />)

    expect(screen.getByText('This is overdue')).toBeInTheDocument()
    expect(screen.getByText('Due today')).toBeInTheDocument()
  })

  it('should render section headers with counts', () => {
    renderWithProviders(<TasksPage />)

    expect(screen.getByText(/Overdue \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Today \(1\)/)).toBeInTheDocument()
  })
})
