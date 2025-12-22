"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useCurrent } from "@/features/auth/api/use-current";
import { Button } from "@/components/ui/button";
import { DottedSeparator } from "@/components/dotted-separator";
import TaskRow from "@/features/tasks/components/task-row";
import CreateTaskForm from "@/features/tasks/components/create-task-form";
import { ResponsiveModel } from "@/components/responsive-model";
import { useDeleteTask } from "@/features/tasks/api/use-delete-task";
import { useConfirm } from "@/hooks/use-confirm";

type ProjectDoc = { $id: string; name?: string; imageUrl?: string; workspaceId?: string };
type TaskDoc = { $id: string; title?: string; status?: string; dueDate?: string; projectId?: string; assigneeId?: string };

export default function HomeAnalytics({ workspaceId }: { workspaceId: string }) {
  const { data: projectsData } = useGetProjects({ workspaceId });
  const { data: tasksResp, isLoading } = useGetTasks({ workspaceId });
  const { data: membersData } = useGetMembers({ workspaceId });
  const { data: currentUser } = useCurrent();

  const projects = (projectsData?.documents ?? []) as ProjectDoc[];
  const tasks = (tasksResp?.data?.documents ?? []) as TaskDoc[];

  const userId = currentUser?.$id;

  const totals = useMemo(() => {
    const now = Date.now();
    let assignedToYou = 0;
    let completed = 0;
    let overdue = 0;
    let total = 0;
    for (const t of tasks) {
      total += 1;
      const status = (t.status ?? "todo") as string;
      if (userId && t.assigneeId === userId) assignedToYou += 1;
      if (status === "done") completed += 1;
      if (t.dueDate && new Date(String(t.dueDate)).getTime() < now && status !== "done") overdue += 1;
    }
    return { assignedToYou, completed, overdue, total };
  }, [tasks, userId]);

  // Filter state controls which tasks appear in the "recent" list
  const [filter, setFilter] = useState<"priority" | "assigned" | "completed" | "overdue" | "all">("priority");

  const priorityRank = (p?: string) => (p === "high" ? 0 : p === "medium" ? 1 : p === "low" ? 2 : 3);

  const filteredTasks = useMemo(() => {
    const now = Date.now();
    let list = tasks.slice();

    if (filter === "assigned") {
      list = list.filter((t) => userId && t.assigneeId === userId);
    } else if (filter === "completed") {
      list = list.filter((t) => (t.status ?? "") === "done");
    } else if (filter === "overdue") {
      list = list.filter((t) => t.dueDate && new Date(String(t.dueDate)).getTime() < now && (t.status ?? "") !== "done");
    }

    // default or other filters: sort by priority then due date
    list.sort((a, b) => {
      const pa = priorityRank((a as any).priority);
      const pb = priorityRank((b as any).priority);
      if (pa !== pb) return pa - pb;
      const da = a.dueDate ? new Date(String(a.dueDate)).getTime() : Infinity;
      const db = b.dueDate ? new Date(String(b.dueDate)).getTime() : Infinity;
      return da - db;
    });

    return list;
  }, [tasks, filter, userId]);

  const projectsCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of projects) map[p.$id] = 0;
    for (const t of tasks) {
      if (t.projectId) map[t.projectId] = (map[t.projectId] ?? 0) + 1;
    }
    return map;
  }, [projects, tasks]);

  const assigneeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of (membersData?.documents ?? [])) map[m.userId] = 0;
    for (const t of tasks) if (t.assigneeId) map[t.assigneeId] = (map[t.assigneeId] ?? 0) + 1;
    return map;
  }, [membersData?.documents, tasks]);

  // Prepare safeTasks for TaskRow usage (title required)
  const safeTasks = tasks.map((t) => ({ $id: t.$id, title: t.title ?? "Untitled", status: t.status, dueDate: t.dueDate, projectId: t.projectId, assigneeId: t.assigneeId }));

  const projectsById: Record<string, ProjectDoc> = {};
  projects.forEach((p) => (projectsById[p.$id] = p));

  const router = useRouter();

  const membersByUserId: Record<string, { $id: string; userId: string; name?: string; email?: string }> = {};
  (membersData?.documents ?? []).forEach((m: any) => (membersByUserId[m.userId] = { $id: m.$id, userId: m.userId, name: m.name, email: m.email }));

  // Create task modal
  const [createOpen, setCreateOpen] = useState(false);
  const deleteMutation = useDeleteTask();
  const [ConfirmDialog, confirmDelete] = useConfirm("Delete task", "Are you sure you want to delete this task? This action cannot be undone.");

  // Pagination (match Tasks page behavior)
  const listRef = useRef<HTMLDivElement | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    const compute = () => {
      const container = listRef.current;
      if (!container) return;
      const itemHeight = 72; // approximate per-row height
      const available = Math.max(120, container.clientHeight);
      const size = Math.max(1, Math.floor(available / itemHeight));
      setPageSize(size);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => setPageIndex(0), [filter, tasks.length]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  useEffect(() => { if (pageIndex > totalPages - 1) setPageIndex(totalPages - 1); }, [totalPages, pageIndex]);
  const visible = useMemo(() => {
    const idx = Math.min(pageIndex, Math.max(0, totalPages - 1));
    const start = idx * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, pageIndex, pageSize, totalPages]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Workspace Analytics</h1>
          <p className="text-sm text-muted-foreground">Overview across all projects in this workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>Create Task</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <button onClick={() => setFilter((f) => (f === "assigned" ? "priority" : "assigned"))} className={`w-full text-left p-4 border border-neutral-100 rounded-lg shadow-sm ${filter === "assigned" ? "bg-white" : "bg-slate-50"}`}>
            <h3 className="text-sm text-muted-foreground">Assigned to you</h3>
            <div className="text-2xl font-semibold mt-2">{totals.assignedToYou}</div>
          </button>
          <button onClick={() => setFilter((f) => (f === "completed" ? "priority" : "completed"))} className={`w-full text-left p-4 border border-neutral-100 rounded-lg shadow-sm ${filter === "completed" ? "bg-white" : "bg-slate-50"}`}>
            <h3 className="text-sm text-muted-foreground">Completed</h3>
            <div className="text-2xl font-semibold mt-2">{totals.completed}</div>
          </button>
          <button onClick={() => setFilter((f) => (f === "overdue" ? "priority" : "overdue"))} className={`w-full text-left p-4 border border-neutral-100 rounded-lg shadow-sm ${filter === "overdue" ? "bg-white" : "bg-slate-50"}`}>
            <h3 className="text-sm text-muted-foreground">Overdue</h3>
            <div className="text-2xl font-semibold mt-2 text-red-600">{totals.overdue}</div>
          </button>
          <button onClick={() => setFilter((f) => (f === "all" ? "priority" : "all"))} className={`w-full text-left p-4 border border-neutral-100 rounded-lg shadow-sm ${filter === "all" ? "bg-white" : "bg-slate-50"}`}>
            <h3 className="text-sm text-muted-foreground">Total tasks</h3>
            <div className="text-2xl font-semibold mt-2">{totals.total}</div>
          </button>
        </div>

        <div className="lg:col-span-3">
          <div className="p-4 bg-slate-50 border border-neutral-100 rounded-lg shadow-sm relative">
            <h3 className="text-sm font-semibold mb-2">Tasks</h3>
            <div ref={listRef} className="mt-3 space-y-3 h-[360px] overflow-auto">
              {isLoading ? <div>Loading...</div> : visible.map((t) => (
                <TaskRow key={t.$id} t={t as any} projectsById={projectsById} membersByUserId={membersByUserId as any} workspaceId={workspaceId} setEditingTask={() => {}} setIsEditOpen={() => {}} deleteMutation={deleteMutation} confirmDelete={confirmDelete} router={{ push: (u: string) => window.location.assign(u) }} />
              ))}
              {filteredTasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks in this workspace yet.</div>}
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={pageIndex <= 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className={`${pageIndex <= 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={pageIndex >= totalPages - 1} onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))} className={`${pageIndex >= totalPages - 1 ? 'opacity-50 pointer-events-none' : ''}`}>
                Next
              </Button>
            </div>
          </div>

          <DottedSeparator />

          <div className="mt-6 p-4 bg-slate-50 border border-neutral-100 rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Projects</h3>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-auto pr-2">
                {projects.map((p) => (
                  <button key={p.$id} type="button" onClick={() => router.push(`/workspaces/${workspaceId}/projects/${p.$id}`)} className="w-full text-left p-3 border rounded bg-white flex items-center justify-between hover:shadow-sm">
                    <div>
                      <div className="font-medium truncate max-w-xs">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{projectsCount[p.$id] ?? 0} tasks</div>
                    </div>
                  </button>
                ))}
              {projects.length === 0 && <div className="text-sm text-muted-foreground">No projects yet.</div>}
            </div>
          </div>

          <DottedSeparator />

          <div className="mt-6 p-4 bg-slate-50 border border-neutral-100 rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Assignees</h3>
              <div className="mt-3 grid grid-cols-1 gap-2 max-h-[300px] overflow-auto pr-2">
                {(membersData?.documents ?? []).map((m: any) => (
                  <div key={m.$id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium truncate max-w-xs">{m.name ?? m.email}</div>
                      <div className="text-xs text-muted-foreground">{assigneeCounts[m.userId] ?? 0} tasks</div>
                    </div>
                  </div>
                ))}
              {(membersData?.documents ?? []).length === 0 && <div className="text-sm text-muted-foreground">No members yet.</div>}
              </div>
          </div>
        </div>

      </div>

      <ResponsiveModel open={createOpen} onOpenChange={setCreateOpen}>
        <CreateTaskForm projectId="" onSuccess={() => setCreateOpen(false)} onCancel={() => setCreateOpen(false)} />
      </ResponsiveModel>

      <ConfirmDialog />
    </div>
  );
}
