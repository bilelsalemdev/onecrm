import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { updateReview } from '@/services/api'
import { CardDetailDialog } from './CardDetailDialog'
import type { ReviewStatus, ReviewableContact, ReviewableOrder } from '@onecrm/shared'
import { Package, GripVertical, Flag, Calendar } from 'lucide-react'

type ReviewableItem = ReviewableContact | ReviewableOrder

interface ColumnDef {
  id: ReviewStatus
  title: string
  color: string
  bgColor: string
  dotColor: string
  borderActive: string
}

const COLUMNS: ColumnDef[] = [
  { id: 'to-review', title: 'To Be Reviewed', color: 'text-amber-600', bgColor: 'bg-amber-50', dotColor: 'bg-amber-400', borderActive: 'border-amber-300' },
  { id: 'under-review', title: 'Under Review', color: 'text-blue-600', bgColor: 'bg-blue-50', dotColor: 'bg-blue-400', borderActive: 'border-blue-300' },
  { id: 'completed', title: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-50', dotColor: 'bg-emerald-400', borderActive: 'border-emerald-300' },
]

const PRIORITY_BADGE: Record<string, { color: string; bg: string }> = {
  low: { color: 'text-slate-500', bg: 'bg-slate-100' },
  medium: { color: 'text-blue-500', bg: 'bg-blue-50' },
  high: { color: 'text-orange-600', bg: 'bg-orange-50' },
  urgent: { color: 'text-red-600', bg: 'bg-red-50' },
}

function isContact(item: ReviewableItem): item is ReviewableContact {
  return 'email' in item && 'phone' in item && 'message' in item
}

// --- Kanban Card ---

function KanbanCard({
  item,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  item: ReviewableItem
  onDragStart: (e: React.DragEvent, item: ReviewableItem) => void
  onDragEnd: (e: React.DragEvent) => void
  onClick: (item: ReviewableItem) => void
}) {
  const contact = isContact(item) ? item : null
  const order = !isContact(item) ? item : null
  const allAssignees = item.assignees ?? (item.assignedTo ? [item.assignedTo] : [])
  const prio = PRIORITY_BADGE[item.priority ?? '']

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(item)}
      className="mb-2 cursor-pointer"
    >
      <Card className="p-3 hover:shadow-md hover:border-primary/20 transition-all duration-150 active:shadow-lg">
        <div className="space-y-2">
          {/* Header: name + grip */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {contact ? contact.name : order?.customerName}
              </p>
              <p className="text-xs text-muted-foreground/60 truncate">
                {contact ? contact.email : order?.customerEmail}
              </p>
            </div>
            <div className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted">
              <GripVertical className="h-4 w-4 text-muted-foreground/30" />
            </div>
          </div>

          {/* Contact: message */}
          {contact?.message && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-2 py-1.5 line-clamp-3">
              {contact.message}
            </p>
          )}

          {/* Order: product + amount */}
          {order && (
            <div className="flex items-center justify-between text-xs bg-muted/40 rounded-md px-2 py-1.5">
              <span className="flex items-center gap-1 text-muted-foreground truncate">
                <Package className="h-3 w-3 shrink-0" />
                {order.product}
              </span>
              <span className="font-semibold shrink-0 ml-2">
                {Number(order.amount).toFixed(0)} {order.currency}
              </span>
            </div>
          )}

          {/* Meta row: priority + assignees + date */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {prio && (
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${prio.bg} ${prio.color}`}>
                <Flag className="h-2.5 w-2.5" />
                {item.priority}
              </span>
            )}

            {allAssignees.length > 0 && (
              <div className="flex -space-x-1.5">
                {allAssignees.slice(0, 3).map((email) => (
                  <div
                    key={email}
                    title={email}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary ring-2 ring-card"
                  >
                    {email[0].toUpperCase()}
                  </div>
                ))}
                {allAssignees.length > 3 && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground ring-2 ring-card">
                    +{allAssignees.length - 3}
                  </div>
                )}
              </div>
            )}

            <span className="text-[10px] text-muted-foreground/50 ml-auto flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {item.date}
            </span>
          </div>

          {/* Note preview */}
          {item.note && (
            <p className="text-[10px] text-muted-foreground/50 italic line-clamp-1 border-t border-border/30 pt-1.5">
              {item.note}
            </p>
          )}
        </div>
      </Card>
    </div>
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
  const [dragOverColumn, setDragOverColumn] = useState<ReviewStatus | null>(null)
  const [detailItem, setDetailItem] = useState<ReviewableItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const dragItemRef = useRef<{ id: string; sourceColumn: ReviewStatus } | null>(null)

  function getColumnItems(status: ReviewStatus): ReviewableItem[] {
    return items.filter((item) => (item.reviewStatus ?? 'to-review') === status)
  }

  function handleDragStart(e: React.DragEvent, item: ReviewableItem) {
    dragItemRef.current = {
      id: String(item.id),
      sourceColumn: item.reviewStatus ?? 'to-review',
    }
    e.dataTransfer.effectAllowed = 'move'
    // Make the drag ghost slightly transparent
    const el = e.currentTarget as HTMLElement
    requestAnimationFrame(() => { el.style.opacity = '0.4' })
  }

  function handleCardDragEnd(e: React.DragEvent) {
    const el = e.currentTarget as HTMLElement
    el.style.opacity = '1'
  }

  function handleColumnDragOver(e: React.DragEvent, columnId: ReviewStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  function handleColumnDragLeave(e: React.DragEvent) {
    const related = e.relatedTarget as HTMLElement | null
    const current = e.currentTarget as HTMLElement
    if (!related || !current.contains(related)) {
      setDragOverColumn(null)
    }
  }

  async function handleColumnDrop(e: React.DragEvent, targetColumn: ReviewStatus) {
    e.preventDefault()
    setDragOverColumn(null)

    const drag = dragItemRef.current
    if (!drag) return
    dragItemRef.current = null

    if (drag.sourceColumn === targetColumn) return

    await updateReview(serviceId, type, drag.id, { reviewStatus: targetColumn })
    onUpdated()
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
        {COLUMNS.map((col) => {
          const colItems = getColumnItems(col.id)
          const isOver = dragOverColumn === col.id

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleColumnDragOver(e, col.id)}
              onDragLeave={handleColumnDragLeave}
              onDrop={(e) => handleColumnDrop(e, col.id)}
              className={`rounded-xl border-2 border-dashed p-3 transition-all duration-200 ${
                isOver
                  ? `${col.borderActive} ${col.bgColor} scale-[1.005]`
                  : 'border-border/50 bg-muted/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className={`text-sm font-semibold ${col.color}`}>{col.title}</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5 font-medium shadow-sm">
                  {colItems.length}
                </span>
              </div>

              <div className="min-h-[60px]">
                {colItems.length === 0 ? (
                  <div className={`flex items-center justify-center py-8 text-xs transition-colors duration-200 ${
                    isOver ? col.color : 'text-muted-foreground/40'
                  }`}>
                    {isOver ? 'Drop here' : 'No items'}
                  </div>
                ) : (
                  colItems.map((item) => (
                    <KanbanCard
                      key={String(item.id)}
                      item={item}
                      onDragStart={handleDragStart}
                      onDragEnd={handleCardDragEnd}
                      onClick={(item) => { setDetailItem(item); setDetailOpen(true) }}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <CardDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        item={detailItem}
        serviceId={serviceId}
        type={type}
        onUpdated={onUpdated}
      />
    </>
  )
}
