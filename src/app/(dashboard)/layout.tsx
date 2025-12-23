import { SideBar } from '@/components/sidebar';
import { Navbar } from '@/components/navbar';

import { CreateWorkspaceModel } from '@/features/workspaces/components/create-workspace-model';
import { CreateProjectModel } from '@/features/projects/components/create-project-model';
import React, { Suspense } from 'react';

interface DashBoardLayoutProps {
  children: React.ReactNode;
};

const DashBoardLayout = ({ children }: DashBoardLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <CreateWorkspaceModel />
        <CreateProjectModel />
      </Suspense>
      <div className="flex w-full h-full">
        <div className="fixed left-0 top-0 hidden lg:block lg:w-[264px] h-full overflow-y-auto">
          <SideBar />
        </div>
        <div className="lg:pl-[264px] w-full">
          <div className="mx-auto max-w-screen-2xl h-full">
            <Navbar />
            <main className="h-full py-8 px-6 flex flex-col">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );

}

export default DashBoardLayout;