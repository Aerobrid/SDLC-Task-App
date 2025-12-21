import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";
import { CreateTaskInput } from "../schemas";

type ResponseType = InferResponseType<typeof client.api.tasks["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.tasks["$post"]>;

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<any, Error, any>({
    mutationFn: async ({ form }: any) => {
      if (form.attachment instanceof File) {
        const fd = new FormData();
        fd.append("title", String(form.title));
        fd.append("description", String(form.description ?? ""));
        fd.append("status", String(form.status ?? "todo"));
        fd.append("projectId", String(form.projectId));
        fd.append("workspaceId", String(form.workspaceId));
        if (form.dueDate) fd.append("dueDate", String(form.dueDate));
        if (form.assigneeId) fd.append("assigneeId", String(form.assigneeId));
        fd.append("attachment", form.attachment as unknown as Blob);

        const response = await fetch(`/api/tasks`, {
          method: "POST",
          body: fd,
          credentials: "same-origin",
        });

        if (!response.ok) {
          const text = await response.text().catch(() => response.statusText);
          throw new Error(text || "Failed to create task");
        }

        return await response.json();
      }

      const response = await client.api.tasks["$post"]({ form });

      if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw new Error(text || "Failed to create task");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Task created");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Failed to create task");
    }
  });

  return mutation;
};
