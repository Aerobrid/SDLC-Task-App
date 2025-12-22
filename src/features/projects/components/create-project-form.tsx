"use client";

import { useForm } from "react-hook-form";
import { useRef, useMemo, useEffect } from "react";
import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

import { useCreateProject } from "../api/use-create-projects";
import { createProjectSchema } from "../schemas";

interface CreateProjectFormProps {
  onCancel?: () => void; 
};

export const CreateProjectForm = ({ onCancel }: CreateProjectFormProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate, isPending } = useCreateProject();

  const inputRef = useRef<HTMLInputElement>(null);

  const createProjectInputSchema = createProjectSchema.omit({ workspaceId: true });

  const form = useForm<z.infer<typeof createProjectInputSchema>>({
    resolver: zodResolver(createProjectInputSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = ( values: z.infer<typeof createProjectInputSchema> ) => {
    const finalValues = { 
      ...values,
      workspaceId,
      image: values.image instanceof File ? values.image : "",
    };
    
    mutate({ form: finalValues },
      {
        onSuccess: () => {
          form.reset();
          // TODO: Redirect to project screen
        },
      });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
    }
  }

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
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold ">
          Create a new project
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
                      <Input 
                        {...field}
                        placeholder="Enter project name" 
                      />
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt="Logo"
                            src={previewUrl}
                            className="object-cover w-full h-full"
                          />
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
                        <p className="text-sm text-muted-foreground">
                           JPG, PNG, SVG or JPEG, max 1 mb
                        </p>
                        <input 
                          className="hidden"
                          type="file"
                          accept=".jpg, .png, .svg, .jpeg"
                          ref={inputRef}
                          onChange={handleImageChange}
                          disabled={isPending}
                        />
                        {field.value ? (
                          <Button
                            type="button"
                            disabled={isPending}
                            variant="destructive"
                            size="xs"
                            className="w-fit mt-2"
                            onClick={() => {
                              field.onChange("");
                              if (inputRef.current) {
                                inputRef.current.value = "";
                              }
                            }}
                          >
                            Remove Image
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            disabled={isPending}
                            variant="tertiary"
                            size="xs"
                            className="w-fit mt-2"
                            onClick={() => inputRef.current?.click()}
                          >
                            Upload Image
                          </Button>
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
                className={cn(!onCancel && "invisible")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                variant="primary"
                disabled={isPending}
              >
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};