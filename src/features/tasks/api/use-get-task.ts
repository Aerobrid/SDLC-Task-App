import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

interface UseGetTaskProps {
  workspaceId: string;
  id: string;
}

export const useGetTask = ({ workspaceId, id }: UseGetTaskProps) => {
  return useQuery({
    queryKey: ["task", workspaceId, id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${id}?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      const body = await res.json();
      return body.data;
    },
  });
};

export default useGetTask;
