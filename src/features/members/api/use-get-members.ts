// import useQuery hook from react-query to automatically fetch and cache data
import { useQuery } from "@tanstack/react-query";

// Importing the client from the RPC library to make API calls
import { client } from "@/lib/rpc";

interface UseGetMembersProps {
  workspaceId: string;
}

// exporting custom hook useGetWorkspaces
// This hook is used to fetch the workspaces data with ease
export const useGetMembers = ({ workspaceId }: UseGetMembersProps) => {
    // use useQuery to manage fetching, caching, and updating the current user data
    const query = useQuery({
        // pass in a unique key for the query describing the data being fetched
        queryKey: ["members", workspaceId],
        // function to actually fetch the data, this function is called when the query is executed
        queryFn: async () => {
          // make get request to the API endpoint to fetch current user data
          const response = await client.api.members.$get({ query: { workspaceId } });

          // if the response is not ok, handle 401 gracefully
          if (!response.ok) {
            if (response.status === 401) return { documents: [], total: 0 } as any;
            throw new Error("Failed to fetch members");
          }

          // parse the JSON response to get the current user data
          const { data } = await response.json();

          return data;
        },
    });

    return query;
};