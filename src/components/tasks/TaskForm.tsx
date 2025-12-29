import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useCreateTask } from '@/hooks/useTasks'
import { useMerchants } from '@/hooks/useMerchants'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface TaskFormProps {
  merchantId?: string
  onClose: () => void
}

export function TaskForm({ merchantId, onClose }: TaskFormProps) {
  const { profile } = useAuth()
  const createTask = useCreateTask()
  const { data: merchants } = useMerchants({})

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMerchant, setSelectedMerchant] = useState(merchantId || '')
  const [dueDate, setDueDate] = useState('')

  const isLoading = createTask.isPending

  const merchantOptions = [
    { value: '', label: 'No merchant (personal task)' },
    ...(merchants?.map((m) => ({
      value: m.id,
      label: m.name || 'Unnamed Merchant',
    })) || []),
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createTask.mutateAsync({
        title,
        description: description || null,
        merchant_id: selectedMerchant || null,
        assigned_to: profile?.id!,
        due_date: dueDate || null,
      })
      onClose()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          {!merchantId && (
            <div className="space-y-2">
              <Label htmlFor="merchant">Related Merchant</Label>
              <Select
                options={merchantOptions}
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
