'use client'

import type {
  Announcements,
  DndContextProps,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useState,
  Fragment,
} from 'react'
import { createPortal } from 'react-dom'
import tunnel from 'tunnel-rat'
import { Card } from '@/components/atoms/card'
import { ScrollArea, ScrollBar } from '@/components/atoms/scroll-area'
import { cn } from '@/lib/utils'

const t = tunnel()

export type { DragEndEvent } from '@dnd-kit/core'
// NOTE: A functional Kanban component is defined at the end of this file and
// exported with static subcomponents attached.

type KanbanItemProps = {
  id: string
  name: string
  column: string
} & Record<string, unknown>

type KanbanColumnProps = {
  id: string
  name: string
} & Record<string, unknown>

type KanbanContextProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = {
  columns: C[]
  data: T[]
  activeCardId: string | null
}

const KanbanContext = createContext<KanbanContextProps>({
  columns: [],
  data: [],
  activeCardId: null,
})

export type KanbanBoardProps = {
  id: string
  children: ReactNode
  className?: string
}

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <div
      className={cn(
        // Large, non-clipping columns
        'kanban-column w-[420px] flex-shrink-0 min-h-[560px] flex flex-col divide-y overflow-visible rounded-lg border bg-secondary text-xs shadow-sm ring-2 transition-all px-4 pb-4 pt-3',
        isOver ? 'ring-primary' : 'ring-transparent',
        className,
      )}
      ref={setNodeRef}
    >
      {children}
    </div>
  )
}

export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
  children?: ReactNode
  className?: string
}

export const KanbanCard = <T extends KanbanItemProps = KanbanItemProps>({
  id,
  name,
  children,
  className,
}: KanbanCardProps<T>) => {
  const { attributes, listeners, setNodeRef, transition, transform, isDragging } = useSortable({
    id,
  })
  const { activeCardId } = useContext(KanbanContext) as KanbanContextProps

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  }

  return (
    <>
      <div
        style={style}
        {...listeners}
        {...attributes}
        ref={setNodeRef}
        className="will-change-transform"
      >
        <Card
          className={cn(
            'cursor-grab gap-4 rounded-md overflow-visible bg-transparent border-0 shadow-none p-0 py-0',
            isDragging && 'pointer-events-none cursor-grabbing opacity-30',
            className,
          )}
        >
          {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
        </Card>
      </div>
      {activeCardId === id && (
        <t.In>
          <Card
            className={cn(
              'cursor-grab gap-4 rounded-md bg-transparent border-0 shadow-none p-0 py-0 ring-2 ring-primary',
              isDragging && 'cursor-grabbing',
              className,
            )}
          >
            {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
          </Card>
        </t.In>
      )}
    </>
  )
}

export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'id'
> & {
  children: (item: T) => ReactNode
  id: string
}

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
  children,
  className,
  ...props
}: KanbanCardsProps<T>) => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>
  const filteredData = data.filter((item) => item.column === props.id)
  const items = filteredData.map((item) => item.id)

  return (
    <ScrollArea className="overflow-visible">
      <SortableContext items={items}>
        <div
          className={cn('flex flex-grow flex-col gap-4 p-2 min-h-[500px]', className)}
          {...props}
        >
          {filteredData.map((item) => (
            <Fragment key={item.id}>{children(item)}</Fragment>
          ))}
        </div>
      </SortableContext>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  )
}

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps) => (
  <div className={cn('m-0 p-2 font-semibold text-sm', className)} {...props} />
)

