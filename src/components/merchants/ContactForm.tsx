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
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts'
import type { Contact } from '@/types/database'
import { Loader2 } from 'lucide-react'

interface ContactFormProps {
  merchantId: string
  contact?: Contact | null
  onClose: () => void
}

export function ContactForm({ merchantId, contact, onClose }: ContactFormProps) {
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()

  const [name, setName] = useState(contact?.name || '')
  const [email, setEmail] = useState(contact?.email || '')
  const [phone, setPhone] = useState(contact?.phone || '')
  const [role, setRole] = useState(contact?.role || '')
  const [isPrimary, setIsPrimary] = useState(contact?.is_primary || false)

  const isEditing = !!contact
  const isLoading = createContact.isPending || updateContact.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditing) {
        await updateContact.mutateAsync({
          id: contact.id,
          updates: { name, email, phone, role, is_primary: isPrimary },
        })
      } else {
        await createContact.mutateAsync({
          merchant_id: merchantId,
          name,
          email: email || null,
          phone: phone || null,
          role: role || null,
          is_primary: isPrimary,
        })
      }
      onClose()
    } catch (error) {
      console.error('Failed to save contact:', error)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Contact' : 'Add Contact'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              placeholder="e.g., Owner, Finance, Technical"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="primary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(!!checked)}
            />
            <Label htmlFor="primary" className="font-normal">
              Set as primary contact
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
