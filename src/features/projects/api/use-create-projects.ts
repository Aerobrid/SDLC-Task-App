import { toast } from "sonner";
// useMutation hook for user login
// we can use this hook since we wrapped the app with the QueryProvider in layout.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
// hono helpers to figure out request and response types for login API call

// to make API calls, we import the client from our RPC library
import { client } from "@/lib/rpc";

// (response/request types removed - using loose `any` for RPC client interoperability)

// Custom hook to handle user login
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  // useMutation helps run server-side mutations and manage their state
  // <> tells TS what types to expect for the response, error, and request
  const mutation = useMutation<any, Error, any>({
    // when called, a request is made to the login endpoint
    mutationFn: async ({ form }: any) => {
      // If an image File is present, send as multipart FormData (browser File can't be JSON-stringified)
      if (form.image instanceof File) {
        const fd = new FormData();
        fd.append("name", String(form.name));
        fd.append("workspaceId", String(form.workspaceId));
        fd.append("image", form.image as unknown as Blob);

        const response = await fetch(`/api/projects`, {
          method: "POST",
          body: fd,
          credentials: "same-origin",
        });

        if (!response.ok) {
          const text = await response.text().catch(() => response.statusText);
          throw new Error(text || "Failed to create project");
        }

        return await response.json();
      }

      // otherwise send JSON via the RPC client
      const response = await client.api.projects["$post"]({ form });

      if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw new Error(text || "Failed to create project");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Failed to create project");
    }
  });
  // Return the mutation object with properties like isLoading, error, and mutate
	return mutation;
};