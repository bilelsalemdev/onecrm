import { useState, useRef } from 'react'
import { updateReview } from '@/services/api'
import { formatAmount, formatDate } from '@/lib/utils'
import { CardDetailDialog } from './CardDetailDialog'
import type { ReviewStatus, ReviewableContact, ReviewableOrder } from '@onecrm/shared'
import { Package, GripVertical, Calendar } from 'lucide-react'

type ReviewableItem = ReviewableContact | ReviewableOrder

interface ColumnDef {
  id: ReviewStatus
  title: string
  lampVar: string
  lampClass: string
}

const COLUMNS: ColumnDef[] = [
  { id: 'to-review', title: 'To review', lampVar: '--lamp-red', lampClass: 'text-lamp-red' },
  { id: 'under-review', title: 'Under review', lampVar: '--lamp-amber', lampClass: 'text-lamp-amber' },
  { id: 'completed', title: 'Completed', lampVar: '--lamp-green', lampClass: 'text-lamp-green' },
]

const PRIORITY: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-primary',
  high: 'text-lamp-amber',
  urgent: 'text-lamp-red',
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
  const prioClass = item.priority ? PRIORITY[item.priority] : undefined

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(item)}
      className="mb-2 cursor-pointer rounded-md border border-border bg-card p-3 transition-colors duration-150 hover:border-foreground/25"
    >
      <div className="space-y-2.5">
        {/* Header: name + grip */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{contact ? contact.name : order?.customerName}</p>
            <p className="readout truncate text-[11px] text-muted-foreground">{contact ? contact.email : order?.customerEmail}</p>
          </div>
          <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/30 active:cursor-grabbing" />
        </div>

        {/* Contact: message */}
        {contact?.message && (
          <p className="line-clamp-3 rounded bg-muted/70 px-2 py-1.5 text-xs leading-relaxed text-muted-foreground">
            {contact.message}
          </p>
        )}

        {/* Order: product + amount */}
        {order && (order.product || formatAmount(order.amount, order.currency)) && (
          <div className="flex items-center justify-between gap-2 rounded bg-muted/70 px-2 py-1.5 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <Package className="h-3 w-3 shrink-0" />
              <span className="truncate">{order.product || '—'}</span>
            </span>
            {formatAmount(order.amount, order.currency) && (
              <span className="readout shrink-0 font-medium text-foreground tabular-nums">
                {formatAmount(order.amount, order.currency)}
              </span>
            )}
          </div>
        )}

        {/* Meta: priority + assignees + date */}
        <div className="flex flex-wrap items-center gap-1.5">
          {prioClass && (
            <span className={`readout inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${prioClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {item.priority}
            </span>
          )}

          {allAssignees.length > 0 && (
            <div className="flex -space-x-1.5">
              {allAssignees.slice(0, 3).map((email) => (
                <div
                  key={email}
                  title={email}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary ring-2 ring-card"
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

          <span className="readout ml-auto flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground/60">
            <Calendar className="h-2.5 w-2.5" />
            {formatDate(item.date)}
          </span>
        </div>

        {/* Note preview */}
        {item.note && (
          <p className="line-clamp-1 border-t border-border/60 pt-1.5 text-[11px] italic text-muted-foreground/70">{item.note}</p>
        )}
      </div>
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
    dragItemRef.current = { id: String(item.id), sourceColumn: item.reviewStatus ?? 'to-review' }
    e.dataTransfer.effectAllowed = 'move'
    const el = e.currentTarget as HTMLElement
    requestAnimationFrame(() => { el.style.opacity = '0.4' })
  }

  function handleCardDragEnd(e: React.DragEvent) {
    ;(e.currentTarget as HTMLElement).style.opacity = '1'
  }

  function handleColumnDragOver(e: React.DragEvent, columnId: ReviewStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  function handleColumnDragLeave(e: React.DragEvent) {
    const related = e.relatedTarget as HTMLElement | null
    const current = e.currentTarget as HTMLElement
    if (!related || !current.contains(related)) setDragOverColumn(null)
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
      <div className="grid min-h-[420px] grid-cols-1 gap-3 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colItems = getColumnItems(col.id)
          const isOver = dragOverColumn === col.id

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleColumnDragOver(e, col.id)}
              onDragLeave={handleColumnDragLeave}
              onDrop={(e) => handleColumnDrop(e, col.id)}
              className="rounded-lg border border-border bg-muted/25 p-2.5 transition-colors duration-200"
              style={
                isOver
                  ? {
                      borderColor: `var(${col.lampVar})`,
                      backgroundColor: `color-mix(in srgb, var(${col.lampVar}) 7%, transparent)`,
                    }
                  : undefined
              }
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className={`flex items-center gap-2 ${col.lampClass}`}>
                  <span className="lamp lamp-sm" />
                  <span className="eyebrow text-foreground/80">{col.title}</span>
                </div>
                <span className="readout text-xs tabular-nums text-muted-foreground">{String(colItems.length).padStart(2, '0')}</span>
              </div>

              <div className="min-h-[60px]">
                {colItems.length === 0 ? (
                  <div className={`flex items-center justify-center py-9 readout text-[11px] transition-colors duration-200 ${isOver ? col.lampClass : 'text-muted-foreground/40'}`}>
                    {isOver ? 'Drop here' : 'Empty'}
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
