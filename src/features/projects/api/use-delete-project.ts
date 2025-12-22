import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["$delete"], 200>;
type RequestType = InferRequestType<typeof client.api.projects[":projectId"]["$delete"]>;

export const useDeleteProject = () => {
  const qc = useQueryClient();

  const mutation = useMutation<any, Error, any>({
    mutationFn: async ({ param }: any) => {
      const res = await client.api.projects[":projectId"]["$delete"]({ param });
      if (!res.ok) throw new Error("Failed to delete project");
      return await res.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Project deleted");
      qc.invalidateQueries({ queryKey: ["projects", data.workspaceId] });
    },
    onError: () => toast.error("Failed to delete project"),
  });

  return mutation;
};
