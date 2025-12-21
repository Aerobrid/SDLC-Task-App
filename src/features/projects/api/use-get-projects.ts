// import useQuery hook from react-query to automatically fetch and cache data
import { useQuery } from "@tanstack/react-query";

// Importing the client from the RPC library to make API calls
import { client } from "@/lib/rpc";

interface UseGetProjectsProps {
  workspaceId: string;
}


// This hook is used to fetch the Project data 
export const useGetProjects = ({
  workspaceId,
}: UseGetProjectsProps) => {
    const query = useQuery({
        queryKey: ["projects", workspaceId],
        queryFn: async () => {
          const response = await client.api.projects.$get({
            query: { workspaceId },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch projects");
          }

          const { data } = await response.json();

          return data;
        },
    });

    return query;
};