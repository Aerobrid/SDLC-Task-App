import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { CreateTaskInput } from "../schemas";

type RequestType = { form: CreateTaskInput };

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, RequestType>({
    mutationFn: async ({ form }: RequestType) => {
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
