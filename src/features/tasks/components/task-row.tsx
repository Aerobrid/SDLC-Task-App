"use client";

import React from "react";
import { normalizeStatus } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { parseISO, isValid, format } from "date-fns";
import TaskActions from "./task-actions";

type Task = {
  $id: string;
  title: string;
  description?: string;
  status?: string;
  dueDate?: string;
  assigneeId?: string;
  projectId?: string;
  priority?: string;
};

type ProjectDoc = { $id: string; name?: string };
type MemberDoc = { $id: string; userId: string; name?: string; email?: string };

type Props = {
  t: Task;
  projectsById: Record<string, ProjectDoc>;
  membersByUserId: Record<string, MemberDoc>;
  workspaceId: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setEditingTask: React.Dispatch<React.SetStateAction<any | null>>;
  setIsEditOpen: (v: boolean) => void;
  deleteMutation: { mutate: (args: { id: string; workspaceId: string }) => void };
  confirmDelete: () => Promise<boolean>;
  router: { push: (url: string) => void };
};

export const TaskRow = ({ t, projectsById, membersByUserId, workspaceId, setEditingTask, setIsEditOpen, deleteMutation, confirmDelete, router }: Props) => {
  // compute display values inline where used to keep code simple and avoid unused-var warnings

  return (
    <div className="border border-neutral-200 rounded bg-white min-w-0 overflow-hidden">
      {/* Desktop / wide: aligned columns */}
      <div className="hidden md:flex items-center px-2 py-3 text-sm min-w-0">
        <div className="flex-1 font-medium truncate">{t.title}</div>
        <div className="w-28 text-sm text-muted-foreground truncate">{t.projectId ? (projectsById[t.projectId]?.name ?? 'Project') : '—'}</div>
        <div className="w-28 flex items-center gap-2">
          {t.assigneeId && membersByUserId[t.assigneeId] ? (
            <>
              <MemberAvatar name={membersByUserId[t.assigneeId].name ?? membersByUserId[t.assigneeId].email ?? "?"} classname="size-4" />
              <div className="text-sm truncate">{membersByUserId[t.assigneeId].name ?? membersByUserId[t.assigneeId].email}</div>
            </>
          ) : (
            <div className="text-sm">—</div>
          )}
        </div>
        <div className="w-36 text-sm text-muted-foreground">{t.dueDate && isValid(parseISO(t.dueDate)) ? format(parseISO(t.dueDate), "MMM d, yyyy") : "—"}</div>
        <div className="w-24">
            {(() => {
            const s = normalizeStatus(t.status);
            const label = s === 'in-progress' || s === 'inprogress' ? 'In progress' : s === 'in-review' ? 'In review' : s === 'backlog' ? 'Backlog' : s === 'done' ? 'Done' : 'To do';
            const cls = s === 'backlog'
              ? 'bg-violet-100 text-violet-800 border-violet-200'
              : s === 'todo'
              ? 'bg-neutral-100 text-neutral-800 border-neutral-200'
              : (s === 'in-progress' || s === 'inprogress')
              ? 'bg-sky-100 text-sky-800 border-sky-200' // blue for in-progress
              : s === 'in-review'
              ? 'bg-teal-100 text-teal-800 border-teal-200' // teal for in-review
              : s === 'done'
              ? 'bg-indigo-100 text-indigo-800 border-indigo-200' // indigo for done
              : 'bg-neutral-100 text-neutral-800 border-neutral-200';
            return <Badge variant="outline" className={cls}>{label}</Badge>;
          })()}
        </div>
        <div className="w-20">
          {(() => {
            const p = (t.priority ?? 'medium');
            const cls = p === 'high' ? 'bg-red-100 text-red-800 border-red-200' : p === 'low' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200';
            return <Badge variant="outline" className={cls}>{p}</Badge>;
          })()}
        </div>
        <div className="w-12 text-right">
          <TaskActions t={t} workspaceId={String(workspaceId)} setEditingTask={setEditingTask} setIsEditOpen={setIsEditOpen} deleteMutation={deleteMutation} confirmDelete={confirmDelete} router={router} />
        </div>
      </div>

      {/* Mobile / stacked */}
      <div className="md:hidden p-3 flex flex-col gap-2">
        <div className="font-medium truncate">{t.title}</div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="truncate">{t.projectId ? (projectsById[t.projectId]?.name ?? 'Project') : '—'}</div>
          <div className="flex items-center gap-2">
            {t.assigneeId && membersByUserId[t.assigneeId] ? (
              <>
                <MemberAvatar name={membersByUserId[t.assigneeId].name ?? membersByUserId[t.assigneeId].email ?? "?"} classname="size-4" />
                <div className="text-sm truncate">{membersByUserId[t.assigneeId].name ?? membersByUserId[t.assigneeId].email}</div>
              </>
            ) : (
              <div className="text-sm">—</div>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{t.dueDate && isValid(parseISO(t.dueDate)) ? format(parseISO(t.dueDate), 'MMM d, yyyy') : '—'}</div>
        <div className="flex items-center justify-between">
            <div>{(() => {
              const s = normalizeStatus(t.status);
              const label = s === 'in-progress' || s === 'inprogress' ? 'In progress' : s === 'in-review' ? 'In review' : s === 'backlog' ? 'Backlog' : s === 'done' ? 'Done' : 'To do';
              const cls = s === 'backlog'
                ? 'bg-violet-100 text-violet-800 border-violet-200'
                : s === 'todo'
                ? 'bg-neutral-100 text-neutral-800 border-neutral-200'
                : (s === 'in-progress' || s === 'inprogress')
                ? 'bg-sky-100 text-sky-800 border-sky-200'
                : s === 'in-review'
                ? 'bg-teal-100 text-teal-800 border-teal-200'
                : s === 'done'
                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                : 'bg-neutral-100 text-neutral-800 border-neutral-200';
              return <Badge variant="outline" className={cls}>{label}</Badge>;
          })()}</div>
          <div>{(() => {
            const p = (t.priority ?? 'medium');
            const cls = p === 'high' ? 'bg-red-100 text-red-800 border-red-200' : p === 'low' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200';
            return <Badge variant="outline" className={cls}>{p}</Badge>;
          })()}</div>
          <div>
            <TaskActions t={t} workspaceId={String(workspaceId)} setEditingTask={setEditingTask} setIsEditOpen={setIsEditOpen} deleteMutation={deleteMutation} confirmDelete={confirmDelete} router={router} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TaskRow);
