import { useState, useCallback } from 'react'
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

// Drag state shared across the board
interface DragState {
  itemId: string
  sourceColumn: ReviewStatus
}

interface DropIndicator {
  column: ReviewStatus
  index: number // insert before this index, -1 = end
}

// --- KanbanCard ---

interface KanbanCardProps {
  item: ReviewableItem
  serviceId: string
  type: 'contacts' | 'orders'
  onUpdated: () => void
  onDragStart: (itemId: string, column: ReviewStatus) => void
  isDragging: boolean
  showDropBefore: boolean
}

function KanbanCard({ item, serviceId, type, onUpdated, onDragStart, isDragging, showDropBefore }: KanbanCardProps) {
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

  function handleDragStartEvent(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', itemId)
    e.dataTransfer.effectAllowed = 'move'
    // Small delay so the browser captures the drag image before we change opacity
    requestAnimationFrame(() => onDragStart(itemId, item.reviewStatus ?? 'to-review'))
  }

  const contact = isContact(item) ? item : null
  const order = !isContact(item) ? item : null

  return (
    <>
      {showDropBefore && (
        <div className="h-1 rounded-full bg-primary/40 mx-1 transition-all duration-200 animate-fade-in" />
      )}
      <Card
        draggable
        onDragStart={handleDragStartEvent}
        className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md group transition-all duration-150 ${
          isDragging ? 'opacity-30 scale-95' : 'hover:-translate-y-0.5'
        }`}
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
    </>
  )
}

// --- KanbanBoard ---

interface KanbanBoardProps {
  items: ReviewableItem[]
  serviceId: string
  type: 'contacts' | 'orders'
  onUpdated: () => void
}

export function KanbanBoard({ items, serviceId, type, onUpdated }: KanbanBoardProps) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null)

  function getColumnItems(status: ReviewStatus): ReviewableItem[] {
    return items.filter((item) => (item.reviewStatus ?? 'to-review') === status)
  }

  function handleCardDragStart(itemId: string, column: ReviewStatus) {
    setDragState({ itemId, sourceColumn: column })
  }

  const handleCardDragOver = useCallback((e: React.DragEvent, column: ReviewStatus, colItems: ReviewableItem[]) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    // Find which card the cursor is closest to
    const columnEl = e.currentTarget as HTMLElement
    const cardEls = Array.from(columnEl.querySelectorAll('[data-card-id]')) as HTMLElement[]

    if (cardEls.length === 0) {
      setDropIndicator({ column, index: 0 })
      return
    }

    let insertIndex = colItems.length // default: end
    for (let i = 0; i < cardEls.length; i++) {
      const rect = cardEls[i].getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      if (e.clientY < midY) {
        insertIndex = i
        break
      }
    }

    setDropIndicator({ column, index: insertIndex })
  }, [])

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the column entirely (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement | null
    const currentTarget = e.currentTarget as HTMLElement
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDropIndicator(null)
    }
  }

  async function handleDrop(e: React.DragEvent, targetColumn: ReviewStatus) {
    e.preventDefault()
    setDropIndicator(null)

    if (!dragState) return

    const { itemId, sourceColumn } = dragState
    setDragState(null)

    // If moved to a different column, update status
    if (sourceColumn !== targetColumn) {
      await updateReview(serviceId, type, itemId, { reviewStatus: targetColumn })
      onUpdated()
    }
    // Within same column: reorder is visual only (no backend persistence for order yet)
  }

  function handleDragEnd() {
    setDragState(null)
    setDropIndicator(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]" onDragEnd={handleDragEnd}>
      {COLUMNS.map((col) => {
        const colItems = getColumnItems(col.id)
        const isOver = dropIndicator?.column === col.id

        return (
          <div
            key={col.id}
            onDrop={(e) => handleDrop(e, col.id)}
            onDragOver={(e) => handleCardDragOver(e, col.id, colItems)}
            onDragLeave={handleDragLeave}
            className={`rounded-xl border-2 border-dashed p-3 transition-all duration-200 ${
              isOver
                ? `${col.borderColor} ${col.bgColor}`
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

            <div className="space-y-2 min-h-[60px]">
              {colItems.length === 0 && !isOver ? (
                <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/50">
                  No items
                </div>
              ) : (
                <>
                  {colItems.length === 0 && isOver && (
                    <div className="h-1 rounded-full bg-primary/40 mx-1 animate-fade-in" />
                  )}
                  {colItems.map((item, i) => (
                    <div key={String(item.id)} data-card-id={String(item.id)}>
                      <KanbanCard
                        item={item}
                        serviceId={serviceId}
                        type={type}
                        onUpdated={onUpdated}
                        onDragStart={handleCardDragStart}
                        isDragging={dragState?.itemId === String(item.id)}
                        showDropBefore={
                          dropIndicator?.column === col.id &&
                          dropIndicator.index === i &&
                          dragState?.itemId !== String(item.id)
                        }
                      />
                    </div>
                  ))}
                  {/* Drop indicator at the end */}
                  {dropIndicator?.column === col.id &&
                    dropIndicator.index >= colItems.length &&
                    dragState?.itemId !== String(colItems[colItems.length - 1]?.id) && (
                    <div className="h-1 rounded-full bg-primary/40 mx-1 animate-fade-in" />
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
