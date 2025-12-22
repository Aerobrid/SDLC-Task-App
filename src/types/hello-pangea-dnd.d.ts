declare module "@hello-pangea/dnd" {
  import React from "react";

  export type DropLocation = { droppableId: string; index: number };
  export type DropResult = { source: DropLocation; destination?: DropLocation | null };

  export type DroppableProvided = {
    innerRef: (el: HTMLElement | null) => void;
    droppableProps: Record<string, unknown>;
    placeholder?: React.ReactNode;
  };

  export type DraggableProvided = {
    innerRef: (el: HTMLElement | null) => void;
    draggableProps: Record<string, unknown>;
    dragHandleProps?: Record<string, unknown>;
  };

  export const DragDropContext: React.FC<{ children?: React.ReactNode; onDragEnd?: (res: DropResult) => void }>;
  export const Droppable: React.FC<{ droppableId: string; children: (provided: DroppableProvided) => React.ReactNode }>;
  export const Draggable: React.FC<{ draggableId: string; index: number; children: (provided: DraggableProvided) => React.ReactNode }>;
}
