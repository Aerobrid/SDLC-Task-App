"use client";

import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { KanbanColumnHeader } from "./kanban-column-header";
import { useUpdateTask } from "@/features/tasks/api/use-update-task";
import { useReorderTasks } from "@/features/tasks/api/use-reorder-tasks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Task = any;

const STATUS_ORDER = ["backlog", "todo", "in-progress", "in-review", "done"];

type Props = {
  tasks: Task[];
  workspaceId: string;
  projectsById?: Record<string, any>;
  membersByUserId?: Record<string, any>;
};

const DataKanban = ({ tasks, workspaceId, projectsById = {}, membersByUserId = {} }: Props) => {
  const update = useUpdateTask();
  const reorder = useReorderTasks();
  const qc = useQueryClient();
  const prevBoardRef = React.useRef<Record<string, Task[]>>({});

  // Local board state for optimistic UI and reordering
  const initialBoard: Record<string, Task[]> = {};
  for (const s of STATUS_ORDER) initialBoard[s] = [];
  for (const t of tasks) {
    const s = (t.status ?? "todo") as string;
    const ns = s === "inprogress" ? "in-progress" : s;
    if (!initialBoard[ns]) initialBoard[ns] = [];
    initialBoard[ns].push(t);
  }

  const [board, setBoard] = React.useState<Record<string, Task[]>>(initialBoard);

  // keep board in sync if tasks prop changes (external updates)
  React.useEffect(() => {
    const next: Record<string, Task[]> = {};
    for (const s of STATUS_ORDER) next[s] = [];
    for (const t of tasks) {
      const s = (t.status ?? "todo") as string;
      const ns = s === "inprogress" ? "in-progress" : s;
      if (!next[ns]) next[ns] = [];
      next[ns].push(t);
    }
    setBoard(next);
  }, [tasks]);

  const onDragEnd = async (res: any) => {
    const { source, destination, draggableId } = res as any;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const from = source.droppableId;
    const to = destination.droppableId;

    // keep previous board for rollback
    prevBoardRef.current = board;

    // Work on a shallow copy of board
    const next = { ...board };
    const sourceList = Array.from(next[from] ?? []);
    const [moved] = sourceList.splice(source.index, 1);

    if (!moved) return;

    if (from === to) {
      // reorder within same column
      sourceList.splice(destination.index, 0, moved);
      next[from] = sourceList;
      setBoard(next);

      // build updates for the entire column so ordering persists (server will write positions)
      const updates: Array<Record<string, unknown>> = (next[from] ?? []).map((t: Task, idx: number) => ({ id: t.$id, status: from, position: idx }));

      // Optimistically applied; persist batch changes and rollback on error
      reorder.mutate(
        { workspaceId, updates },
        {
          onError: () => setBoard(prevBoardRef.current),
        }
      );
      return;
    }

    // moving across columns: create a moved item copy with updated status
    const destList = Array.from(next[to] ?? []);
    const movedItem = { ...moved, status: to } as Task;
    destList.splice(destination.index, 0, movedItem);
    next[from] = sourceList;
    next[to] = destList;
    // optimistic update
    setBoard(next);

    // build updates for both affected columns
    const updates: Array<Record<string, unknown>> = [];
    const fromList = next[from] ?? [];
    for (let idx = 0; idx < fromList.length; idx++) {
      const t = fromList[idx];
      updates.push({ id: t.$id, status: from, position: idx });
    }
    const toList = next[to] ?? [];
    for (let idx = 0; idx < toList.length; idx++) {
      const t = toList[idx];
      updates.push({ id: t.$id, status: to, position: idx });
    }

    reorder.mutate(
      { workspaceId, updates },
      { onError: () => setBoard(prevBoardRef.current), onSuccess: () => toast.success("Status updated") }
    );
  };
  // Memoized small content renderer to avoid re-renders for each draggable render
  const TaskCardContent = React.useMemo(() => {
    return React.memo(function TaskCardContent({ t }: { t: Task }) {
      return (
        <>
          <div className="font-medium">{t.title}</div>
          <div className="text-xs text-muted-foreground mt-1">{t.projectId ? (projectsById[t.projectId]?.name ?? 'Project') : '—'}</div>
          <div className="text-xs text-muted-foreground mt-2">{t.assigneeName ?? (membersByUserId[t.assigneeId]?.name ?? '—')}</div>
        </>
      );
    });
  }, [projectsById, membersByUserId]);

  // Memoize column rendering to reduce recalculation
  const columns = React.useMemo(() => {
    return STATUS_ORDER.map((status) => (
      <div key={status} className="flex-1 min-w-[220px]">
        <Card className="h-full">
          <KanbanColumnHeader status={status} count={board[status]?.length ?? 0} />
          <div className="p-3">
            <Droppable droppableId={status}>
              {(provided: any) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 min-h-[100px]">
                  {(board[status] ?? []).map((t: Task, index: number) => (
                    <Draggable key={t.$id} draggableId={t.$id} index={index}>
                      {(prov: any) => (
                        <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="p-3 border border-neutral-200 rounded bg-white shadow-sm">
                          <TaskCardContent t={t} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </Card>
      </div>
    ));
  }, [board, projectsById, membersByUserId]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4">{columns}</div>
    </DragDropContext>
  );
};

export default DataKanban;
