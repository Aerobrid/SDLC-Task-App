import { toast } from "sonner";
// useMutation hook for user login
// we can use this hook since we wrapped the app with the QueryProvider in layout.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
// hono helpers to figure out request and response types for login API call
import { InferRequestType, InferResponseType } from "hono";

// to make API calls, we import the client from our RPC library
import { client } from "@/lib/rpc";

// Define types for the response and request of the login API call which is a DELETE request
type ResponseType = InferResponseType<typeof client.api.workspaces[":workspaceId"]["$delete"], 200>;
type RequestType = InferRequestType<typeof client.api.workspaces[":workspaceId"]["$delete"]>;

// Custom hook to handle user login
export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();
  // useMutation helps run server-side mutations and manage their state
  // <> tells TS what types to expect for the response, error, and request
  const mutation = useMutation<any, Error, any>({
    // when called, a request is made to the login endpoint
    mutationFn: async ({ param }: any) => {
      // takes json data from the request and makes a DELETE request to the login endpoint
      const response = await client.api.workspaces[":workspaceId"]["$delete"]({ param });

      if (!response.ok) {
        throw new Error("Failed to delete workspace");
      }
      
      // returns the parsed JSON response from the API
      return  await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Workspace deleted");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", data.$id] });
    },
    onError: () => {
      toast.error("Failed to delete workspace");
    }
  });
  // Return the mutation object with properties like isLoading, error, and mutate
	return mutation;
};