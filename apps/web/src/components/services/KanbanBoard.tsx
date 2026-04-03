import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateReview } from '@/services/api'
import type { ReviewStatus, ReviewableContact, ReviewableOrder } from '@onecrm/shared'
import { Mail, Phone, MessageSquare, Package, DollarSign, UserPlus, X, Send, GripVertical } from 'lucide-react'

type ReviewableItem = ReviewableContact | ReviewableOrder

interface Column {
  id: ReviewStatus
  title: string
  color: string
  bgColor: string
  borderColor: string
}

const COLUMNS: Column[] = [
  { id: 'to-review', title: 'To Be Reviewed', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'under-review', title: 'Under Review', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'completed', title: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
]

function isContact(item: ReviewableItem): item is ReviewableContact {
  return 'email' in item && 'phone' in item && 'message' in item
}

interface KanbanCardProps {
  item: ReviewableItem
  serviceId: string
  type: 'contacts' | 'orders'
  onUpdated: () => void
}

function KanbanCard({ item, serviceId, type, onUpdated }: KanbanCardProps) {
  const [assigning, setAssigning] = useState(false)
  const [assignEmail, setAssignEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const itemId = String(item.id)

  async function handleAssign() {
    if (!assignEmail.trim()) return
    setSaving(true)
    try {
      await updateReview(serviceId, type, itemId, { assignedTo: assignEmail.trim() })
      setAssigning(false)
      setAssignEmail('')
      onUpdated()
    } finally {
      setSaving(false)
    }
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ itemId, currentStatus: item.reviewStatus }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const contact = isContact(item) ? item : null
  const order = !isContact(item) ? item : null

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 group animate-fade-in-up"
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {contact ? contact.name : order?.customerName}
            </p>
            <p className="text-xs text-muted-foreground/70 truncate">
              {contact ? contact.email : order?.customerEmail}
            </p>
          </div>
          <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {contact && (
          <div className="space-y-1">
            {contact.phone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span className="truncate">{contact.phone}</span>
              </div>
            )}
            {contact.message && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{contact.message}</span>
              </div>
            )}
          </div>
        )}

        {order && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              <span className="truncate">{order.product}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <DollarSign className="h-3 w-3" />
              <span>{Number(order.amount).toFixed(2)} {order.currency}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground/60">{item.date}</span>

          {item.assignedTo ? (
            <Badge variant="secondary" className="text-[10px] gap-1 py-0 h-5">
              <Mail className="h-2.5 w-2.5" />
              {item.assignedTo.split('@')[0]}
            </Badge>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              className="text-[10px] text-muted-foreground/60 hover:text-primary h-5 px-1.5"
              onClick={() => setAssigning(true)}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Assign
            </Button>
          )}
        </div>

        {assigning && (
          <div className="flex items-center gap-1.5 pt-1 animate-fade-in">
            <Input
              type="email"
              placeholder="email@company.com"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAssign(); if (e.key === 'Escape') setAssigning(false) }}
            />
            <Button size="icon-xs" onClick={handleAssign} disabled={saving || !assignEmail.trim()}>
              <Send className="h-3 w-3" />
            </Button>
            <Button size="icon-xs" variant="ghost" onClick={() => setAssigning(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

interface KanbanBoardProps {
  items: ReviewableItem[]
  serviceId: string
  type: 'contacts' | 'orders'
  onUpdated: () => void
}

export function KanbanBoard({ items, serviceId, type, onUpdated }: KanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<ReviewStatus | null>(null)

  function getColumnItems(status: ReviewStatus): ReviewableItem[] {
    return items.filter((item) => (item.reviewStatus ?? 'to-review') === status)
  }

  async function handleDrop(e: React.DragEvent, targetStatus: ReviewStatus) {
    e.preventDefault()
    setDragOverColumn(null)

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { itemId: string; currentStatus: ReviewStatus }
      if (data.currentStatus === targetStatus) return

      await updateReview(serviceId, type, data.itemId, { reviewStatus: targetStatus })
      onUpdated()
    } catch {
      // ignore parse errors
    }
  }

  function handleDragOver(e: React.DragEvent, status: ReviewStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  function handleDragLeave() {
    setDragOverColumn(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
      {COLUMNS.map((col) => {
        const colItems = getColumnItems(col.id)
        const isOver = dragOverColumn === col.id

        return (
          <div
            key={col.id}
            onDrop={(e) => handleDrop(e, col.id)}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            className={`rounded-xl border-2 border-dashed p-3 transition-all duration-200 ${
              isOver
                ? `${col.borderColor} ${col.bgColor} scale-[1.01]`
                : 'border-border/50 bg-muted/20'
            }`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${col.bgColor} ring-2 ${col.borderColor}`} />
                <h3 className={`text-sm font-semibold ${col.color}`}>{col.title}</h3>
              </div>
              <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5 font-medium shadow-sm">
                {colItems.length}
              </span>
            </div>

            <div className="space-y-2">
              {colItems.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/50">
                  {isOver ? 'Drop here' : 'No items'}
                </div>
              ) : (
                colItems.map((item) => (
                  <KanbanCard
                    key={String(item.id)}
                    item={item}
                    serviceId={serviceId}
                    type={type}
                    onUpdated={onUpdated}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
