import { redirect } from "next/navigation";
import { getCurrent } from "@/features/auth/queries";
import HomeAnalytics from "@/features/workspaces/components/home-analytics";

const WorkspaceIdPage = async ({ params }: { params: { workspaceId: string } }) => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  const { workspaceId } = params;

  return <HomeAnalytics workspaceId={workspaceId} />;
};

export default WorkspaceIdPage;