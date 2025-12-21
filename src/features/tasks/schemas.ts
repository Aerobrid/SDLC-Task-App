import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "inprogress", "done"]).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  projectId: z.string(),
  workspaceId: z.string(),
  attachment: z.union([
    z.instanceof(File),
    z.string().transform((v) => (v === "" ? undefined : v)),
  ]).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
