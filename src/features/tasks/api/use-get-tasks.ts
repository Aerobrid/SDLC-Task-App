import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetTasksProps {
  workspaceId: string;
  projectIds?: string[];
  assigneeIds?: string[];
  statuses?: string[];
  dueDate?: string;
}

export const useGetTasks = ({ workspaceId, projectIds, assigneeIds, statuses, dueDate }: UseGetTasksProps) => {
  const queryKey = ["tasks", workspaceId, projectIds ?? [], assigneeIds ?? [], statuses ?? [], dueDate ?? null];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("workspaceId", workspaceId);
      projectIds?.forEach((p) => params.append("projectId", p));
      assigneeIds?.forEach((a) => params.append("assigneeId", a));
      statuses?.forEach((s) => params.append("status", s));
      if (dueDate) params.append("dueDate", dueDate);

      const response = await client.api.tasks.$get({ query: Object.fromEntries(params) });

      if (!response.ok) {
        if (response.status === 401) return { data: [], counts: {} } as any;
        throw new Error("Failed to fetch tasks");
      }

      const { data, counts } = await response.json();
      return { data, counts };
    },
  });

  return query;
};
