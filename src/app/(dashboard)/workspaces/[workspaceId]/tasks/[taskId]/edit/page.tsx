"use client";

import { useRouter, useParams } from "next/navigation";
import useGetTask from "@/features/tasks/api/use-get-task";
import EditTaskForm from "@/features/tasks/components/edit-task-form";

export default function EditTaskPage() {
  const params = useParams() as { workspaceId?: string; taskId?: string };
  const workspaceId = params.workspaceId ?? "";
  const id = params.taskId ?? "";
  const router = useRouter();

  const { data: task, isLoading } = useGetTask({ workspaceId, id });

  if (isLoading) return <div>Loading...</div>;
  if (!task) return <div>Not found</div>;

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">Edit a Task</h2>
      <div className="mt-4">
        <EditTaskForm task={task} workspaceId={workspaceId} onSuccess={() => router.push(`/workspaces/${workspaceId}/tasks/${id}`)} onCancel={() => router.push(`/workspaces/${workspaceId}/tasks/${id}`)} />
      </div>
    </div>
  );
}
