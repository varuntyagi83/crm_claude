import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { useMerchantTransactions } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/utils'
import type { Transaction } from '@/types/database'
import { Download, CreditCard } from 'lucide-react'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'payment', label: 'Payment' },
  { value: 'refund', label: 'Refund' },
  { value: 'chargeback', label: 'Chargeback' },
]

interface TransactionsTabProps {
  merchantId: string
}

export function TransactionsTab({ merchantId }: TransactionsTabProps) {
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const { data: transactions, isLoading } = useMerchantTransactions({
    merchantId,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    limit: pageSize,
  })

  const columns: Column<Transaction>[] = [
    {
      key: 'processed_at',
      header: 'Date/Time',
      cell: (row) => new Date(row.processed_at).toLocaleString(),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row) => (
        <span className="capitalize">{row.type}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (row) => (
        <span className={row.type === 'refund' || row.type === 'chargeback' ? 'text-destructive' : ''}>
          {row.type === 'refund' || row.type === 'chargeback' ? '-' : ''}
          {formatCurrency(row.amount_cents, row.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
          completed: 'success',
          pending: 'warning',
          failed: 'destructive',
          refunded: 'default',
        }
        return (
          <Badge variant={variants[row.status] || 'default'}>
            {row.status}
          </Badge>
        )
      },
    },
    {
      key: 'card',
      header: 'Card',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {row.card_brand} •••• {row.last_four}
          </span>
        </div>
      ),
    },
  ]

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Transaction History</h3>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={transactions ?? []}
        loading={isLoading}
        keyExtractor={(row) => row.id}
        emptyMessage="No transactions found"
        pagination={{
          page,
          pageSize,
          total: transactions?.length ?? 0,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
