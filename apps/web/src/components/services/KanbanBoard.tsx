import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateReview } from '@/services/api'
import { CardDetailDialog } from './CardDetailDialog'
import type { ReviewStatus, ReviewableContact, ReviewableOrder } from '@onecrm/shared'
import { Phone, MessageSquare, Package, DollarSign, GripVertical, Flag } from 'lucide-react'

type ReviewableItem = ReviewableContact | ReviewableOrder

interface ColumnDef {
  id: ReviewStatus
  title: string
  color: string
  bgColor: string
  dotColor: string
}

const COLUMNS: ColumnDef[] = [
  { id: 'to-review', title: 'To Be Reviewed', color: 'text-amber-600', bgColor: 'bg-amber-50', dotColor: 'bg-amber-400' },
  { id: 'under-review', title: 'Under Review', color: 'text-blue-600', bgColor: 'bg-blue-50', dotColor: 'bg-blue-400' },
  { id: 'completed', title: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-50', dotColor: 'bg-emerald-400' },
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

// --- Kanban Card ---

interface KanbanCardProps {
  item: ReviewableItem
  index: number
  onClick: (item: ReviewableItem) => void
}

function KanbanCard({ item, index, onClick }: KanbanCardProps) {
  const contact = isContact(item) ? item : null
  const order = !isContact(item) ? item : null
  const allAssignees = item.assignees ?? (item.assignedTo ? [item.assignedTo] : [])
  const priorityColor = PRIORITY_COLORS[item.priority ?? 'medium']

  return (
    <Draggable draggableId={String(item.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={provided.draggableProps.style}
          className="mb-2"
        >
          <Card
            onClick={() => onClick(item)}
            className={`p-3 group cursor-pointer transition-shadow duration-150 ${
              snapshot.isDragging
                ? 'shadow-xl ring-2 ring-primary/20'
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
                <div
                  {...provided.dragHandleProps}
                  className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                </div>
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
      )}
    </Draggable>
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
  const [detailItem, setDetailItem] = useState<ReviewableItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  function getColumnItems(status: ReviewStatus): ReviewableItem[] {
    return items.filter((item) => (item.reviewStatus ?? 'to-review') === status)
  }

  async function handleDragEnd(result: DropResult) {
    const { draggableId, destination, source } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId as ReviewStatus
    const oldStatus = source.droppableId as ReviewStatus

    if (newStatus !== oldStatus) {
      await updateReview(serviceId, type, draggableId, { reviewStatus: newStatus })
      onUpdated()
    }
  }

  function handleCardClick(item: ReviewableItem) {
    setDetailItem(item)
    setDetailOpen(true)
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
          {COLUMNS.map((col) => {
            const colItems = getColumnItems(col.id)

            return (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-xl border-2 border-dashed p-3 transition-colors duration-200 ${
                      snapshot.isDraggingOver
                        ? `border-primary/30 ${col.bgColor}`
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
                      {colItems.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/50">
                          No items
                        </div>
                      )}
                      {colItems.map((item, index) => (
                        <KanbanCard
                          key={String(item.id)}
                          item={item}
                          index={index}
                          onClick={handleCardClick}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>

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
