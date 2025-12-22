"use client";

import { ResponsiveModel } from "@/components/responsive-model";
import CreateTaskForm from "./create-task-form";
import { useCreateTaskModel } from "../hooks/use-create-task-model";

export const CreateTaskModel = ({ projectId }: { projectId?: string }) => {
  const { isOpen, setIsOpen, close } = useCreateTaskModel();

  return (
    <ResponsiveModel open={isOpen} onOpenChange={setIsOpen}>
      <CreateTaskForm projectId={projectId ?? ""} onSuccess={close} onCancel={close} />
    </ResponsiveModel>
  );
};

export default CreateTaskModel;
