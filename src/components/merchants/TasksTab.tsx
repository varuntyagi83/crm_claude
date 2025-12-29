import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useMerchantTasks, useCompleteTask } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'
import { Plus, CheckSquare } from 'lucide-react'

interface TasksTabProps {
  merchantId: string
}

export function TasksTab({ merchantId }: TasksTabProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  const { data: tasks, isLoading } = useMerchantTasks(merchantId, showCompleted)
  const completeTask = useCompleteTask()

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date(new Date().toDateString())
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">Tasks</h3>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(!!checked)}
            />
            Show completed
          </label>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {tasks?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {showCompleted ? 'No tasks' : 'All caught up!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks?.map((task) => (
            <Card key={task.id} className={cn(task.completed_at && 'opacity-60')}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={!!task.completed_at}
                    onCheckedChange={() => !task.completed_at && handleComplete(task.id)}
                    disabled={!!task.completed_at}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium',
                      task.completed_at && 'line-through'
                    )}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>
                        Assigned: {task.assigned_user?.full_name}
                      </span>
                      {task.due_date && (
                        <span className={cn(
                          isOverdue(task.due_date) && !task.completed_at && 'text-destructive font-medium'
                        )}>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
