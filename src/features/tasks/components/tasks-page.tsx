"use client";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetTasks } from "../api/use-get-tasks";
import CreateTaskForm from "./create-task-form";

export default function TasksPage() {
  const workspaceId = useWorkspaceId();

  const { data, isLoading } = useGetTasks({ workspaceId: String(workspaceId) });

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Tasks</h2>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <ul className="space-y-2">
              {data?.documents?.map((t: any) => (
                <li key={t.$id} className="p-3 border rounded">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-sm text-muted-foreground">{t.description}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <CreateTaskForm projectId={""} />
        </div>
      </div>
    </div>
  );
}
