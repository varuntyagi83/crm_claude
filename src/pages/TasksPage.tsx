import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyTasks, useCompleteTask } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/database'
import {
  Plus,
  Search,
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  Building2,
} from 'lucide-react'
import { TaskForm } from '@/components/tasks/TaskForm'

export function TasksPage() {
  const [search, setSearch] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const { data: tasks, isLoading } = useMyTasks(showCompleted)
  const completeTask = useCompleteTask()

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const filteredTasks = tasks?.filter((task) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      task.title?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower)
    )
  })

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date(new Date().toDateString())
  }

  const isToday = (dueDate: string | null) => {
    if (!dueDate) return false
    const today = new Date().toDateString()
    return new Date(dueDate).toDateString() === today
  }

  const isThisWeek = (dueDate: string | null) => {
    if (!dueDate) return false
    const date = new Date(dueDate)
    const today = new Date()
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return date > today && date <= weekFromNow
  }

  // Group tasks
  const overdueTasks = filteredTasks?.filter(
    (t) => !t.completed_at && isOverdue(t.due_date)
  ) || []
  const todayTasks = filteredTasks?.filter(
    (t) => !t.completed_at && isToday(t.due_date)
  ) || []
  const upcomingTasks = filteredTasks?.filter(
    (t) => !t.completed_at && t.due_date && isThisWeek(t.due_date) && !isToday(t.due_date)
  ) || []
  const laterTasks = filteredTasks?.filter(
    (t) => !t.completed_at && (!t.due_date || (!isOverdue(t.due_date) && !isToday(t.due_date) && !isThisWeek(t.due_date)))
  ) || []
  const completedTasks = filteredTasks?.filter((t) => t.completed_at) || []

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className={cn(task.completed_at && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={!!task.completed_at}
            onCheckedChange={() => !task.completed_at && handleComplete(task.id)}
            disabled={!!task.completed_at || completeTask.isPending}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p className={cn('font-medium', task.completed_at && 'line-through')}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              {task.merchant_id && (
                <Link
                  to={`/merchants/${task.merchant_id}`}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {(task as any).merchant?.business_name || 'Merchant'}
                </Link>
              )}
              {task.due_date && (
                <span
                  className={cn(
                    'flex items-center gap-1',
                    isOverdue(task.due_date) && !task.completed_at && 'text-destructive font-medium'
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TaskSection = ({
    title,
    icon,
    tasks,
    variant = 'default',
  }: {
    title: string
    icon: React.ReactNode
    tasks: Task[]
    variant?: 'default' | 'warning' | 'destructive'
  }) => {
    if (tasks.length === 0) return null

    return (
      <div className="space-y-3">
        <h3
          className={cn(
            'text-sm font-semibold flex items-center gap-2',
            variant === 'destructive' && 'text-destructive',
            variant === 'warning' && 'text-yellow-600'
          )}
        >
          {icon}
          {title} ({tasks.length})
        </h3>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title="My Tasks"
        subtitle="Track and manage your assigned tasks"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={showCompleted}
            onCheckedChange={(checked) => setShowCompleted(!!checked)}
          />
          Show Completed
        </label>
      </div>

      {/* Task Groups */}
      {filteredTasks?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {showCompleted ? 'No tasks' : 'All caught up! No pending tasks.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <TaskSection
            title="Overdue"
            icon={<AlertTriangle className="h-4 w-4" />}
            tasks={overdueTasks}
            variant="destructive"
          />
          <TaskSection
            title="Today"
            icon={<Clock className="h-4 w-4" />}
            tasks={todayTasks}
            variant="warning"
          />
          <TaskSection
            title="This Week"
            icon={<Calendar className="h-4 w-4" />}
            tasks={upcomingTasks}
          />
          <TaskSection
            title="Later"
            icon={<Calendar className="h-4 w-4" />}
            tasks={laterTasks}
          />
          {showCompleted && (
            <TaskSection
              title="Completed"
              icon={<CheckSquare className="h-4 w-4" />}
              tasks={completedTasks}
            />
          )}
        </div>
      )}

      {showForm && (
        <TaskForm onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
