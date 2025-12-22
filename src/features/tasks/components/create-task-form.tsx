"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";

import { createTaskSchema } from "../schemas";
import { useCreateTask } from "../api/use-create-tasks";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DottedSeparator } from "@/components/dotted-separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface CreateTaskFormProps {
  projectId: string;
  projectName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateTaskForm = ({ projectId, projectName, onSuccess, onCancel }: CreateTaskFormProps) => {
  const workspaceId = useWorkspaceId();
  const mutation = useCreateTask();
  const createTaskInputSchema = createTaskSchema.omit({ workspaceId: true });

  const { data: membersData } = useGetMembers({ workspaceId: String(workspaceId) });
  const { data: projectsData } = useGetProjects({ workspaceId: String(workspaceId) });

  type ProjectDoc = { $id: string; name: string };
  type MemberDoc = { $id: string; userId: string; name?: string; email?: string };

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const form = useForm<z.infer<typeof createTaskInputSchema> & { priority?: string; dueDate?: string }>({
    resolver: zodResolver(createTaskInputSchema),
    defaultValues: { title: "", description: "", status: "todo", assigneeId: "", priority: "medium", dueDate: undefined },
  });

  // If this form is rendered for a specific project, ensure the form value is set
  useEffect(() => {
    if (projectId) {
      form.setValue("projectId", projectId as unknown as string);
    }
  }, [projectId, form]);

  const onSubmit = (values: z.infer<typeof createTaskInputSchema>) => {
    // Ensure a date is present (time is optional). If time is not provided, default to 00:00.
    if (!selectedDate && !values.dueDate) {
      form.setError("dueDate", { type: "manual", message: "Due date is required" });
      return;
    }

    const date = selectedDate ?? (values.dueDate ? new Date(values.dueDate) : undefined);
    if (!date) {
      form.setError("dueDate", { type: "manual", message: "Invalid date" });
      return;
    }

    const combined = new Date(date);
    combined.setHours(0, 0, 0, 0);

    const finalValues = {
      ...values,
      dueDate: combined.toISOString(),
      projectId: projectId || (values.projectId as unknown as string) || "",
      workspaceId,
    };

    // Client-side required checks (title validated by zod); ensure required selects are present
    if (!finalValues.assigneeId) {
      form.setError("assigneeId", { type: "manual", message: "Assignee is required" });
      return;
    }
    if (!finalValues.projectId) {
      form.setError("projectId", { type: "manual", message: "Project is required" });
      return;
    }

    mutation.mutate({ form: finalValues }, { onSuccess: () => {
      form.reset();
      setSelectedDate(undefined);
      onSuccess?.();
    }});
  };

  return (
    <Card className="w-full border-none shadow-none">
      <CardHeader className="flex p-6">
        <CardTitle className="text-lg font-semibold">Create Task</CardTitle>
      </CardHeader>
      <div className="px-6">
        <DottedSeparator />
      </div>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Task title" maxLength={50} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex flex-col gap-4">
          <FormField control={form.control} name="projectId" render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <FormControl>
                {projectId ? (
                  <Input value={projectName ?? projectId} disabled />
                ) : (
                  <Select onValueChange={(v) => field.onChange(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                          {(projectsData?.documents ?? []).map((p: ProjectDoc) => (
                            <SelectItem key={p.$id} value={p.$id}>{p.name}</SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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
                <Select onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
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
        </div>

        <FormField control={form.control} name="assigneeId" render={({ field }) => (
          <FormItem>
            <FormLabel>Assignee</FormLabel>
            <FormControl>
              <Select onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
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
              <Textarea {...field} placeholder="Details" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="dueDate" render={({ field }) => (
          <FormItem>
            <FormLabel>Due Date</FormLabel>
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

            <div className="flex items-center justify-between">
              <div>
                <Button type="button" variant="secondary" size="lg" onClick={onCancel} disabled={mutation.status === "pending"}>Cancel</Button>
              </div>
              <div>
                <Button type="submit" size="lg" disabled={mutation.status === "pending"}>Create Task</Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateTaskForm;
