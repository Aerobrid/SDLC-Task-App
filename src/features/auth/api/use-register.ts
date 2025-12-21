import { toast } from "sonner";
// same imports foe the registration functionality
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<typeof client.api.auth.register["$post"]>;
type RequestType = InferRequestType<typeof client.api.auth.register["$post"]>;

// Custom hook to handle user registration
export const useRegister = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation<any, Error, any>({
    // when called, a request is made to the register endpoint
    // the request body is passed as json
    mutationFn: async ({ json }: any) => {
      const response = await client.api.auth.register["$post"]({ json });
      
      if (!response.ok) {
        throw new Error("Failed to register");
      }

      return  await response.json();
    },
    onSuccess: () => {
      toast.success("Registered");
      // on successful registration refresh the page
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["current"] });
    },
    onError: () => {
      toast.error("Failed to register");
    },
  });

	return mutation;
};