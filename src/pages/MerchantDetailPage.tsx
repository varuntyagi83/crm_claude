import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RoleGate } from '@/components/shared/RoleGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useMerchant } from '@/hooks/useMerchants'
import { ActivityTab } from '@/components/merchants/ActivityTab'
import { TicketsTab } from '@/components/merchants/TicketsTab'
import { TransactionsTab } from '@/components/merchants/TransactionsTab'
import { ContactsTab } from '@/components/merchants/ContactsTab'
import { TasksTab } from '@/components/merchants/TasksTab'
import { Edit, Ticket, CheckSquare } from 'lucide-react'

export function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: merchant, isLoading, error } = useMerchant(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-24 flex-1" />
          <Skeleton className="h-24 flex-1" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !merchant) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg font-medium">Merchant not found</p>
        <p className="mt-1 text-muted-foreground">
          The merchant you're looking for doesn't exist or you don't have access.
        </p>
        <Link to="/merchants" className="mt-4">
          <Button variant="outline">Back to Merchants</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={merchant.name}
        breadcrumbs={[
          { label: 'Merchants', href: '/merchants' },
          { label: merchant.name },
        ]}
        actions={
          <div className="flex gap-2">
            <RoleGate allowed={['support', 'ops', 'admin']}>
              <Button variant="outline">
                <Ticket className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            </RoleGate>
            <Button variant="outline">
              <CheckSquare className="h-4 w-4 mr-2" />
              Add Task
            </Button>
            <RoleGate allowed={['sales', 'admin']}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </RoleGate>
          </div>
        }
      />

      {/* Merchant Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{merchant.name}</h2>
                <StatusBadge status={merchant.status as 'active' | 'inactive' | 'suspended' | 'onboarding'} />
              </div>
              <p className="text-muted-foreground">
                Legal Name: {merchant.legal_name || 'Not set'}
              </p>
              <p className="text-sm text-muted-foreground">
                MCC: {merchant.mcc_code || 'Not set'}
              </p>
            </div>
            <div className="flex gap-8 text-sm">
              <div>
                <p className="text-muted-foreground">Sales Rep</p>
                <p className="font-medium">
                  {merchant.sales_rep?.full_name || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Support Rep</p>
                <p className="font-medium">
                  {merchant.support_rep?.full_name || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Onboarded</p>
                <p className="font-medium">
                  {merchant.onboarded_at
                    ? new Date(merchant.onboarded_at).toLocaleDateString()
                    : 'In progress'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <ActivityTab merchantId={id!} />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsTab merchantId={id!} />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab merchantId={id!} />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsTab merchantId={id!} contacts={merchant.contacts || []} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab merchantId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
