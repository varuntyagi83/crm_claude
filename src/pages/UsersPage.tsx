import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { useUsers, useUpdateUser } from '@/hooks/useUsers'
import type { Profile, UserRole } from '@/types/database'
import { Search, Users, Edit2, Loader2 } from 'lucide-react'

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Support' },
  { value: 'ops', label: 'Ops' },
]

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  sales: 'bg-blue-100 text-blue-800',
  support: 'bg-green-100 text-green-800',
  ops: 'bg-orange-100 text-orange-800',
}

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', role: '' as UserRole | '' })

  const { data: users, isLoading } = useUsers()
  const updateUser = useUpdateUser()

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = !search ||
      user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = !roleFilter || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleEdit = (user: Profile) => {
    setEditingUser(user)
    setEditForm({ full_name: user.full_name, role: user.role })
  }

  const handleSave = async () => {
    if (!editingUser || !editForm.full_name || !editForm.role) return

    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        updates: {
          full_name: editForm.full_name,
          role: editForm.role as UserRole,
        },
      })
      setEditingUser(null)
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const columns: Column<Profile>[] = [
    {
      key: 'full_name',
      header: 'Name',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.full_name}</p>
          <p className="text-sm text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (row) => (
        <Badge className={roleColors[row.role]}>
          {row.role.charAt(0).toUpperCase() + row.role.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined',
      cell: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString()
          : '-',
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleEdit(row)
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage system users and roles"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          options={roleOptions}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {['admin', 'sales', 'support', 'ops'].map((role) => {
          const count = users?.filter((u) => u.role === role).length ?? 0
          return (
            <Card key={role}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground capitalize">{role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredUsers ?? []}
        loading={isLoading}
        keyExtractor={(row) => row.id}
        emptyMessage="No users found"
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input value={editingUser?.email || ''} disabled />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select
                options={roleOptions.filter((r) => r.value !== '')}
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
