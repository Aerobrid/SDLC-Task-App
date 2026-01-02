import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ID, Query } from "node-appwrite";
import { z } from "zod";

import { APPW_ENDPOINT, APPW_PROJECT_ID, DATABASE_ID, IMAGES_BUCKET_ID, PROJECTS_ID } from "@/config";
import { getMember } from "@/features/members/utils";
import { sessionMiddleware } from "@/lib/session-middleware";
import { createProjectSchema } from "../schemas";

const app = new Hono()
  .post(
    "/",
    sessionMiddleware,
    zValidator("form", createProjectSchema),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { name, image, workspaceId } = c.req.valid("form");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      let uploadedImageUrl: string | undefined;
      let uploadedImageId: string | undefined;

      if (image instanceof File) {
        const file = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          image,
        );

        uploadedImageId = file.$id;

        // Clean up APPWRITE_ENDPOINT to avoid double /v1
        const endpoint = APPW_ENDPOINT.replace(/\/v1$/, "");

        uploadedImageUrl = `${endpoint}/v1/storage/buckets/${IMAGES_BUCKET_ID}/files/${uploadedImageId}/view?project=${APPW_PROJECT_ID}`;
      }

      const projectData: Record<string, unknown> = {
        name,
        workspaceId,
      };

      if (uploadedImageUrl) {
        projectData.imageUrl = uploadedImageUrl;
      }

      const project = await databases.createDocument(
        DATABASE_ID,
        PROJECTS_ID,
        ID.unique(),
        projectData,
      );

      return c.json({ data: project });
    }
  )
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");

      const { workspaceId } = c.req.valid("query");

      if (!workspaceId) {
        return c.json({ error: "Missing WorkspaceId" }, 400);
      }

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if(!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const projects = await databases.listDocuments(
        DATABASE_ID,
        PROJECTS_ID,
        [
          Query.equal("workspaceId", workspaceId),
          Query.orderDesc("$createdAt"),
        ],
      );

      return c.json({ data: projects });
    }
  );

// add update and delete endpoints for projects
app
  .patch(
    "/:projectId",
    sessionMiddleware,
    zValidator("form", createProjectSchema.partial().omit({ workspaceId: true })),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { projectId } = c.req.param();

      // check membership by querying project and workspace
      const project = await databases.getDocument(DATABASE_ID, PROJECTS_ID, projectId).catch(() => null);
      if (!project) return c.json({ error: "Not found" }, 404);

      const member = await getMember({ databases, workspaceId: project.workspaceId, userId: user.$id });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      const { name, image } = c.req.valid("form");

      const updateData: Record<string, unknown> = {};
      if (typeof name !== "undefined") updateData.name = name;

      let uploadedImageUrl: string | undefined;

      if (image instanceof File) {
        const file = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          image,
        );

        const endpoint = APPW_ENDPOINT.replace(/\/v1$/, "");
        uploadedImageUrl = `${endpoint}/v1/storage/buckets/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${APPW_PROJECT_ID}`;

        updateData.imageUrl = uploadedImageUrl;
      } else if (typeof image === "string") {
        updateData.imageUrl = image === "" ? undefined : image;
      }

      if (Object.keys(updateData).length === 0) {
        return c.json({ error: "No update data provided" }, 400);
      }

      const updated = await databases.updateDocument(DATABASE_ID, PROJECTS_ID, projectId, updateData);
      return c.json({ data: updated });
    }
  )
  .delete(
    "/:projectId",
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { projectId } = c.req.param();

      const project = await databases.getDocument(DATABASE_ID, PROJECTS_ID, projectId).catch(() => null);
      if (!project) return c.json({ error: "Not found" }, 404);

      const member = await getMember({ databases, workspaceId: project.workspaceId, userId: user.$id });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);
      return c.json({ data: { ok: true } });
    }
  );

export default app;