"use client";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetTasks } from "../api/use-get-tasks";
import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useRouter } from "next/navigation";
import CreateTaskModel from "./create-task-model";
import { useCreateTaskModel } from "../hooks/use-create-task-model";
import { ResponsiveModel } from "@/components/responsive-model";
import EditTaskForm from "./edit-task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DottedSeparator } from "@/components/dotted-separator";
import TaskRow from "./task-row";
import DataKanban from "./data-kanban";
import { useDeleteTask } from "@/features/tasks/api/use-delete-task";
import { useConfirm } from "@/hooks/use-confirm";
import { format, parseISO, isValid } from "date-fns";
import { DayPicker } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";

type TaskStatus = "backlog" | "todo" | "inprogress" | "in-progress" | "in-review" | "done";

interface Task {
  $id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  assigneeName?: string;
  assigneeId?: string;
  priority?: string;
  projectId?: string;
}

type View = "table" | "kanban" | "calendar";

export default function TasksPage() {
  const workspaceId = useWorkspaceId();

  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [selectedDueDate, setSelectedDueDate] = useState<string | undefined>(undefined);

  const tasksQuery = useGetTasks({
    workspaceId: String(workspaceId),
    projectIds: selectedProject ? [selectedProject] : [],
    assigneeIds: selectedAssignee ? [selectedAssignee] : [],
    statuses: selectedStatus ? [selectedStatus] : [],
    dueDate: selectedDueDate,
  });
  const isLoading = tasksQuery.isLoading;
  const counts = tasksQuery.data?.counts;
  const { data: projectsData } = useGetProjects({ workspaceId: String(workspaceId) });
  const projectsById = useMemo(() => {
    const map: Record<string, Project> = {};
    (projectsData?.documents ?? []).forEach((p: Project) => { map[p.$id] = p; });
    return map;
  }, [projectsData?.documents]);
  const { data: membersData } = useGetMembers({ workspaceId: String(workspaceId) });
  const [view, setView] = useState<View>("table");

  type Project = { $id: string; name: string };
  const projects = (projectsData?.documents ?? []) as Project[];
  const tasks = useMemo<Task[]>(() => (tasksQuery.data?.data?.documents ?? []) as Task[], [tasksQuery.data?.data?.documents]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const byStatus = useMemo(() => {
    const map: Record<'backlog'|'todo'|'inprogress'|'in-review'|'done', Task[]> = { backlog: [], todo: [], inprogress: [], 'in-review': [], done: [] };
    tasks.forEach((t) => {
      const raw = (t.status ?? "todo") as string;
      let s = raw;
      if (raw === "in-progress") s = "inprogress"; // normalize
      if (raw === "inreview") s = "in-review";
      const key = s === 'backlog' ? 'backlog' : s === 'inprogress' ? 'inprogress' : s === 'in-review' ? 'in-review' : s === 'done' ? 'done' : 'todo';
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const dueDates = useMemo(() => tasks.filter((t) => t.dueDate).map((t) => ({ date: t.dueDate!, task: t })), [tasks]);

  const { open: openCreate } = useCreateTaskModel();
  const router = useRouter();
  const deleteMutation = useDeleteTask();
  const [DeleteDialogue, confirmDelete] = useConfirm(
    "Delete Task",
    "Are you sure you want to delete this task? This action cannot be undone.",
    "destructive"
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Debounce search input to avoid filtering on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Reset pagination when filters/search/tasks change
  useEffect(() => setPageIndex(0), [search, selectedAssignee, selectedProject, selectedStatus, selectedDueDate, tasks.length]);

  // Filtered tasks memoized
  const filteredTasks = useMemo(() => tasks
    .filter((t) => (search ? t.title.toLowerCase().includes(search.toLowerCase()) : true))
    .filter((t) => (selectedAssignee ? (t.assigneeId ? t.assigneeId === selectedAssignee : false) : true))
    .filter((t) => (selectedProject ? (t.projectId ? t.projectId === selectedProject : false) : true))
  , [tasks, search, selectedAssignee, selectedProject]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredTasks.length / pageSize)), [filteredTasks.length, pageSize]);

  // Clamp pageIndex when totalPages changes
  useEffect(() => {
    if (pageIndex > totalPages - 1) setPageIndex(totalPages - 1);
  }, [totalPages, pageIndex]);

  const visible = useMemo(() => {
    const idx = Math.min(pageIndex, Math.max(0, totalPages - 1));
    const start = idx * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, pageIndex, pageSize, totalPages]);

  // Compute page size based on visible container height (approx item height)
  useEffect(() => {
    const compute = () => {
      const container = listRef.current;
      if (!container) return;
      const itemHeight = 72; // approximate per-row height in px
      const available = Math.max(120, container.clientHeight);
      const size = Math.max(1, Math.floor(available / itemHeight));
      setPageSize(size);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  type Member = { $id: string; userId: string; name?: string; email?: string };
  const membersByUserId = useMemo(() => {
    const map: Record<string, Member> = {};
    (membersData?.documents ?? []).forEach((m: Member) => {
      if (m.userId) map[m.userId] = m;
    });
    return map;
  }, [membersData?.documents]);

  const viewDescriptions: Record<View, string> = {
    table: "A compact list of tasks with quick details.",
    kanban: "Drag and drop tasks across statuses in the board.",
    calendar: "See tasks laid out by due date on a calendar.",
  };

  return (
    <div className="p-6">
      <CreateTaskModel projectId={""} />

      <ResponsiveModel open={isEditOpen} onOpenChange={setIsEditOpen}>
        {editingTask && (
          <Card className="w-full border-none shadow-none">
            <CardHeader className="flex p-6">
              <CardTitle className="text-lg font-semibold">Edit Task</CardTitle>
            </CardHeader>
            <div className="px-6">
              <DottedSeparator />
            </div>
            <CardContent className="p-6">
              <EditTaskForm
                task={editingTask}
                workspaceId={String(workspaceId)}
                onSuccess={() => { setIsEditOpen(false); setEditingTask(null); }}
                onCancel={() => { setIsEditOpen(false); setEditingTask(null); }}
              />
            </CardContent>
          </Card>
        )}
      </ResponsiveModel>

      {/* Delete confirmation dialog rendered once for the page */}
      <DeleteDialogue />

      <div className="mb-4">
        <div>
          <h2 className="text-lg font-semibold">Tasks</h2>
          <p className="text-sm text-muted-foreground">{viewDescriptions[view]}</p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant={view === "table" ? "muted" : "outline"} size="sm" onClick={() => setView("table")}>Table</Button>
            <Button variant={view === "kanban" ? "muted" : "outline"} size="sm" onClick={() => setView("kanban")}>Kanban</Button>
            <Button variant={view === "calendar" ? "muted" : "outline"} size="sm" onClick={() => setView("calendar")}>Calendar</Button>
          </div>
          <div>
            <Button size="sm" onClick={openCreate}>Create Task</Button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Input placeholder="Search title..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="max-w-xs" />

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {selectedStatus ? (selectedStatus === 'in-progress' || selectedStatus === 'inprogress' ? 'In progress' : selectedStatus === 'in-review' ? 'In review' : selectedStatus === 'todo' ? 'To do' : selectedStatus === 'backlog' ? 'Backlog' : 'Done') : 'All statuses'}
                      <Badge className="ml-2">{selectedStatus ? (counts?.statuses?.[selectedStatus] ?? 0) : (Object.values(counts?.statuses ?? {}) as number[]).reduce((a,b)=>a+b,0)}</Badge>
                    </Button>
                  </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-2">
                    {[
                      { id: "backlog", label: "Backlog" },
                      { id: "todo", label: "To do" },
                      { id: "in-progress", label: "In progress" },
                      { id: "in-review", label: "In review" },
                      { id: "done", label: "Done" },
                    ].map((s) => (
                      <div key={s.id} className={`flex items-center justify-between gap-2 px-2 py-1 hover:bg-neutral-50 rounded cursor-pointer ${selectedStatus === s.id ? 'bg-neutral-100' : ''}`} onClick={() => setSelectedStatus(selectedStatus === s.id ? undefined : s.id)}>
                        <div className="text-sm">{s.label}</div>
                        <div className="text-xs text-muted-foreground">{counts?.statuses?.[s.id] ?? 0}</div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">{selectedAssignee ? (membersByUserId[selectedAssignee]?.name ?? membersByUserId[selectedAssignee]?.email ?? "Assignee") : "All assignees"} <Badge className="ml-2">{selectedAssignee ? (counts?.assignees?.[selectedAssignee] ?? 0) : (Object.values(counts?.assignees ?? {}) as number[]).reduce((a,b)=>a+b,0)}</Badge></Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    {(membersData?.documents ?? []).map((m: Member) => (
                      <div key={m.$id} className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-neutral-50 rounded cursor-pointer" onClick={() => setSelectedAssignee(selectedAssignee === m.userId ? undefined : m.userId)}>
                        <div className="flex items-center gap-2">
                          <MemberAvatar name={m.name ?? m.email ?? "?"} classname="size-4" />
                          <div className="text-sm">{m.name ?? m.email}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{counts?.assignees?.[m.userId] ?? 0}</div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">{selectedProject ? (projects.find((x) => x.$id === selectedProject)?.name ?? "Project") : "All projects"} <Badge className="ml-2">{selectedProject ? (counts?.projects?.[selectedProject] ?? 0) : (Object.values(counts?.projects ?? {}) as number[]).reduce((a,b)=>a+b,0)}</Badge></Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    {(projectsData?.documents ?? []).map((p: Project) => (
                      <div key={p.$id} className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-neutral-50 rounded cursor-pointer" onClick={() => setSelectedProject(selectedProject === p.$id ? undefined : p.$id)}>
                        <div className="text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{counts?.projects?.[p.$id] ?? 0}</div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">{selectedDueDate ? format(parseISO(selectedDueDate), "MMM d, yyyy") : 'Due date'}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDueDate ? new Date(selectedDueDate) : undefined} onSelect={(d) => setSelectedDueDate(d ? d.toISOString() : undefined)} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Mobile: single Filters popover */}
            <div className="md:hidden">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">Filters</Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold mb-1">Status</div>
                      <div className="space-y-1">
                        {["backlog","todo","in-progress","in-review","done"].map((id) => {
                          const label = id === 'backlog' ? 'Backlog' : id === 'todo' ? 'To do' : id === 'in-progress' ? 'In progress' : id === 'in-review' ? 'In review' : 'Done';
                          return (
                            <div key={id} className={`flex items-center justify-between gap-2 px-2 py-1 hover:bg-neutral-50 rounded cursor-pointer ${selectedStatus === id ? 'bg-neutral-100' : ''}`} onClick={() => setSelectedStatus(selectedStatus === id ? undefined : id)}>
                              <div className="text-sm">{label}</div>
                              <div className="text-xs text-muted-foreground">{counts?.statuses?.[id] ?? 0}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-1">Assignee</div>
                      <div className="space-y-1 max-h-40 overflow-auto">
                        {(membersData?.documents ?? []).map((m: Member) => (
                          <div key={m.$id} className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-neutral-50 rounded cursor-pointer" onClick={() => setSelectedAssignee(selectedAssignee === m.userId ? undefined : m.userId)}>
                            <div className="flex items-center gap-2">
                              <MemberAvatar name={m.name ?? m.email ?? "?"} classname="size-4" />
                              <div className="text-sm">{m.name ?? m.email}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{counts?.assignees?.[m.userId] ?? 0}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-1">Project</div>
                      <div className="space-y-1 max-h-40 overflow-auto">
                        {(projectsData?.documents ?? []).map((p: Project) => (
                          <div key={p.$id} className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-neutral-50 rounded cursor-pointer" onClick={() => setSelectedProject(selectedProject === p.$id ? undefined : p.$id)}>
                            <div className="text-sm">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{counts?.projects?.[p.$id] ?? 0}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-1">Due date</div>
                      <Calendar mode="single" selected={selectedDueDate ? new Date(selectedDueDate) : undefined} onSelect={(d) => setSelectedDueDate(d ? d.toISOString() : undefined)} />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        {/* Active filter chips */}
        <div className="mt-3 flex items-center gap-2">
          {selectedStatus && (
            <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={() => setSelectedStatus(undefined)}>
              {selectedStatus === 'inprogress' ? 'In progress' : selectedStatus === 'todo' ? 'To do' : 'Done'} ×
            </Button>
          )}
          {selectedAssignee && (
            <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={() => setSelectedAssignee(undefined)}>
              {membersByUserId[selectedAssignee]?.name ?? membersByUserId[selectedAssignee]?.email ?? 'Assignee'} ×
            </Button>
          )}
          {selectedProject && (
            <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={() => setSelectedProject(undefined)}>
              {projects.find((x) => x.$id === selectedProject)?.name ?? 'Project'} ×
            </Button>
          )}
          {selectedDueDate && (
            <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={() => setSelectedDueDate(undefined)}>
              {format(parseISO(selectedDueDate), 'PPP')} ×
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1">
            
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded relative">
              {/* Column headers (only visible in table view) */}
              {view === "table" && (
                <div className="hidden md:flex items-center px-2 py-3 text-sm font-semibold text-muted-foreground border-b border-neutral-200">
                  <div className="flex-1">Task Name</div>
                  <div className="w-36">Project</div>
                  <div className="w-36">Assigned to</div>
                  <div className="w-40">Due date</div>
                  <div className="w-28">Status</div>
                  <div className="w-28">Priority</div>
                  <div className="w-16 text-right">Actions</div>
                </div>
              )}
              <div ref={listRef} className="h-[60vh] overflow-auto">
                {view === "table" && (
                  <div className="space-y-3">
                    {tasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks</div>}
                    {visible.map((t) => (
                      <TaskRow
                        key={t.$id}
                        t={t}
                        projectsById={projectsById}
                        membersByUserId={membersByUserId}
                        workspaceId={workspaceId}
                        setEditingTask={setEditingTask}
                        setIsEditOpen={setIsEditOpen}
                        deleteMutation={deleteMutation}
                        confirmDelete={confirmDelete}
                        router={router}
                      />
                    ))}
                  </div>
                )}

                {view === "kanban" && (
                  <div className="w-full">
                    <DataKanban tasks={tasks} workspaceId={String(workspaceId)} projectsById={projectsById} membersByUserId={membersByUserId} />
                  </div>
                )}

                {view === "calendar" && (
                  <div>
                    <div className="max-h-[52vh] overflow-auto">
                      <DayPicker
                        mode="single"
                        fromMonth={new Date()}
                        modifiers={{ due: dueDates.map((d) => new Date(d.date)) }}
                        modifiersClassNames={{ due: "bg-amber-200 rounded" }}
                      />
                    </div>

                    <div className="mt-4 space-y-2">
                      {dueDates.map((d) => (
                        <div key={d.task.$id} className="p-3 border border-neutral-200 rounded bg-white">
                          <div className="font-medium">{d.task.title}</div>
                          <div className="text-xs text-muted-foreground">Due: {format(parseISO(d.date), "PPP")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Prev/Next controls anchored to the padded container so they stay at the end */}
              {view === "table" && (
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={pageIndex <= 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className={`${pageIndex <= 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                    Previous
                  </Button>
                  <Button size="sm" variant="outline" disabled={pageIndex >= totalPages - 1} onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))} className={`${pageIndex >= totalPages - 1 ? 'opacity-50 pointer-events-none' : ''}`}>
                    Next
                  </Button>
                </div>
              )}
                </div>
              </div>
        </div>
      )}
    </div>
  );
}
