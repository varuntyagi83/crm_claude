import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityBadge } from '@/components/shared/PriorityBadge'
import { RoleGate } from '@/components/shared/RoleGate'
import { useTicket, useUpdateTicket } from '@/hooks/useTickets'
import { useTicketActivities, useCreateActivity } from '@/hooks/useActivities'
import { useAuth } from '@/hooks/useAuth'
import { formatRelativeTime } from '@/lib/utils'
import {
  ArrowLeft,
  Building2,
  User,
  Calendar,
  MessageSquare,
  Send,
  Loader2
} from 'lucide-react'

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_merchant', label: 'Waiting on Merchant' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  useAuth() // For permission checks
  const { data: ticket, isLoading } = useTicket(id!)
  const { data: activities, isLoading: activitiesLoading } = useTicketActivities(id!)
  const updateTicket = useUpdateTicket()
  const createActivity = useCreateActivity()

  const [replyContent, setReplyContent] = useState('')

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return
    try {
      await updateTicket.mutateAsync({
        id: ticket.id,
        updates: { status: newStatus as any },
      })
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return
    try {
      await updateTicket.mutateAsync({
        id: ticket.id,
        updates: { priority: newPriority as any },
      })
    } catch (error) {
      console.error('Failed to update priority:', error)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || !ticket?.merchant_id) return

    try {
      await createActivity.mutateAsync({
        merchant_id: ticket.merchant_id,
        ticket_id: ticket.id,
        type: 'note',
        content: replyContent.trim(),
      })
      setReplyContent('')
    } catch (error) {
      console.error('Failed to add reply:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Ticket not found</p>
            <Button asChild className="mt-4">
              <Link to="/tickets">Back to Tickets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Tickets', href: '/tickets' },
          { label: ticket.subject || 'Ticket' },
        ]}
        title={ticket.subject || 'Untitled Ticket'}
        actions={
          <Button variant="outline" asChild>
            <Link to="/tickets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {ticket.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Activity Thread */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Activity ({activities?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : activities?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity yet
                </p>
              ) : (
                <div className="space-y-4">
                  {activities?.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {(activity as any).performed_by_user?.full_name || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.created_at!)}
                          </span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {activity.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              <RoleGate allowed={['support', 'ops', 'admin']}>
                <form onSubmit={handleReply} className="mt-6 pt-4 border-t">
                  <Textarea
                    placeholder="Add a reply or note..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <Button
                      type="submit"
                      disabled={!replyContent.trim() || createActivity.isPending}
                    >
                      {createActivity.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      <Send className="h-4 w-4 mr-2" />
                      Add Reply
                    </Button>
                  </div>
                </form>
              </RoleGate>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <RoleGate
                  allowed={['support', 'ops', 'admin']}
                  fallback={<StatusBadge status={ticket.status || 'open'} />}
                >
                  <Select
                    options={statusOptions}
                    value={ticket.status || 'open'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  />
                </RoleGate>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <RoleGate
                  allowed={['support', 'ops', 'admin']}
                  fallback={<PriorityBadge priority={ticket.priority || 'medium'} />}
                >
                  <Select
                    options={priorityOptions}
                    value={ticket.priority || 'medium'}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                  />
                </RoleGate>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <span className="text-sm capitalize">{ticket.category || 'General'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {(ticket as any).assigned_user?.full_name || 'Unassigned'}
                  </p>
                  <p className="text-xs text-muted-foreground">Assigned Agent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Merchant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Merchant</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                to={`/merchants/${ticket.merchant_id}`}
                className="flex items-center gap-3 hover:bg-muted -m-2 p-2 rounded-md transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {(ticket as any).merchant?.business_name || 'Unknown Merchant'}
                  </p>
                  <p className="text-xs text-muted-foreground">View Merchant Details</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(ticket.created_at!).toLocaleString()}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Resolved:</span>
                  <span>{new Date(ticket.resolved_at).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
