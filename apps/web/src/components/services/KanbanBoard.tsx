import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateReview } from '@/services/api'
import type { ReviewStatus, ReviewableContact, ReviewableOrder } from '@onecrm/shared'
import { Mail, Phone, MessageSquare, Package, DollarSign, UserPlus, X, Send, GripVertical } from 'lucide-react'

type ReviewableItem = ReviewableContact | ReviewableOrder

interface ColumnDef {
  id: ReviewStatus
  title: string
  color: string
  bgColor: string
  borderColor: string
  dotColor: string
}

const COLUMNS: ColumnDef[] = [
  { id: 'to-review', title: 'To Be Reviewed', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', dotColor: 'bg-amber-400' },
  { id: 'under-review', title: 'Under Review', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', dotColor: 'bg-blue-400' },
  { id: 'completed', title: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', dotColor: 'bg-emerald-400' },
]

function isContact(item: ReviewableItem): item is ReviewableContact {
  return 'email' in item && 'phone' in item && 'message' in item
}

// --- Card Content (shared between real card and overlay) ---

function CardContent({ item }: { item: ReviewableItem }) {
  const contact = isContact(item) ? item : null
  const order = !isContact(item) ? item : null

  return (
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
        <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0" />
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
        {item.assignedTo && (
          <Badge variant="secondary" className="text-[10px] gap-1 py-0 h-5">
            <Mail className="h-2.5 w-2.5" />
            {item.assignedTo.split('@')[0]}
          </Badge>
        )}
      </div>
    </div>
  )
}

// --- Sortable Card ---

interface SortableCardProps {
  item: ReviewableItem
  serviceId: string
  type: 'contacts' | 'orders'
  onUpdated: () => void
}

function SortableCard({ item, serviceId, type, onUpdated }: SortableCardProps) {
  const [assigning, setAssigning] = useState(false)
  const [assignEmail, setAssignEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const itemId = String(item.id)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId, data: { item } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={`p-3 group transition-shadow duration-150 ${
          isDragging
            ? 'opacity-40 shadow-none'
            : 'hover:shadow-md'
        }`}
      >
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {isContact(item) ? item.name : (item as ReviewableOrder).customerName}
              </p>
              <p className="text-xs text-muted-foreground/70 truncate">
                {isContact(item) ? item.email : (item as ReviewableOrder).customerEmail}
              </p>
            </div>
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
            </div>
          </div>

          {isContact(item) && (
            <div className="space-y-1">
              {item.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{item.phone}</span>
                </div>
              )}
              {item.message && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{item.message}</span>
                </div>
              )}
            </div>
          )}

          {!isContact(item) && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                <span className="truncate">{(item as ReviewableOrder).product}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <DollarSign className="h-3 w-3" />
                <span>{Number((item as ReviewableOrder).amount).toFixed(2)} {(item as ReviewableOrder).currency}</span>
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
    </div>
  )
}

// --- Droppable Column ---

interface DroppableColumnProps {
  col: ColumnDef
  items: ReviewableItem[]
  serviceId: string
  type: 'contacts' | 'orders'
  onUpdated: () => void
  isOver: boolean
}

function DroppableColumn({ col, items, serviceId, type, onUpdated, isOver }: DroppableColumnProps) {
  const itemIds = useMemo(() => items.map((i) => String(i.id)), [items])

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-3 transition-all duration-200 ${
        isOver
          ? `${col.borderColor} ${col.bgColor}`
          : 'border-border/50 bg-muted/20'
      }`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
          <h3 className={`text-sm font-semibold ${col.color}`}>{col.title}</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5 font-medium shadow-sm">
          {items.length}
        </span>
      </div>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[60px]">
          {items.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/50">
              {isOver ? 'Drop here' : 'No items'}
            </div>
          ) : (
            items.map((item) => (
              <SortableCard
                key={String(item.id)}
                item={item}
                serviceId={serviceId}
                type={type}
                onUpdated={onUpdated}
              />
            ))
          )}
        </div>
      </SortableContext>
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
  const [activeItem, setActiveItem] = useState<ReviewableItem | null>(null)
  const [overColumnId, setOverColumnId] = useState<ReviewStatus | null>(null)

  // Local state for optimistic column assignments during drag
  const [columnOverrides, setColumnOverrides] = useState<Map<string, ReviewStatus>>(new Map())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function getColumnItems(status: ReviewStatus): ReviewableItem[] {
    return items.filter((item) => {
      const override = columnOverrides.get(String(item.id))
      const effectiveStatus = override ?? item.reviewStatus ?? 'to-review'
      return effectiveStatus === status
    })
  }

  function findColumnForItem(itemId: string): ReviewStatus | null {
    const override = columnOverrides.get(itemId)
    if (override) return override
    const item = items.find((i) => String(i.id) === itemId)
    return item ? (item.reviewStatus ?? 'to-review') : null
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const item = items.find((i) => String(i.id) === String(active.id))
    if (item) setActiveItem(item)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Determine target column
    let targetColumn: ReviewStatus | null = null

    // Check if over is a column id directly
    if (COLUMNS.some((c) => c.id === overId)) {
      targetColumn = overId as ReviewStatus
    } else {
      // Over is another card — find its column
      targetColumn = findColumnForItem(overId)
    }

    if (!targetColumn) return

    const currentColumn = findColumnForItem(activeId)
    if (currentColumn !== targetColumn) {
      // Move item to new column optimistically
      setColumnOverrides((prev) => new Map(prev).set(activeId, targetColumn))
    }

    setOverColumnId(targetColumn)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active } = event
    const activeId = String(active.id)

    const targetColumn = columnOverrides.get(activeId)
    const originalColumn = items.find((i) => String(i.id) === activeId)?.reviewStatus ?? 'to-review'

    setActiveItem(null)
    setOverColumnId(null)
    setColumnOverrides(new Map())

    // If column changed, persist
    if (targetColumn && targetColumn !== originalColumn) {
      await updateReview(serviceId, type, activeId, { reviewStatus: targetColumn })
      onUpdated()
    }
  }

  function handleDragCancel() {
    setActiveItem(null)
    setOverColumnId(null)
    setColumnOverrides(new Map())
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            col={col}
            items={getColumnItems(col.id)}
            serviceId={serviceId}
            type={type}
            onUpdated={onUpdated}
            isOver={overColumnId === col.id}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeItem ? (
          <Card className="p-3 shadow-xl ring-2 ring-primary/20 rotate-[2deg] scale-105">
            <CardContent item={activeItem} />
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
