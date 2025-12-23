import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { createTaskSchema } from "../schemas";
import { DATABASE_ID, TASKS_ID } from "@/config";
import { getMember } from "@/features/members/utils";

// Small helpers to keep handlers concise and readable
async function getAdminDatabases() {
  const admin = await createAdminClient();
  return admin.databases;
}

function normalizeStatus(s: unknown) {
  const str = String(s ?? "");
  return str === "inprogress" ? "in-progress" : str || "todo";
}

function sendError(c: Context, message: string, status = 400) {
  return c.json({ error: message }, status as any);
}

const app = new Hono();

app.post(
  "/",
  sessionMiddleware,
  zValidator("form", createTaskSchema),
  async (c) => {
    const databases = c.get("databases");
    const adminDatabases = await getAdminDatabases();
    const user = c.get("user");

    const { title, description, status = "todo", dueDate, assigneeId, priority, projectId, workspaceId } = c.req.valid("form");

    if (!status) return sendError(c, "status is required");
    if (!priority) return sendError(c, "priority is required");
    if (!assigneeId) return sendError(c, "assigneeId is required");
    if (!projectId) return sendError(c, "projectId is required");

    const member = await getMember({ databases, workspaceId, userId: user.$id });
    if (!member) return sendError(c, "Unauthorized", 401);

    const normalizedStatus = normalizeStatus(status);

    const taskData: Record<string, unknown> = {
      title,
      description,
      status: normalizedStatus,
      projectId,
      workspaceId,
    };

    if (dueDate) taskData.dueDate = dueDate;
    if (assigneeId) taskData.assigneeId = assigneeId;
    if (priority) taskData.priority = priority;

    try {
      const maybeForm = c.req.valid ? (c.req.valid("form") as unknown) : undefined;
      if (maybeForm && typeof maybeForm === "object" && "position" in (maybeForm as Record<string, unknown>)) {
        const pos = (maybeForm as Record<string, unknown>)["position"] as number | undefined;
        if (typeof pos === "number") taskData.position = pos;
      }
    } catch {
      // ignore optional position
    }

    if (taskData.position === undefined) {
      try {
        const q: string[] = [Query.equal("workspaceId", String(workspaceId)), Query.equal("status", String(normalizedStatus))];
        const res2 = await adminDatabases.listDocuments(DATABASE_ID, TASKS_ID, q);
        const docs = (res2.documents ?? []) as Array<Record<string, unknown>>;
        let max = -1;
        for (const d of docs) {
          const p = typeof d.position === "number" ? d.position : null;
          if (p !== null && p > max) max = p;
        }
        taskData.position = max + 1;
      } catch (err: unknown) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("Could not compute default position for task create", err);
        }
      }
    }

    const task = await adminDatabases.createDocument(DATABASE_ID, TASKS_ID, ID.unique(), taskData);

    return c.json({ data: task });
  }
);

