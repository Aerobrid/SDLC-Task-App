import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ID } from "node-appwrite";

import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { createTaskSchema } from "../schemas";
import { DATABASE_ID, TASKS_ID, IMAGES_BUCKET_ID, APPW_ENDPOINT, APPW_PROJECT_ID } from "@/config";
import { getMember } from "@/features/members/utils";

const app = new Hono()
  .post(
    "/",
    sessionMiddleware,
    zValidator("form", createTaskSchema),
    async (c) => {
      const databases = c.get("databases");
      const admin = await createAdminClient();
      const adminDatabases = admin.databases;
      const adminStorage = admin.storage;
      const user = c.get("user");

      const { title, description, status = "todo", dueDate, assigneeId, projectId, workspaceId, attachment } = c.req.valid("form");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      let attachmentUrl: string | undefined;

      if (attachment instanceof File) {
        const file = await adminStorage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          attachment,
        );

        const endpoint = APPW_ENDPOINT.replace(/\/v1$/, "");
        attachmentUrl = `${endpoint}/v1/storage/buckets/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${APPW_PROJECT_ID}&mode=admin`;
      } else {
        attachmentUrl = attachment === "" ? undefined : (attachment as string | undefined);
      }

      const taskData: Record<string, unknown> = {
        title,
        description,
        status,
        projectId,
        workspaceId,
      };

      if (dueDate) taskData.dueDate = dueDate;
      if (assigneeId) taskData.assigneeId = assigneeId;
      if (attachmentUrl) taskData.attachmentUrl = attachmentUrl;

      const task = await adminDatabases.createDocument(
        DATABASE_ID,
        TASKS_ID,
        ID.unique(),
        taskData,
      );

      return c.json({ data: task });
    }
  )
  .get(
    "/",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const admin = await createAdminClient();
      const adminDatabases = admin.databases;
      const user = c.get("user");

      const { projectId, workspaceId } = c.req.query();

      if (!workspaceId) {
        return c.json({ error: "Missing workspaceId" }, 400);
      }

      const member = await getMember({
        databases,
        workspaceId: String(workspaceId),
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const filters: Array<{ field: string; value: string }> = [];
      if (projectId) filters.push({ field: "projectId", value: String(projectId) });

      // Use the admin client to list tasks so the server (not the end-user) performs the read
      const tasks = await adminDatabases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [],
      );

      return c.json({ data: tasks });
    }
  );

export default app;
