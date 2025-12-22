import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useReorderTasks = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, updates }: { workspaceId: string; updates: Array<Record<string, unknown>> }) => {
      const res = await fetch(`/api/tasks/reorder?workspaceId=${encodeURIComponent(workspaceId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const details = body?.details ?? body?.error ?? body;
        throw new Error(typeof details === "string" ? details : "Failed to reorder tasks");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || "Failed to save order");
    }
  });
};

export default useReorderTasks;
