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
import { useCreateTicket } from '@/hooks/useTickets'
import { useMerchants } from '@/hooks/useMerchants'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface TicketFormProps {
  merchantId?: string
  onClose: () => void
}

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const categoryOptions = [
  { value: 'technical', label: 'Technical' },
  { value: 'billing', label: 'Billing' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'general', label: 'General' },
]

export function TicketForm({ merchantId, onClose }: TicketFormProps) {
  const { profile } = useAuth()
  const createTicket = useCreateTicket()
  const { data: merchants } = useMerchants({})

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMerchant, setSelectedMerchant] = useState(merchantId || '')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('general')

  const isLoading = createTicket.isPending

  const merchantOptions = [
    { value: '', label: 'Select a merchant...' },
    ...(merchants?.map((m) => ({
      value: m.id,
      label: m.name || 'Unnamed Merchant',
    })) || []),
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMerchant) {
      alert('Please select a merchant')
      return
    }

    try {
      await createTicket.mutateAsync({
        merchant_id: selectedMerchant,
        subject,
        description,
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        category,
        status: 'open',
        created_by: profile!.id,
      })
      onClose()
    } catch (error) {
      console.error('Failed to create ticket:', error)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!merchantId && (
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant *</Label>
              <Select
                options={merchantOptions}
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the issue..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                options={priorityOptions}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                options={categoryOptions}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!subject.trim() || !description.trim() || !selectedMerchant || isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