export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<DndContextProps, 'children'> & {
  children: (column: C) => ReactNode
  className?: string
  columns: C[]
  data: T[]
  onDataChange?: (data: T[]) => void
  onDragStart?: (event: DragStartEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
  onDragOver?: (event: DragOverEvent) => void
  /** Optional className to fully control the inner layout container. If provided, replaces the default grid classes. */
  containerClassName?: string
}

export const KanbanProvider = <
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
>({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  className,
  columns,
  data,
  onDataChange,
  containerClassName,
  ...props
}: KanbanProviderProps<T, C>) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  const defaultSensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  )
  const sensorsToUse = (props as DndContextProps).sensors ?? defaultSensors

  const handleDragStart = (event: DragStartEvent) => {
    const card = data.find((item) => item.id === event.active.id)
    if (card) {
      setActiveCardId(event.active.id as string)
    }
    onDragStart?.(event)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) {
      return
    }

    const activeItem = data.find((item) => item.id === active.id)
    const overItem = data.find((item) => item.id === over.id)

    if (!activeItem) {
      return
    }

    const activeColumn = activeItem.column
    const overColumn =
      overItem?.column || columns.find((col) => col.id === over.id)?.id || columns[0]?.id

    if (activeColumn !== overColumn) {
      let newData = [...data]
      const activeIndex = newData.findIndex((item) => item.id === active.id)
      const overIndex = newData.findIndex((item) => item.id === over.id)

      newData[activeIndex].column = overColumn
      newData = arrayMove(newData, activeIndex, overIndex)

      onDataChange?.(newData)
    }

    onDragOver?.(event)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null)

    onDragEnd?.(event)

    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    let newData = [...data]

    const oldIndex = newData.findIndex((item) => item.id === active.id)
    const newIndex = newData.findIndex((item) => item.id === over.id)

    newData = arrayMove(newData, oldIndex, newIndex)

    onDataChange?.(newData)
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      const { name, column } = data.find((item) => item.id === active.id) ?? {}

      return `Picked up the card "${name}" from the "${column}" column`
    },
    onDragOver({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {}
      const newColumn = columns.find((column) => column.id === over?.id)?.name

      return `Dragged the card "${name}" over the "${newColumn}" column`
    },
    onDragEnd({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {}
      const newColumn = columns.find((column) => column.id === over?.id)?.name

      return `Dropped the card "${name}" into the "${newColumn}" column`
    },
    onDragCancel({ active }) {
      const { name } = data.find((item) => item.id === active.id) ?? {}

      return `Cancelled dragging the card "${name}"`
    },
  }

  return (
    <KanbanContext.Provider value={{ columns, data, activeCardId }}>
      <DndContext
        accessibility={{ announcements }}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        sensors={sensorsToUse}
        {...props}
      >
        <div
          className={cn(
            containerClassName ?? 'grid size-full auto-cols-fr grid-flow-col gap-4',
            className,
          )}
        >
          {columns.map((column) => (
            <Fragment key={column.id}>{children(column)}</Fragment>
          ))}
        </div>
        {typeof window !== 'undefined' &&
          createPortal(
            <DragOverlay>
              <t.Out />
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </KanbanContext.Provider>
  )
}

// High-level Kanban component used as <Kanban ... />
export type KanbanProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<KanbanProviderProps<T, C>, 'children'> & {
  renderCard?: (item: T) => ReactNode
  renderColumnHeader?: (column: C) => ReactNode
}

const BaseKanban = <
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
>({
  columns,
  data,
  className,
  onDataChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  renderCard,
  renderColumnHeader,
  ...ctxProps
}: KanbanProps<T, C>) => {
  return (
    <KanbanProvider<T, C>
      columns={columns}
      data={data}
      className={className}
      onDataChange={onDataChange}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      {...ctxProps}
    >
      {(column) => (
        <KanbanBoard id={column.id}>
          <KanbanHeader>
            {renderColumnHeader ? renderColumnHeader(column) : (column as C).name}
          </KanbanHeader>
          <KanbanCards<T> id={column.id}>
            {(item) => (
              <KanbanCard<T> {...(item as T)}>
                {renderCard ? renderCard(item) : undefined}
              </KanbanCard>
            )}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  )
}

type KanbanWithStatics = typeof BaseKanban & {
  Provider: typeof KanbanProvider
  Board: typeof KanbanBoard
  Header: typeof KanbanHeader
  Cards: typeof KanbanCards
  Card: typeof KanbanCard
}

export const Kanban = Object.assign(BaseKanban, {
  Provider: KanbanProvider,
  Board: KanbanBoard,
  Header: KanbanHeader,
  Cards: KanbanCards,
  Card: KanbanCard,
}) as KanbanWithStatics