app.get("/", sessionMiddleware, async (c) => {
  const databases = c.get("databases");
  const adminDatabases = await getAdminDatabases();
  const user = c.get("user");

  const url = new URL(c.req.url);
  const params = url.searchParams;
  const workspaceId = params.get("workspaceId");
  if (!workspaceId) return c.json({ error: "workspaceId required" }, 400);

  const projectIds = params.getAll("projectId");
  const assigneeIds = params.getAll("assigneeId");
  const statuses = params.getAll("status");
  const dueDate = params.get("dueDate");

  // Fetch tasks and sort them by position if available
  const member = await getMember({
    databases,
    workspaceId: String(workspaceId),
    userId: user.$id,
  });

  if (!member) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const baseParts = [Query.equal("workspaceId", String(workspaceId)) as unknown as string];
  if (dueDate) baseParts.push(Query.equal("dueDate", String(dueDate)) as unknown as string);

  const projectList = projectIds.length ? projectIds : [null];
  const assigneeList = assigneeIds.length ? assigneeIds : [null];
  const statusList = statuses.length ? statuses : [null];

  type TaskDoc = Record<string, unknown> & { $id: string; $createdAt?: string; status?: string; projectId?: string; assigneeId?: string; position?: number };

  const docsMap: Record<string, TaskDoc> = {};

  for (const p of projectList) {
    for (const a of assigneeList) {
      for (const s of statusList) {
        const queries: string[] = [...baseParts];
        queries.push(Query.orderDesc("$createdAt") as unknown as string);
        if (p) queries.push(Query.equal("projectId", String(p)) as unknown as string);
        if (a) queries.push(Query.equal("assigneeId", String(a)) as unknown as string);
        if (s) {
          queries.push(Query.equal("status", normalizeStatus(s)) as unknown as string);
        }

        const res = await adminDatabases.listDocuments(DATABASE_ID, TASKS_ID, queries);
        const docs = (res.documents ?? []) as TaskDoc[];
        for (const d of docs) docsMap[d.$id] = d;
      }
    }
  }

  const tasks = Object.values(docsMap) as TaskDoc[];

  // Sort tasks by position (if present) falling back to createdAt
  tasks.sort((a, b) => {
    const ap = typeof a.position === "number" ? a.position : null;
    const bp = typeof b.position === "number" ? b.position : null;
    if (ap !== null && bp !== null) return ap - bp;
    if (ap !== null) return -1;
    if (bp !== null) return 1;
    return (new Date(String(a.$createdAt)).getTime() || 0) - (new Date(String(b.$createdAt)).getTime() || 0);
  });

  const statusCounts: Record<string, number> = { backlog: 0, todo: 0, "in-progress": 0, "in-review": 0, done: 0 };
  const projectCounts: Record<string, number> = {};
  const assigneeCounts: Record<string, number> = {};

  for (const t of tasks) {
    const st = (t.status as string) ?? "todo";
    statusCounts[st] = (statusCounts[st] ?? 0) + 1;
    if (t.projectId && typeof t.projectId === 'string') projectCounts[t.projectId] = (projectCounts[t.projectId] ?? 0) + 1;
    if (t.assigneeId && typeof t.assigneeId === 'string') assigneeCounts[t.assigneeId] = (assigneeCounts[t.assigneeId] ?? 0) + 1;
  }

  return c.json({ data: { documents: tasks, total: tasks.length }, counts: { statuses: statusCounts, projects: projectCounts, assignees: assigneeCounts } });
});

// batch reorder endpoint: accepts { updates: [{ id, status?, position? }, ...] }
app.post("/reorder", sessionMiddleware, async (c) => {
  const body = await c.req.json().catch(() => null);
  const workspaceId = (body && body.workspaceId) || c.req.query("workspaceId");
  const updates = (body && body.updates) || [];
  if (!workspaceId) return c.json({ error: "workspaceId required" }, 400);

  const databases = c.get("databases");
  const adminDatabases = await getAdminDatabases();
  const user = c.get("user");

  const member = await getMember({ databases, workspaceId: String(workspaceId), userId: user.$id });
  if (!member) return c.json({ error: "Unauthorized" }, 401);

  if (!Array.isArray(updates) || updates.length === 0) return c.json({ error: "No updates provided" }, 400);

  const results: Array<Record<string, unknown>> = [];

  for (const u of updates) {
    try {
      const id = String(u.id);
      const updateData: Record<string, unknown> = {};
      if (u.status !== undefined) updateData.status = normalizeStatus(u.status);
      if (u && typeof u === "object" && "position" in (u as Record<string, unknown>)) {
        const pos = (u as Record<string, unknown>)["position"] as number | undefined;
        if (typeof pos === "number") updateData.position = pos;
      }

      if (Object.keys(updateData).length === 0) {
        results.push({ id, ok: false, error: "No fields to update" });
        continue;
      }

      const updated = await adminDatabases.updateDocument(DATABASE_ID, TASKS_ID, id, updateData);
      results.push({ id, ok: true, data: updated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // if unknown attribute, return helpful message
      if (String(msg).toLowerCase().includes("unknown attribute")) {
        return c.json({ error: "Invalid update field", details: "Appwrite collection does not have the 'position' attribute. Add a numeric 'position' attribute to the tasks collection to persist ordering." }, 400);
      }
      results.push({ id: (u as Record<string, unknown>).id as string, ok: false, error: msg });
    }
  }

  return c.json({ results });
});

// Single task operations: GET, PUT, DELETE
app.get("/:id", sessionMiddleware, async (c) => {
  const { id } = c.req.param();
  const databases = c.get("databases");
  const adminDatabases = await getAdminDatabases();
  const user = c.get("user");

  if (!id) return c.json({ error: "id required" }, 400);

  const url = new URL(c.req.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) return c.json({ error: "workspaceId required" }, 400);

  const member = await getMember({ databases, workspaceId: String(workspaceId), userId: user.$id });
  if (!member) return c.json({ error: "Unauthorized" }, 401);

  try {
    const doc = await adminDatabases.getDocument(DATABASE_ID, TASKS_ID, id);
    return c.json({ data: doc });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: "Not found", details: msg }, 404);
  }
});

