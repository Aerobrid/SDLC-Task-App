"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { createTaskSchema } from "../schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useUpdateTask } from "@/features/tasks/api/use-update-task";

type Task = {
  $id: string;
  title: string;
  description?: string;
  status?: string;
  assigneeId?: string;
  priority?: string;
  projectId?: string;
  dueDate?: string;
};

type Props = { task: Task; workspaceId: string; onSuccess?: () => void; onCancel?: () => void };

export const EditTaskForm = ({ task, workspaceId, onSuccess, onCancel }: Props) => {
  const createTaskInputSchema = createTaskSchema.omit({ workspaceId: true }).partial();
  const { data: membersData } = useGetMembers({ workspaceId });
  const { data: projectsData } = useGetProjects({ workspaceId });

  type ProjectDoc = { $id: string; name: string };
  type MemberDoc = { $id: string; userId: string; name?: string; email?: string };

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(task?.dueDate ? new Date(task.dueDate) : undefined);

  type CreateInput = z.infer<typeof createTaskInputSchema>;

  const form = useForm<CreateInput>({
    resolver: zodResolver(createTaskInputSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: (task?.status ?? "todo") as CreateInput["status"],
      assigneeId: task?.assigneeId ?? "",
      priority: (task?.priority as CreateInput["priority"]) ?? "medium",
      projectId: task?.projectId ?? "",
      dueDate: task?.dueDate ?? undefined,
    },
  });

  useEffect(() => {
    form.reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: (task?.status ?? "todo") as CreateInput["status"],
      assigneeId: task?.assigneeId ?? "",
      priority: (task?.priority as CreateInput["priority"]) ?? "medium",
      projectId: task?.projectId ?? "",
      dueDate: task?.dueDate ?? undefined,
    });
    setSelectedDate(task?.dueDate ? new Date(task.dueDate) : undefined);
  }, [task, form]);

  const update = useUpdateTask();

  const onSubmit = (values: CreateInput) => {
    const date = selectedDate ?? (values.dueDate ? new Date(values.dueDate) : undefined);

    const final = {
      title: values.title ?? task.title,
      description: values.description ?? task.description,
      status: values.status ?? task.status,
      assigneeId: values.assigneeId ?? task.assigneeId,
      priority: values.priority ?? task.priority,
      projectId: values.projectId ?? task.projectId,
      dueDate: date ? new Date(date).toISOString() : (values.dueDate ?? task.dueDate ?? undefined),
      workspaceId,
    } as Record<string, unknown>;

    update.mutate({ id: task.$id, workspaceId, form: final }, { onSuccess: () => onSuccess?.() });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="projectId" render={({ field }) => (
          <FormItem>
            <FormLabel>Project</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(projectsData?.documents ?? []).map((p: ProjectDoc) => (
                    <SelectItem key={p.$id} value={p.$id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="in-review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="priority" render={({ field }) => (
          <FormItem>
            <FormLabel>Priority</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="assigneeId" render={({ field }) => (
          <FormItem>
            <FormLabel>Assignee</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(membersData?.documents ?? []).map((m: MemberDoc) => (
                    <SelectItem key={m.$id} value={m.userId}>{m.name ?? m.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="dueDate" render={({ field }) => (
          <FormItem>
            <FormLabel>Due date</FormLabel>
            <FormControl>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full text-left">{selectedDate ? selectedDate.toDateString() : "Select date"}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={(d) => {
                    const next = d ?? undefined;
                    setSelectedDate(next);
                    field.onChange(next ? new Date(next).toISOString() : undefined);
                  }} />
                </PopoverContent>
              </Popover>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex items-center justify-between gap-2">
          <div>
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
          <div>
            <Button type="submit">Save Changes</Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default EditTaskForm;
