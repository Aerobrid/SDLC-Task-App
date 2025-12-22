"use client";

import { useMemo, useState } from "react";
import { ResponsiveModel } from "@/components/responsive-model";
import { EditProjectForm } from "@/features/projects/components/edit-project-form";
import { ImageIcon } from "lucide-react";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useCurrent } from "@/features/auth/api/use-current";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import DataKanban from "@/features/tasks/components/data-kanban";
import DataCalendar from "@/features/tasks/components/data-calendar";
import TaskRow from "@/features/tasks/components/task-row";
import CreateTaskForm from "@/features/tasks/components/create-task-form";
import { Button } from "@/components/ui/button";
import { useDeleteTask } from "@/features/tasks/api/use-delete-task";
import { useConfirm } from "@/hooks/use-confirm";

interface Project {
  $id: string;
  name?: string;
  workspaceId?: string;
}

interface ProjectDoc extends Project {
  imageUrl?: string;
}

type WorkspaceDoc = { $id: string; name?: string };

type TaskDoc = { $id: string; title?: string; status?: string; dueDate?: string; projectId?: string; assigneeId?: string };

// UI task type used by the task components (title is required)
type UITask = { $id: string; title: string; projectId?: string; assigneeId?: string; assigneeName?: string; status?: string; priority?: string; dueDate?: string };

