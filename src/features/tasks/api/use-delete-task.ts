import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useDeleteTask = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const res = await fetch(`/api/tasks/${id}?workspaceId=${encodeURIComponent(workspaceId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      // also invalidate any single-task queries if present
      qc.invalidateQueries({ predicate: (query) => query.queryKey[0] === "task" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Failed to delete task");
    }
  });
};

export default useDeleteTask;
