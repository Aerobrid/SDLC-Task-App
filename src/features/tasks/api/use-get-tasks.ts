import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetTasksProps {
  workspaceId: string;
  projectId?: string;
}

export const useGetTasks = ({ workspaceId, projectId }: UseGetTasksProps) => {
  const query = useQuery({
    queryKey: ["tasks", workspaceId, projectId],
    queryFn: async () => {
      const response = await client.api.tasks.$get({
        query: { workspaceId, projectId },
      });

      if (!response.ok) throw new Error("Failed to fetch tasks");

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
