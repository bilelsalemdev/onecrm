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
import { updateReview } from '@/services/api'
import { CardDetailDialog } from './CardDetailDialog'
import type { ReviewStatus, ReviewableContact, ReviewableOrder } from '@onecrm/shared'
import { Phone, MessageSquare, Package, DollarSign, GripVertical, Flag, Users } from 'lucide-react'

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

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-slate-400',
  medium: 'text-blue-400',
  high: 'text-orange-500',
  urgent: 'text-red-500',
}

function isContact(item: ReviewableItem): item is ReviewableContact {
  return 'email' in item && 'phone' in item && 'message' in item
}

// --- Card Content (for drag overlay) ---

function CardOverlayContent({ item }: { item: ReviewableItem }) {
  const contact = isContact(item) ? item : null
  const order = !isContact(item) ? item : null
  const allAssignees = item.assignees ?? (item.assignedTo ? [item.assignedTo] : [])

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
      {contact?.message && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{contact.message}</span>
        </div>
      )}
      {order && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <DollarSign className="h-3 w-3" />
          <span>{Number(order.amount).toFixed(2)} {order.currency}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground/60">{item.date}</span>
        {allAssignees.length > 0 && (
          <Badge variant="secondary" className="text-[10px] gap-1 py-0 h-5">
            <Users className="h-2.5 w-2.5" />
            {allAssignees.length}
          </Badge>
        )}
      </div>
    </div>
  )
}

// --- Sortable Card ---

interface SortableCardProps {
  item: ReviewableItem
  onClick: (item: ReviewableItem) => void
}

function SortableCard({ item, onClick }: SortableCardProps) {
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

  const contact = isContact(item) ? item : null
  const order = !isContact(item) ? item : null
  const allAssignees = item.assignees ?? (item.assignedTo ? [item.assignedTo] : [])
  const priorityColor = PRIORITY_COLORS[item.priority ?? 'medium']

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        onClick={() => { if (!isDragging) onClick(item) }}
        className={`p-3 group cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'opacity-30 shadow-none'
            : 'hover:shadow-md hover:border-primary/20'
        }`}
      >
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {item.priority && item.priority !== 'medium' && (
                  <Flag className={`h-3 w-3 shrink-0 ${priorityColor}`} />
                )}
                <p className="text-sm font-semibold truncate">
                  {contact ? contact.name : order?.customerName}
                </p>
              </div>
              <p className="text-xs text-muted-foreground/70 truncate">
                {contact ? contact.email : order?.customerEmail}
              </p>
            </div>
            <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
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
            <div className="flex items-center gap-1.5">
              {item.priority && (
                <Badge variant="outline" className="text-[9px] py-0 h-4 px-1.5 gap-0.5 border-none bg-muted/50">
                  <Flag className={`h-2.5 w-2.5 ${priorityColor}`} />
                  {item.priority}
                </Badge>
              )}
              {allAssignees.length > 0 && (
                <div className="flex -space-x-1">
                  {allAssignees.slice(0, 3).map((email) => (
                    <div
                      key={email}
                      title={email}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary ring-2 ring-background"
                    >
                      {email[0].toUpperCase()}
                    </div>
                  ))}
                  {allAssignees.length > 3 && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground ring-2 ring-background">
                      +{allAssignees.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {item.note && (
            <p className="text-[10px] text-muted-foreground/60 italic line-clamp-1 pt-0.5">
              {item.note}
            </p>
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
  isOver: boolean
  onCardClick: (item: ReviewableItem) => void
}

function DroppableColumn({ col, items, isOver, onCardClick }: DroppableColumnProps) {
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
                onClick={onCardClick}
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
  const [columnOverrides, setColumnOverrides] = useState<Map<string, ReviewStatus>>(new Map())
  const [detailItem, setDetailItem] = useState<ReviewableItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
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
    const item = items.find((i) => String(i.id) === String(event.active.id))
    if (item) setActiveItem(item)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    let targetColumn: ReviewStatus | null = null
    if (COLUMNS.some((c) => c.id === overId)) {
      targetColumn = overId as ReviewStatus
    } else {
      targetColumn = findColumnForItem(overId)
    }
    if (!targetColumn) return

    const currentColumn = findColumnForItem(activeId)
    if (currentColumn !== targetColumn) {
      setColumnOverrides((prev) => new Map(prev).set(activeId, targetColumn))
    }
    setOverColumnId(targetColumn)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const targetColumn = columnOverrides.get(activeId)
    const originalColumn = items.find((i) => String(i.id) === activeId)?.reviewStatus ?? 'to-review'

    setActiveItem(null)
    setOverColumnId(null)
    setColumnOverrides(new Map())

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

  function handleCardClick(item: ReviewableItem) {
    setDetailItem(item)
    setDetailOpen(true)
  }

  return (
    <>
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
              isOver={overColumnId === col.id}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeItem ? (
            <Card className="p-3 shadow-xl ring-2 ring-primary/20 opacity-95">
              <CardOverlayContent item={activeItem} />
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

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
