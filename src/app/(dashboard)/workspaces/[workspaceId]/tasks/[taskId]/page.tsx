"use client";

import { useRouter } from "next/navigation";
import useGetTask from "@/features/tasks/api/use-get-task";
import { useDeleteTask as useDeleteTaskHook } from "@/features/tasks/api/use-delete-task";
import { Button } from "@/components/ui/button";
import { format, parseISO, isValid } from "date-fns";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useConfirm } from "@/hooks/use-confirm";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useGetMembers } from "@/features/members/api/use-get-members";

export default function TaskDetailsPage() {
  const router = useRouter();
  const params = useParams() as { workspaceId?: string; taskId?: string };
  const workspaceId = params.workspaceId ?? "";
  const id = params.taskId ?? "";

  const { data: task, isLoading } = useGetTask({ workspaceId, id });
  const deleteMutation = useDeleteTaskHook();
  const [DeleteDialogue, confirmDelete] = useConfirm(
    "Delete Task",
    "Are you sure you want to delete this task? This action cannot be undone.",
    "destructive"
  );
  const { data: projectsData } = useGetProjects({ workspaceId });
  const { data: membersData } = useGetMembers({ workspaceId });
  const [confirming, setConfirming] = useState(false);

  if (isLoading) return <div>Loading...</div>;
  if (!task) return <div>Not found</div>;

  const t: any = task; // shape from server
  const projectName = t.projectId ? (projectsData?.documents ?? []).find((p: any) => p.$id === t.projectId)?.name : undefined;
  const assignee = t.assigneeId ? (membersData?.documents ?? []).find((m: any) => m.userId === t.assigneeId) : undefined;
  const assigneeName = assignee ? (assignee.name ?? assignee.email) : undefined;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="max-w-[80ch]">
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          {t.description ? (
            <div className="mt-3 p-4 border rounded bg-white max-h-52 overflow-auto whitespace-pre-wrap break-words text-sm text-muted-foreground">{t.description}</div>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">No description</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/workspaces/${workspaceId}/tasks/${id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={async () => {
            const ok = await confirmDelete();
            if (!ok) return;
            try {
              await deleteMutation.mutateAsync({ id, workspaceId });
              router.push(`/workspaces/${workspaceId}/tasks`);
            } catch (err) {
              // handled by hook
            }
          }}>Delete</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded bg-white">
          <div className="text-sm text-muted-foreground">Assigned to</div>
          <div className="mt-2">{assigneeName ?? t.assigneeName ?? t.assigneeId ?? '—'}</div>
        </div>
        <div className="p-4 border rounded bg-white">
          <div className="text-sm text-muted-foreground">Project</div>
          <div className="mt-2">{projectName ?? (t.projectId ?? '—')}</div>
        </div>
        <div className="p-4 border rounded bg-white">
          <div className="text-sm text-muted-foreground">Due Date</div>
          <div className="mt-2">{t.dueDate && isValid(parseISO(t.dueDate)) ? format(parseISO(t.dueDate), 'PPP') : '—'}</div>
        </div>
        <div className="p-4 border rounded bg-white">
          <div className="text-sm text-muted-foreground">Status</div>
          <div className="mt-2">{t.status ?? 'todo'}</div>
        </div>
      </div>

      {/* confirmation dialog rendered once for this page */}
      <DeleteDialogue />
    </div>
  );
}
