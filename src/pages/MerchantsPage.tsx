import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RoleGate } from '@/components/shared/RoleGate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useMerchants } from '@/hooks/useMerchants'
import type { Merchant } from '@/types/database'
import { Plus, Search, X } from 'lucide-react'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'onboarding', label: 'Onboarding' },
]

export function MerchantsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data: merchants, isLoading } = useMerchants({
    query: searchQuery || undefined,
    status: statusFilter || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (statusFilter) params.set('status', statusFilter)
    setSearchParams(params)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setSearchParams({})
    setPage(1)
  }

  const hasFilters = searchQuery || statusFilter

  const columns: Column<Merchant>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-muted-foreground">{row.legal_name}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <StatusBadge status={row.status as 'active' | 'inactive' | 'suspended' | 'onboarding'} />
      ),
    },
    {
      key: 'mcc_code',
      header: 'MCC',
      cell: (row) => row.mcc_code || '-',
    },
    {
      key: 'onboarded_at',
      header: 'Onboarded',
      cell: (row) =>
        row.onboarded_at
          ? new Date(row.onboarded_at).toLocaleDateString()
          : '-',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Merchants"
        description="Manage your merchant accounts"
        actions={
          <RoleGate allowed={['admin']}>
            <Button onClick={() => navigate('/merchants/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Merchant
            </Button>
          </RoleGate>
        }
      />

      {/* Filters */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              const params = new URLSearchParams(searchParams)
              if (e.target.value) {
                params.set('status', e.target.value)
              } else {
                params.delete('status')
              }
              setSearchParams(params)
              setPage(1)
            }}
            className="w-40"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {hasFilters && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </form>

      {/* Table */}
      <DataTable
        columns={columns}
        data={merchants ?? []}
        loading={isLoading}
        keyExtractor={(row) => row.id}
        onRowClick={(row) => navigate(`/merchants/${row.id}`)}
        emptyMessage="No merchants found"
        pagination={{
          page,
          pageSize,
          total: merchants?.length ?? 0,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
