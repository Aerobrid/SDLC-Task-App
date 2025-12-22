import { z } from "zod";

// Create Task schema
// Required fields: title, status, priority, dueDate (ISO string), assigneeId, projectId, workspaceId
// Optional: description
export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  // Allowed statuses: backlog, todo, in-progress, in-review, done
  status: z.enum(["backlog", "todo", "in-progress", "in-review", "done"], { errorMap: () => ({ message: "Status is required" }) }),
  priority: z.enum(["low", "medium", "high"], { errorMap: () => ({ message: "Priority is required" }) }),
  // dueDate should be an ISO date string (time optional client-side)
  dueDate: z.string().min(1, "Due date is required"),
  assigneeId: z.string().min(1, "Assignee is required"),
  projectId: z.string().min(1, "Project is required"),
  workspaceId: z.string().min(1, "Workspace is required"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
