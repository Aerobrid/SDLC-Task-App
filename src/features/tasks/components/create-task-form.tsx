"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef } from "react";

import { createTaskSchema } from "../schemas";
import { useCreateTask } from "../api/use-create-tasks";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

interface CreateTaskFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export const CreateTaskForm = ({ projectId, onSuccess }: CreateTaskFormProps) => {
  const workspaceId = useWorkspaceId();
  const mutation = useCreateTask();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const createTaskInputSchema = createTaskSchema.omit({ workspaceId: true, projectId: true });

  const form = useForm<z.infer<typeof createTaskInputSchema>>({
    resolver: zodResolver(createTaskInputSchema),
    defaultValues: { title: "", description: "", status: "todo" },
  });

  const onSubmit = (values: z.infer<typeof createTaskInputSchema>) => {
    const finalValues = {
      ...values,
      projectId,
      workspaceId,
      attachment: values.attachment instanceof File ? values.attachment : "",
    };

    mutation.mutate({ form: finalValues }, { onSuccess: () => {
      form.reset();
      onSuccess?.();
    }});
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) form.setValue("attachment", file);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Task title" />
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

        <div>
          <input type="file" ref={inputRef} className="hidden" onChange={handleFile} />
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={mutation.status === "pending"}>Attach File</Button>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.status === "pending"}>Create Task</Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateTaskForm;
