"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Calendar as BigCalendar, dateFnsLocalizer, Event as RBCEvent, Navigate } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

type Task = {
  $id: string;
  title: string;
  projectId?: string;
  assigneeId?: string;
  assigneeName?: string;
  status?: string;
  dueDate?: string;
};

type Props = {
  tasks: Task[];
  workspaceId: string | number;
  projectsById?: Record<string, { name?: string }>;
  membersByUserId?: Record<string, { name?: string; email?: string }>;
};

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const STATUS_COLOR: Record<string, string> = {
  backlog: "#7c3aed",
  todo: "#6b7280",
  "in-progress": "#0ea5e9",
  inprogress: "#0ea5e9",
  "in-review": "#14b8a6",
  done: "#6366f1",
};

// Toolbar will be defined inside the component to access date state

export default function DataCalendar({ tasks, workspaceId, projectsById = {}, membersByUserId = {} }: Props) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());

  const events: RBCEvent[] = tasks
    .filter((t) => t.dueDate)
    .map((t) => {
      const d = new Date(t.dueDate!);
      return { id: t.$id, title: t.title, start: d, end: d, allDay: true, task: t } as unknown as RBCEvent;
    });

  const eventStyleGetter = (event: any) => {
    const t: Task = event.task;
    const status = (t.status ?? "todo") as string;
    const bg = STATUS_COLOR[status] ?? "#6b7280";
    return { style: { backgroundColor: bg, color: "white", borderRadius: 6, padding: 6 } };
  };

  const EventComponent = ({ event }: { event: any }) => {
    const t: Task = event.task;
    const project = t.projectId ? projectsById[t.projectId]?.name ?? "Project" : "—";
    const assignee = t.assigneeName ?? (t.assigneeId ? membersByUserId[t.assigneeId]?.name ?? "—" : "—");
    return (
      <div className="text-xs leading-tight min-w-0">
        <div className="font-medium truncate">{t.title}</div>
        <div className="truncate">{project} • {assignee}</div>
      </div>
    );
  };

  function Toolbar({ label }: any) {
    return (
      <div className="grid grid-cols-3 items-center mb-3">
        <div />

        <div className="flex items-center justify-center gap-3">
          <button
            aria-label="Previous"
            className="p-1 rounded hover:bg-slate-100"
            onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 010 1.06L9.06 10l3.73 3.71a.75.75 0 11-1.06 1.06l-4.24-4.22a.75.75 0 010-1.06l4.24-4.22a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="text-lg font-semibold">{label}</div>

          <button
            aria-label="Next"
            className="p-1 rounded hover:bg-slate-100"
            onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 010 1.06L9.06 10l3.73 3.71a.75.75 0 11-1.06 1.06l-4.24-4.22a.75.75 0 010-1.06l4.24-4.22a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div />
      </div>
    );
  }

  return (
    <div className="h-[88vh]">
      <BigCalendar
        localizer={localizer}
        events={events}
        date={currentDate}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={["month"]}
        onSelectEvent={(ev: any) => router.push(`/workspaces/${workspaceId}/tasks/${ev.id}`)}
        eventPropGetter={eventStyleGetter}
        components={{ toolbar: Toolbar, event: EventComponent }}
        popup={false}
      />

      <style jsx global>{`
        /* Keep the weekday header row compact */
        .rbc-month-view .rbc-row:first-child {
          min-height: unset !important;
        }

        /* Make other month rows taller so day cells are larger */
        .rbc-month-view .rbc-row:not(:first-child) {
          min-height: 160px;
        }

        /* Ensure the row content (cells) expand to fill the row height */
        .rbc-month-view .rbc-row .rbc-row-content {
          min-height: 140px;
        }

        /* Make sure events render visibly inside day cells */
        .rbc-month-view .rbc-event,
        .rbc-month-view .rbc-day-slot .rbc-event {
          position: relative !important;
          display: block !important;
          width: auto !important;
        }

        /* Wrap event text and improve spacing */
        .rbc-event {
          white-space: normal !important;
          padding: 6px !important;
          margin-bottom: 4px;
        }

        /* Hide default right-side controls if present */
        .rbc-toolbar .rbc-btn-group.rbc-right { display: none; }
      `}</style>
    </div>
  );
}
