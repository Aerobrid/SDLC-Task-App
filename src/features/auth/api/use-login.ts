import { toast } from "sonner";
// useMutation hook for user login
// we can use this hook since we wrapped the app with the QueryProvider in layout.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
// hono helpers to figure out request and response types for login API call
import { InferRequestType, InferResponseType } from "hono";

// to make API calls, we import the client from our RPC library
import { client } from "@/lib/rpc";
import { useRouter } from "next/navigation";

// Define types for the response and request of the login API call which is a POST request
type ResponseType = InferResponseType<typeof client.api.auth.login["$post"]>;
type RequestType = InferRequestType<typeof client.api.auth.login["$post"]>;

// Custom hook to handle user login
export const useLogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  // useMutation helps run server-side mutations and manage their state
  // <> tells TS what types to expect for the response, error, and request
  const mutation = useMutation<any, Error, any>({
    // when called, a request is made to the login endpoint
    mutationFn: async ({ json }: any) => {
      // takes json data from the request and makes a POST request to the login endpoint
      const response = await client.api.auth.login["$post"]({ json });
      
      if (!response.ok) {
        throw new Error("Failed to log in");
      }
      
      // returns the parsed JSON response from the API
      return  await response.json();
    },
    onSuccess: () => {
      toast.success("Logged in");
      // on successful login refresh the page
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["current"] });
    },
    onError: () => {
      toast.error("Failed to log in");
    },
  });
  // Return the mutation object with properties like isLoading, error, and mutate
	return mutation;
};