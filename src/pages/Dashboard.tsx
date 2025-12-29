import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { RoleGate } from '@/components/shared/RoleGate'
import { MetricCard } from '@/components/shared/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyMerchants } from '@/hooks/useMerchants'
import { useMyTasks, useTaskCounts } from '@/hooks/useTasks'
import { useTicketCounts, useTickets } from '@/hooks/useTickets'
import { useRecentActivities } from '@/hooks/useActivities'
import { useTotalVolume, useFailedRate, useDailyVolume } from '@/hooks/useTransactions'
import { useMerchantCounts } from '@/hooks/useMerchants'
import { TicketForm } from '@/components/tickets/TicketForm'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/utils'
import {
  Store,
  Ticket,
  CheckSquare,
  Activity,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Plus,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function Dashboard() {
  const { profile } = useAuth()

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${profile?.full_name}`}
      />

      <RoleGate allowed={['sales']}>
        <SalesDashboard />
      </RoleGate>

      <RoleGate allowed={['support']}>
        <SupportDashboard />
      </RoleGate>

      <RoleGate allowed={['ops']}>
        <OpsDashboard />
      </RoleGate>

      <RoleGate allowed={['admin']}>
        <AdminDashboard />
      </RoleGate>
    </div>
  )
}

function SalesDashboard() {
  const { user } = useAuth()
  const { data: merchants, isLoading: merchantsLoading } = useMyMerchants(user?.id)
  const { data: tasks, isLoading: tasksLoading } = useMyTasks()
  const { data: taskCounts } = useTaskCounts()
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities(user?.id, 5)

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="My Merchants"
          value={merchants?.length ?? 0}
          icon={Store}
          loading={merchantsLoading}
        />
        <MetricCard
          title="Open Tasks"
          value={taskCounts?.pending ?? 0}
          subtitle={taskCounts?.overdue ? `${taskCounts.overdue} overdue` : undefined}
          icon={CheckSquare}
        />
        <MetricCard
          title="Recent Activity"
          value={activities?.length ?? 0}
          subtitle="this week"
          icon={Activity}
          loading={activitiesLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Merchants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My Merchants</CardTitle>
            <Link to="/merchants">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {merchantsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : merchants?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No merchants assigned
              </p>
            ) : (
              <div className="space-y-3">
                {merchants?.slice(0, 5).map((m) => (
                  <Link
                    key={m.id}
                    to={`/merchants/${m.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.legal_name || 'No legal name'}
                      </p>
                    </div>
                    <StatusBadge status={m.status as 'active' | 'inactive' | 'suspended' | 'onboarding'} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My Tasks</CardTitle>
            <Link to="/tasks">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tasks?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                All caught up!
              </p>
            ) : (
              <div className="space-y-3">
                {tasks?.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.merchant?.name}
                      </p>
                    </div>
                    <span className={`text-sm ${t.due_date && new Date(t.due_date) < new Date() ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No due date'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SupportDashboard() {
  const { user } = useAuth()
  const { data: counts } = useTicketCounts(user?.id)
  const { data: myTickets, isLoading: myTicketsLoading } = useTickets({ assignedTo: user?.id, limit: 5 })
  const { data: unassignedTickets, isLoading: unassignedLoading } = useTickets({ limit: 5 })
  const [showTicketForm, setShowTicketForm] = useState(false)

  return (
    <div className="space-y-6">
      {/* Metrics with Create Ticket Button */}
      <div className="flex items-center justify-between">
        <div className="grid gap-4 md:grid-cols-3 flex-1">
          <MetricCard
            title="Open Tickets"
            value={counts?.open ?? 0}
            icon={Ticket}
          />
          <MetricCard
            title="Urgent"
            value={counts?.urgent ?? 0}
            icon={AlertTriangle}
            className={counts?.urgent && counts.urgent > 0 ? 'border-destructive' : ''}
          />
          <MetricCard
            title="My Assigned"
            value={counts?.assigned ?? 0}
            icon={CheckSquare}
          />
        </div>
        <Button onClick={() => setShowTicketForm(true)} className="ml-4">
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* My Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My Assigned Tickets</CardTitle>
            <Link to="/tickets?assigned=me">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {myTicketsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : myTickets?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tickets assigned
              </p>
            ) : (
              <div className="space-y-3">
                {myTickets?.map((t) => (
                  <Link
                    key={t.id}
                    to={`/tickets/${t.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{t.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.merchant?.name}
                        </p>
                      </div>
                      <PriorityBadge priority={t.priority || 'medium'} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unassigned */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Unassigned Tickets</CardTitle>
            <Link to="/tickets?unassigned=true">
              <Button variant="ghost" size="sm">Assign</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {unassignedLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {unassignedTickets?.filter(t => !t.assigned_to).slice(0, 5).map((t) => (
                  <Link
                    key={t.id}
                    to={`/tickets/${t.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{t.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.merchant?.name}
                        </p>
                      </div>
                      <StatusBadge status={t.status || 'open'} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Form Dialog */}
      {showTicketForm && (
        <TicketForm onClose={() => setShowTicketForm(false)} />
      )}
    </div>
  )
}

function OpsDashboard() {
  const { data: merchantCounts } = useMerchantCounts()
  const { data: totalVolume, isLoading: volumeLoading } = useTotalVolume(30)
  const { data: failedRate, isLoading: rateLoading } = useFailedRate(30)
  const { data: dailyVolume, isLoading: chartLoading } = useDailyVolume(30)
  const [showTicketForm, setShowTicketForm] = useState(false)

  return (
    <div className="space-y-6">
      {/* Metrics with Create Ticket Button */}
      <div className="flex items-center justify-between">
        <div className="grid gap-4 md:grid-cols-3 flex-1">
          <MetricCard
            title="Active Merchants"
            value={merchantCounts?.active ?? 0}
            icon={Store}
          />
          <MetricCard
            title="Transaction Volume (30d)"
            value={formatCurrency(totalVolume ?? 0)}
            icon={DollarSign}
            loading={volumeLoading}
          />
          <MetricCard
            title="Failed Transaction Rate"
            value={`${(failedRate ?? 0).toFixed(2)}%`}
            icon={TrendingUp}
            loading={rateLoading}
          />
        </div>
        <Button onClick={() => setShowTicketForm(true)} className="ml-4">
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction Volume Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency((value as number) * 100), 'Volume']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(221.2 83.2% 53.3%)"
                  fill="hsl(221.2 83.2% 53.3% / 0.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Ticket Form Dialog */}
      {showTicketForm && (
        <TicketForm onClose={() => setShowTicketForm(false)} />
      )}
    </div>
  )
}

function AdminDashboard() {
  const { data: merchantCounts } = useMerchantCounts()
  const { data: ticketCounts } = useTicketCounts()
  const { data: totalVolume, isLoading: volumeLoading } = useTotalVolume(30)
  const { data: dailyVolume, isLoading: chartLoading } = useDailyVolume(30)
  const [showTicketForm, setShowTicketForm] = useState(false)

  return (
    <div className="space-y-6">
      {/* Metrics with Create Ticket Button */}
      <div className="flex items-center justify-between">
        <div className="grid gap-4 md:grid-cols-4 flex-1">
          <MetricCard
            title="Total Merchants"
            value={merchantCounts?.total ?? 0}
            icon={Store}
          />
          <MetricCard
            title="Active Merchants"
            value={merchantCounts?.active ?? 0}
            icon={Store}
          />
          <MetricCard
            title="Open Tickets"
            value={ticketCounts?.open ?? 0}
            icon={Ticket}
          />
          <MetricCard
            title="Transaction Volume (30d)"
            value={formatCurrency(totalVolume ?? 0)}
            icon={DollarSign}
            loading={volumeLoading}
          />
        </div>
        <Button onClick={() => setShowTicketForm(true)} className="ml-4">
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction Volume Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency((value as number) * 100), 'Volume']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(221.2 83.2% 53.3%)"
                  fill="hsl(221.2 83.2% 53.3% / 0.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Ticket Form Dialog */}
      {showTicketForm && (
        <TicketForm onClose={() => setShowTicketForm(false)} />
      )}
    </div>
  )
}
