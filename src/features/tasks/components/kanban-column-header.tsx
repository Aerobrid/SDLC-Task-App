"use client";

import React from "react";

type Props = {
  status: string;
  count: number;
  children?: React.ReactNode;
};

const StatusIcon = ({ status }: { status: string }) => {
  // Render simple icons using CSS so we avoid depending on extra icon names
  if (status === "in-progress") {
    return <span className="w-3 h-3 rounded-full border-2 border-dashed border-sky-400 inline-block mr-2" />;
  }
  if (status === "in-review") {
    return <span className="w-3 h-3 rounded-full bg-teal-400 inline-block mr-2" />;
  }
  if (status === "done") {
    return (
      <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-800 mr-2">
        ✓
      </span>
    );
  }
  if (status === "backlog") {
    return <span className="w-3 h-3 rounded-full bg-violet-400 inline-block mr-2" />;
  }
  // todo or default — show a checklist/list icon for "todo"
  return (
    <span className="inline-flex items-center justify-center mr-2" aria-hidden>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M7 9h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M7 13h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
};

export const KanbanColumnHeader = ({ status, count, children }: Props) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100">
      <div className="flex items-center text-sm font-medium">
        <StatusIcon status={status} />
        <span className="capitalize">{status.replace("-", " ")}</span>
      </div>
      <div className="text-xs text-muted-foreground">{count}</div>
    </div>
  );
};

export default KanbanColumnHeader;
