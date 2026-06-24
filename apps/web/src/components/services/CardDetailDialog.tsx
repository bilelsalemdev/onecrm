import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { updateReview } from '@/services/api'
import { formatAmount, formatDate } from '@/lib/utils'
import type { ReviewStatus, Priority, ReviewableContact, ReviewableOrder } from '@onecrm/shared'
import { Mail, Phone, MessageSquare, Package, DollarSign, Calendar, UserPlus, X, Loader2, Flag } from 'lucide-react'

type ReviewableItem = ReviewableContact | ReviewableOrder

const STATUS_OPTIONS: { value: ReviewStatus; label: string; color: string }[] = [
  { value: 'to-review', label: 'To review', color: 'bg-lamp-red text-lamp-red' },
  { value: 'under-review', label: 'Under review', color: 'bg-lamp-amber text-lamp-amber' },
  { value: 'completed', label: 'Completed', color: 'bg-lamp-green text-lamp-green' },
]

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'Medium', color: 'bg-primary/15 text-primary' },
  { value: 'high', label: 'High', color: 'bg-lamp-amber/15 text-lamp-amber' },
  { value: 'urgent', label: 'Urgent', color: 'bg-lamp-red/15 text-lamp-red' },
]

interface CardDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ReviewableItem | null
  serviceId: string
  type: 'contacts' | 'orders'
  onUpdated: () => void
}

export function CardDetailDialog({ open, onOpenChange, item, serviceId, type, onUpdated }: CardDetailDialogProps) {
  const [status, setStatus] = useState<ReviewStatus>('to-review')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [assignees, setAssignees] = useState<string[]>([])
  const [newAssignee, setNewAssignee] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item && open) {
      setStatus(item.reviewStatus ?? 'to-review')
      setPriority(item.priority ?? '')
      setAssignees(item.assignees ?? (item.assignedTo ? [item.assignedTo] : []))
      setNote(item.note ?? '')
      setNewAssignee('')
    }
  }, [item, open])

  if (!item) return null

  const contact = type === 'contacts' ? (item as ReviewableContact) : null
  const order = type === 'orders' ? (item as ReviewableOrder) : null

  function addAssignee() {
    const email = newAssignee.trim()
    if (!email || assignees.includes(email)) return
    setAssignees([...assignees, email])
    setNewAssignee('')
  }

  function removeAssignee(email: string) {
    setAssignees(assignees.filter((a) => a !== email))
  }

  async function handleSave() {
    if (!item) return
    setSaving(true)
    try {
      await updateReview(serviceId, type, String(item.id), {
        reviewStatus: status,
        ...(priority ? { priority: priority as Priority } : {}),
        assignees,
        note,
      })
      onUpdated()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {contact ? contact.name : order?.customerName}
          </DialogTitle>
          <DialogDescription>
            {contact ? contact.email : order?.customerEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Item info */}
          <div className="rounded-lg bg-muted/40 p-4 space-y-2.5">
            {contact && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.email}</span>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                {contact.message && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium">Message</span>
                    </div>
                    <p className="text-sm text-muted-foreground bg-background rounded-md p-2.5 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {contact.message}
                    </p>
                  </div>
                )}
              </>
            )}
            {order && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{order.product}</span>
                </div>
                {formatAmount(order.amount, order.currency) && (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatAmount(order.amount, order.currency)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(item.date)}</span>
            </div>
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => { if (v) setStatus(v as ReviewStatus) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${opt.color.split(' ')[0]}`} />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority || '__none__'} onValueChange={(v) => { if (v != null) setPriority(v === '__none__' ? '' : v as Priority) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">No priority</span>
                  </SelectItem>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <Flag className={`h-3 w-3 ${opt.color.split(' ')[1]}`} />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Assignees</Label>
            {assignees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {assignees.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1 pr-1 text-xs">
                    <Mail className="h-3 w-3" />
                    {email}
                    <button
                      onClick={() => removeAssignee(email)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="Add assignee email..."
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAssignee() } }}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addAssignee}
                disabled={!newAssignee.trim()}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="review-note">Note</Label>
            <textarea
              id="review-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this item..."
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
