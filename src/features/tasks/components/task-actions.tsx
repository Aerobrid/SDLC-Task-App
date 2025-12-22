"use client";

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash, Edit2, ExternalLink } from "lucide-react";

type Props = {
  t: any;
  workspaceId: string;
  setEditingTask: (t: any) => void;
  setIsEditOpen: (v: boolean) => void;
  deleteMutation: any;
  confirmDelete: () => Promise<boolean>;
  router: any;
};

export const TaskActions = ({ t, workspaceId, setEditingTask, setIsEditOpen, deleteMutation, confirmDelete, router }: Props) => {
  const openDetails = useCallback(() => router.push(`/workspaces/${workspaceId}/tasks/${t.$id}`), [router, workspaceId, t.$id]);
  const openProject = useCallback(() => t.projectId ? router.push(`/workspaces/${workspaceId}/projects/${t.projectId}`) : null, [router, workspaceId, t.projectId]);
  const startEdit = useCallback(() => { setEditingTask(t); setIsEditOpen(true); }, [setEditingTask, setIsEditOpen, t]);
  const doDelete = useCallback(async () => {
    const ok = await confirmDelete();
    if (!ok) return;
    deleteMutation.mutate({ id: t.$id, workspaceId: String(workspaceId) });
  }, [confirmDelete, deleteMutation, t.$id, workspaceId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2"><MoreHorizontal size={16} /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="py-1">
        <DropdownMenuItem className="px-3 py-2 flex items-center gap-2" onClick={openDetails}>
          <ExternalLink className="mr-2" />
          Task details
        </DropdownMenuItem>
        <DropdownMenuItem className="px-3 py-2 flex items-center gap-2" onClick={openProject}>
          <ExternalLink className="mr-2" />
          Open project
        </DropdownMenuItem>
        <DropdownMenuItem className="px-3 py-2 flex items-center gap-2" onClick={startEdit}>
          <Edit2 className="mr-2" />
          Edit task
        </DropdownMenuItem>
        <DropdownMenuItem className="px-3 py-2 flex items-center gap-2 text-orange-600" onClick={doDelete}>
          <Trash className="mr-2" />
          Delete task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskActions;
