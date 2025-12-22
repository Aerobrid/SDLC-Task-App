import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.projects[":projectId"]["$patch"]>;

export const useUpdateProject = () => {
  const qc = useQueryClient();

  const mutation = useMutation<any, Error, any>({
    mutationFn: async ({ form, param }: any) => {
      // If the client sent a File for `image`, use multipart form upload
      if (form?.image instanceof File) {
        const fd = new FormData();
        if (typeof form.name !== "undefined") fd.append("name", String(form.name));
        if (typeof form.workspaceId !== "undefined") fd.append("workspaceId", String(form.workspaceId));
        fd.append("image", form.image as unknown as Blob);

        const response = await fetch(`/api/projects/${param.projectId}`, {
          method: "PATCH",
          body: fd,
          credentials: "same-origin",
        });

        if (!response.ok) {
          const text = await response.text().catch(() => response.statusText);
          throw new Error(text || "Failed to update project");
        }

        return await response.json();
      }

      // Otherwise send JSON via RPC client
      const res = await client.api.projects[":projectId"]["$patch"]({ form, param });
      if (!res.ok) throw new Error("Failed to update project");
      return await res.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Project updated");
      qc.invalidateQueries({ queryKey: ["projects", data.workspaceId] });
      qc.invalidateQueries({ queryKey: ["project", data.$id] });
    },
    onError: () => toast.error("Failed to update project"),
  });

  return mutation;
};