export default function ProjectPage({ params }: { params: { workspaceId: string; projectId: string } }) {
  const { workspaceId, projectId } = params;
  const { data } = useGetProjects({ workspaceId });
  const [open, setOpen] = useState(false);

  const project = useMemo(() => {
    const docs = data?.documents as ProjectDoc[] | undefined;
    return docs?.find((p) => p.$id === projectId);
  }, [data, projectId]);

  const initial = project ? { $id: project.$id, name: project.name, imageUrl: project.imageUrl, workspaceId: project.workspaceId } : { $id: projectId, workspaceId };

  const { data: currentUser } = useCurrent();
  const userId = currentUser?.$id;

  const { data: workspacesData } = useGetWorkspaces();
  const workspaceName = (() => {
    try {
      const docs = (workspacesData?.documents ?? []) as WorkspaceDoc[];
      const found = docs.find((w) => String(w.$id) === String(workspaceId));
      return found?.name ?? String(workspaceId);
    } catch {
      return String(workspaceId);
    }
  })();

  const { data: tasksResp, isLoading } = useGetTasks({ workspaceId, projectIds: [projectId], assigneeIds: userId ? [userId] : [] });
  const tasks = (tasksResp?.data?.documents ?? []) as TaskDoc[];

  // Ensure tasks have required fields for UI components (title must be a string)
  const safeTasks: UITask[] = tasks.map((t) => ({
    $id: t.$id,
    title: t.title ?? "Untitled",
    status: t.status,
    dueDate: t.dueDate,
    projectId: t.projectId,
    // If a task has no assignee, default to current user (this page is "Assigned to you")
    assigneeId: t.assigneeId ?? userId,
    assigneeName: t.assigneeId ? undefined : currentUser?.name,
  }));

  // projectsById shapes differ across components; create both
  const projectsNameMap: Record<string, { name?: string }> = { [projectId]: { name: project?.name } };
  const projectsFullMap: Record<string, ProjectDoc> = { [projectId]: { $id: projectId, name: project?.name, imageUrl: project?.imageUrl, workspaceId: project?.workspaceId } };

  // Provide a simple members map including the current user so assignee column can show your avatar/name
  const membersByUserId: Record<string, { $id: string; userId: string; name?: string; email?: string }> = {};
  if (userId && currentUser) {
    membersByUserId[userId] = { $id: String(currentUser.$id), userId: String(currentUser.$id), name: currentUser.name, email: (currentUser as any).email };
  }

  const totals = (() => {
    const now = Date.now();
    let assigned = 0;
    let completed = 0;
    let overdue = 0;
    for (const t of tasks) {
      assigned += 1;
      const status = (t.status ?? "todo") as string;
      if (status === "done") completed += 1;
      if (t.dueDate && new Date(String(t.dueDate)).getTime() < now && status !== "done") overdue += 1;
    }
    return { assigned, completed, overdue };
  })();

  // view state: table | kanban | calendar
  const [view, setView] = useState<"table" | "kanban" | "calendar">("table");

  // create task modal
  const [createOpen, setCreateOpen] = useState(false);

  // edit project modal initial handled above

  const deleteMutation = useDeleteTask();
  const [ConfirmDialog, confirmDelete] = useConfirm("Delete task", "Are you sure you want to delete this task? This action cannot be undone.");

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{project?.name ?? `Project ${projectId}`}</h1>
            <p className="text-sm text-muted-foreground">{workspaceName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="tertiary" size="default" className="flex items-center gap-2" onClick={() => setOpen(true)}>
              <ImageIcon className="size-4" />
              Edit Project
            </Button>
            <Button variant="primary" size="default" onClick={() => setCreateOpen(true)}>Create Task</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 bg-slate-50 border border-neutral-100 rounded-lg shadow-sm">
              <h3 className="text-sm text-muted-foreground">Assigned to you</h3>
              <div className="text-2xl font-semibold mt-2">{totals.assigned}</div>
            </div>
            <div className="p-4 bg-slate-50 border border-neutral-100 rounded-lg shadow-sm">
              <h3 className="text-sm text-muted-foreground">Completed</h3>
              <div className="text-2xl font-semibold mt-2">{totals.completed}</div>
            </div>
            <div className="p-4 bg-slate-50 border border-neutral-100 rounded-lg shadow-sm">
              <h3 className="text-sm text-muted-foreground">Overdue</h3>
              <div className="text-2xl font-semibold mt-2 text-red-600">{totals.overdue}</div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button className={`px-3 py-1 rounded-md border ${view === "table" ? "bg-white shadow-sm" : "bg-transparent"}`} onClick={() => setView("table")}>Table</button>
                <button className={`px-3 py-1 rounded-md border ${view === "kanban" ? "bg-white shadow-sm" : "bg-transparent"}`} onClick={() => setView("kanban")}>Kanban</button>
                <button className={`px-3 py-1 rounded-md border ${view === "calendar" ? "bg-white shadow-sm" : "bg-transparent"}`} onClick={() => setView("calendar")}>Calendar</button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-neutral-100 rounded-lg">
              {isLoading ? (
                <div>Loading...</div>
              ) : view === "table" ? (
                <div className="space-y-3">
                  {/* Table headers (desktop) */}
                  <div className="hidden md:flex items-center px-2 py-3 text-sm font-medium text-muted-foreground">
                    <div className="flex-1">Title</div>
                    <div className="w-28">Project</div>
                    <div className="w-28">Assignee</div>
                    <div className="w-36">Due</div>
                    <div className="w-24">Status</div>
                    <div className="w-20">Priority</div>
                    <div className="w-12 text-right">Actions</div>
                  </div>

                  {safeTasks.map((t) => (
                    <TaskRow key={t.$id} t={t} projectsById={projectsFullMap} membersByUserId={membersByUserId} workspaceId={workspaceId} setEditingTask={() => {}} setIsEditOpen={() => {}} deleteMutation={deleteMutation} confirmDelete={confirmDelete} router={{ push: (u: string) => window.location.assign(u) }} />
                  ))}
                </div>
              ) : view === "kanban" ? (
                <div>
                  <DataKanban tasks={safeTasks} workspaceId={workspaceId} projectsById={projectsNameMap} membersByUserId={membersByUserId} />
                </div>
              ) : (
                <div>
                  <DataCalendar tasks={safeTasks} workspaceId={workspaceId} projectsById={projectsNameMap} membersByUserId={membersByUserId} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ResponsiveModel open={open} onOpenChange={setOpen}>
        <EditProjectForm onCancel={() => setOpen(false)} initialValues={initial} />
      </ResponsiveModel>

      <ResponsiveModel open={createOpen} onOpenChange={setCreateOpen}>
        <CreateTaskForm projectId={projectId} projectName={project?.name} onSuccess={() => setCreateOpen(false)} onCancel={() => setCreateOpen(false)} />
      </ResponsiveModel>

      <ConfirmDialog />
    </>
  );
}
// show modal inside same component
// render modal outside main return so React rules are satisfied

// use a fragment to include modal
// helper modal is rendered inline in the component above

