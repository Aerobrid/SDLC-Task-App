"use client";

import { useForm } from "react-hook-form";
import { useRef, useEffect, useMemo } from "react";
import { ImageIcon, ArrowLeftIcon } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DottedSeparator } from "@/components/dotted-separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useUpdateProject } from "../api/use-update-project";
import { useDeleteProject } from "../api/use-delete-project";
import { createProjectSchema } from "../schemas";
import { useConfirm } from "@/hooks/use-confirm";

interface EditProjectFormProps {
  onCancel?: () => void;
  initialValues: { $id: string; name?: string; imageUrl?: string; workspaceId?: string };
}

export const EditProjectForm = ({ onCancel, initialValues }: EditProjectFormProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { mutate, isPending } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject();
  const [DeleteDialogue, confirmDelete] = useConfirm(
    "Delete Project",
    "Are you sure you want to delete this project? This action cannot be undone.",
    "destructive"
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const schema = createProjectSchema.omit({ workspaceId: true });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues.name ?? "",
      image: initialValues.imageUrl ?? "",
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    const finalValues: z.infer<typeof schema> & { workspaceId?: string } = {
      ...values,
      workspaceId,
    };

    mutate({ form: finalValues, param: { projectId: initialValues.$id } }, {
      onSuccess: ({ data }) => {
        form.reset();
        router.push(`/workspaces/${data.workspaceId}/projects/${data.$id}`);
        if (onCancel) onCancel();
      }
    });
  };

  const handleDelete = async () => {
    const ok = await confirmDelete();
    if (!ok) return;
    deleteProject({ param: { projectId: initialValues.$id } }, {
      onSuccess: () => {
        // navigate back to workspace page
        window.location.href = `/workspaces/${initialValues.workspaceId}`;
      }
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) form.setValue("image", file);
  };

  const watchedImage = form.watch("image");

  const previewUrl = useMemo(() => {
    if (!watchedImage) return undefined;
    if (watchedImage instanceof File) return URL.createObjectURL(watchedImage as File);
    if (typeof watchedImage === "string") return watchedImage;
    return undefined;
  }, [watchedImage]);

  useEffect(() => {
    let url: string | undefined;
    if (watchedImage instanceof File) {
      url = URL.createObjectURL(watchedImage as File);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [watchedImage]);


  return (
    <div className="flex flex-col gap-y-4">
      <DeleteDialogue />
      <Card className="w-full h-full border-none shadow-none">
        <CardHeader className="flex flex-row items-center gap-x-4 p-7 space-y-0">
          <Button variant="outline" size="sm" onClick={onCancel ? onCancel : () => router.push(`/workspaces/${initialValues.workspaceId}`)}>
            <ArrowLeftIcon className="size-4 " />
            Back
          </Button>
          <CardTitle className="text-xl font-bold ">
            {initialValues.name}
          </CardTitle>
        </CardHeader>
        <div className="px-7">
          <DottedSeparator />
        </div>
        <CardContent className="p-7">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter project name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <div className="flex flex-col gap-y-2">
                      <div className="flex items-center gap-x-5">
                        {previewUrl ? (
                          <div className="size-[72px] relative rounded-md overflow-hidden">
                            <Avatar className="size-[72px]">
                              <AvatarImage src={previewUrl} alt={form.getValues("name") ?? "project"} />
                            </Avatar>
                          </div>
                        ) : (
                          <Avatar className="size-[72px]">
                            <AvatarFallback>
                              <ImageIcon className="size-[36px] text-neutral-400" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col">
                          <p className="text-sm">Project Icon</p>
                          <p className="text-sm text-muted-foreground">JPG, PNG, SVG or JPEG, max 1 mb</p>
                          <input className="hidden" type="file" accept=".jpg, .png, .svg, .jpeg" ref={inputRef} onChange={handleImageChange} disabled={isPending} />
                          {field.value ? (
                            <Button type="button" disabled={isPending} variant="destructive" size="xs" className="w-fit mt-2" onClick={() => { field.onChange(""); if (inputRef.current) inputRef.current.value = ""; }}>Remove Image</Button>
                          ) : (
                            <Button type="button" disabled={isPending} variant="tertiary" size="xs" className="w-fit mt-2" onClick={() => inputRef.current?.click()}>Upload Image</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
              <DottedSeparator className="py-7" />
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  variant="primary"
                  disabled={isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Invite members removed for projects */}

      <Card className="w-full h-full border-none shadow-none">
        <CardContent className="p-7">
          <div className="flex flex-col">
            <h3 className="font-bold">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Deleting a project is an irreversible action and will remove all associated data.
            </p>
            <DottedSeparator className="py-7" />
            <Button
              className="mt-6 w-fit ml-auto"
              variant="destructive"
              size="sm"
              type="button"
              disabled={isPending || isDeleting}
              onClick={handleDelete}
            >
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
