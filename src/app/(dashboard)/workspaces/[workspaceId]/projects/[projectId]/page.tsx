"use client";

import { useMemo, useState } from "react";
import { ResponsiveModel } from "@/components/responsive-model";
import { EditProjectForm } from "@/features/projects/components/edit-project-form";
import { ImageIcon } from "lucide-react";
import { useGetProjects } from "@/features/projects/api/use-get-projects";

interface Project {
  $id: string;
  name?: string;
  workspaceId?: string;
}

interface ProjectDoc extends Project {
  imageUrl?: string;
}

export default function ProjectPage({ params }: { params: { workspaceId: string; projectId: string } }) {
  const { workspaceId, projectId } = params;
  const { data } = useGetProjects({ workspaceId });
  const [open, setOpen] = useState(false);

  const project = useMemo(() => {
    const docs = data?.documents as ProjectDoc[] | undefined;
    return docs?.find((p) => p.$id === projectId);
  }, [data, projectId]);

  const initial = project ? { $id: project.$id, name: project.name, imageUrl: project.imageUrl, workspaceId: project.workspaceId } : { $id: projectId, workspaceId };

  // rename handled via Edit modal

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{project?.name ?? `Project ${projectId}`}</h1>
          <p className="text-sm text-muted-foreground">Workspace {workspaceId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded border" onClick={() => setOpen(true)}>
            <ImageIcon className="size-4" />
            Edit Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-medium mb-2">Overview</h2>
          <p className="text-sm text-muted-foreground">Project analytics will appear here (placeholder).</p>
        </div>
      </div>
      </div>

      <ResponsiveModel open={open} onOpenChange={setOpen}>
        <EditProjectForm onCancel={() => setOpen(false)} initialValues={initial} />
      </ResponsiveModel>
    </>
  );
}
// show modal inside same component
// render modal outside main return so React rules are satisfied

// use a fragment to include modal
// helper modal is rendered inline in the component above

