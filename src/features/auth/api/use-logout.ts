import { toast } from "sonner";
// same imports for the logout functionality
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<typeof client.api.auth.logout["$post"]>;

// custom hook to handle user logout
export const useLogout = () => {
  const router = useRouter();
  // useQueryClient to access the query client instance for managing cache and queries
  const queryClient = useQueryClient();
  
  // to handle the logout mutation
  const mutation = useMutation<any, Error, any>({
    // when called, a request is made to the logout endpoint
    // the request does not require any body, so we don't pass any parameters
    mutationFn: async () => {
      const response = await client.api.auth.logout["$post"]();

      if (!response.ok) {
        throw new Error("Failed to log out");
      }

      return  await response.json();
    },
    // if mutation is a success (response is ok), invalidate the "current" query
    // this means that the next time the "current" query is used, it will refetch the data
    // this is important to ensure that the user data is up-to-date after logout
    onSuccess: () => {
      toast.success("Logged out");
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["current"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
    onError: () => {
      toast.error("Failed to log out");
    }
  });

	return mutation;
};