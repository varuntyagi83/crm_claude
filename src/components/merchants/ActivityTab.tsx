import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useMerchantActivities, useCreateActivity } from '@/hooks/useActivities'
import { formatRelativeTime } from '@/lib/utils'
import type { ActivityType } from '@/types/database'
import { Phone, Mail, FileText, Calendar, Activity, Loader2 } from 'lucide-react'

const activityTypeOptions = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
]

const activityIcons: Record<ActivityType, typeof Phone> = {
  note: FileText,
  call: Phone,
  email: Mail,
  meeting: Calendar,
  status_change: Activity,
  system: Activity,
}

interface ActivityTabProps {
  merchantId: string
}

export function ActivityTab({ merchantId }: ActivityTabProps) {
  const { data: activities, isLoading } = useMerchantActivities(merchantId)
  const createActivity = useCreateActivity()

  const [type, setType] = useState<ActivityType>('note')
  const [content, setContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      await createActivity.mutateAsync({
        merchant_id: merchantId,
        type,
        content: content.trim(),
      })
      setContent('')
    } catch (error) {
      console.error('Failed to create activity:', error)
    }
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Add Note Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <Select
                options={activityTypeOptions}
                value={type}
                onChange={(e) => setType(e.target.value as ActivityType)}
                className="w-32"
              />
              <Textarea
                placeholder="Enter your note, call summary, or meeting notes..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 min-h-[80px]"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!content.trim() || createActivity.isPending}>
                {createActivity.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Add {activityTypeOptions.find(o => o.value === type)?.label}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activity recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {activities?.map((activity) => {
                const Icon = activityIcons[activity.type]
                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm">{activity.content}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(activity.created_at!)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.created_user?.full_name || 'System'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