app.put(
  "/:id",
  sessionMiddleware,
  zValidator("json", createTaskSchema.partial()),
  async (c) => {
    const { id } = c.req.param();
    const databases = c.get("databases");
    const adminDatabases = await getAdminDatabases();
    const user = c.get("user");

    if (!id) return c.json({ error: "id required" }, 400);

    type PartialTask = Partial<z.infer<typeof createTaskSchema>>;
    const payload = c.req.valid("json") as PartialTask;
    if (process.env.NODE_ENV !== "production") {
      console.debug("tasks:update payload", { id, payload });
    }
    const url = new URL(c.req.url);
    const workspaceId = (payload.workspaceId as string) ?? url.searchParams.get("workspaceId");
    if (!workspaceId) return c.json({ error: "workspaceId required" }, 400);

    const member = await getMember({ databases, workspaceId: String(workspaceId), userId: user.$id });
    if (!member) return c.json({ error: "Unauthorized" }, 401);
    
    const updateData: Record<string, unknown> = {};
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.status !== undefined) {
      updateData.status = normalizeStatus(payload.status);
    }
    if (payload.dueDate !== undefined) updateData.dueDate = payload.dueDate;
    if (payload.assigneeId !== undefined) updateData.assigneeId = payload.assigneeId;
    if (payload.priority !== undefined) updateData.priority = payload.priority;
    if (payload.projectId !== undefined) updateData.projectId = payload.projectId;
    if (payload && typeof payload === "object" && "position" in (payload as Record<string, unknown>)) {
      const pos = (payload as Record<string, unknown>)["position"] as number | undefined;
      if (typeof pos === "number") updateData.position = pos;
    }

    // If there are no fields to update, return a helpful error instead of calling Appwrite with an empty body
    if (Object.keys(updateData).length === 0) {
      // Log payload for debugging (dev-only)
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("update task called with empty payload", { payload });
      }
      return c.json({ error: "No update fields provided", payload }, 400);
    }

    try {
      const updated = await adminDatabases.updateDocument(DATABASE_ID, TASKS_ID, id, updateData);
      return c.json({ data: updated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (process.env.NODE_ENV !== "production") {
        console.debug("tasks:update error", msg);
      }
      // If Appwrite complains about unknown attribute (collection schema missing `position`), return 400 with actionable message
      if (String(msg).toLowerCase().includes("unknown attribute")) {
        return c.json({ error: "Invalid update field", details: "Appwrite collection does not have the 'position' attribute. Add a numeric 'position' attribute to the tasks collection to persist ordering." }, 400);
      }
      return c.json({ error: "Failed to update", details: msg }, 500);
    }
  }
);

app.delete("/:id", sessionMiddleware, async (c) => {
  const { id } = c.req.param();
  const databases = c.get("databases");
  const adminDatabases = await getAdminDatabases();
  const user = c.get("user");

  if (!id) return c.json({ error: "id required" }, 400);

  const url = new URL(c.req.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) return c.json({ error: "workspaceId required" }, 400);

  const member = await getMember({ databases, workspaceId: String(workspaceId), userId: user.$id });
  if (!member) return c.json({ error: "Unauthorized" }, 401);

  try {
    await adminDatabases.deleteDocument(DATABASE_ID, TASKS_ID, id);
    return c.json({ data: { id } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: "Failed to delete", details: msg }, 500);
  }
});

export default app;
