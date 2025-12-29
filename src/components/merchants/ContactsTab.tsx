import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RoleGate } from '@/components/shared/RoleGate'
import { useMerchantContacts, useDeleteContact } from '@/hooks/useContacts'
import { ContactForm } from './ContactForm'
import type { Contact } from '@/types/database'
import { Plus, User, Mail, Phone, Edit, Trash2 } from 'lucide-react'

interface ContactsTabProps {
  merchantId: string
  contacts: Contact[]
}

export function ContactsTab({ merchantId }: ContactsTabProps) {
  const { data: contacts } = useMerchantContacts(merchantId)
  const deleteContact = useDeleteContact()
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    try {
      await deleteContact.mutateAsync({ id, merchantId })
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Contacts</h3>
        <RoleGate allowed={['sales', 'ops', 'admin']}>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </RoleGate>
      </div>

      {contacts?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No contacts added yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts?.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{contact.name}</p>
                      {contact.is_primary && (
                        <Badge variant="secondary" className="text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                    {contact.role && (
                      <p className="text-sm text-muted-foreground capitalize">
                        {contact.role}
                      </p>
                    )}
                  </div>
                  <RoleGate allowed={['sales', 'ops', 'admin']}>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingContact(contact)
                          setShowForm(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </RoleGate>
                </div>

                <div className="mt-4 space-y-2">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="h-4 w-4" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="h-4 w-4" />
                      {contact.phone}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <ContactForm
          merchantId={merchantId}
          contact={editingContact}
          onClose={() => {
            setShowForm(false)
            setEditingContact(null)
          }}
        />
      )}
    </div>
  )
}
