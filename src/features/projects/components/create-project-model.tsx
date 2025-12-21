"use client";

import { ResponsiveModel } from "@/components/responsive-model";

import { CreateProjectForm } from "./create-project-form";

import { useCreateProjectModel } from "../hooks/use-create-project-model";

export const CreateProjectModel = () => {
  const { isOpen, setIsOpen, close } = useCreateProjectModel();

  return (
    <ResponsiveModel open={isOpen} onOpenChange={setIsOpen}>
      <CreateProjectForm onCancel={close} />
    </ResponsiveModel>
  );
};
