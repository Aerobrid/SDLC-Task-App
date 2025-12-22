import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useUpdateTask = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId, form }: { id: string; workspaceId: string; form: Record<string, unknown> }) => {
      const res = await fetch(`/api/tasks/${id}?workspaceId=${encodeURIComponent(workspaceId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      toast.success("Task updated");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      if (variables && variables.workspaceId && variables.id) {
        qc.invalidateQueries({ queryKey: ["task", variables.workspaceId, variables.id] });
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Failed to update task");
    }
  });
};

export default useUpdateTask;
