import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { SegTabs } from "@/components/app/parts";
import { TaskAgenda, TaskSummary } from "@/components/app/TaskAgenda";
import { overviewQuery } from "@/lib/ui";
import { RANGE_OPTIONS, rangeFor } from "@/lib/ranges";

export const Route = createFileRoute("/_authenticated/tasks")({
  validateSearch: z.object({ range: z.enum(["today", "week", "month", "all"]).optional() }),
  head: () => ({
    meta: [
      { title: "My Tasks — RunTheWeek" },
      { name: "description", content: "What you need to do: your drop-offs and pickups." },
      { property: "og:title", content: "My Tasks — RunTheWeek" },
      { property: "og:description", content: "Your drop-offs and pickups." },
    ],
  }),
  component: Tasks,
});

function Tasks() {
  const { range = "today" } = Route.useSearch();
  const navigate = useNavigate({ from: "/tasks" });
  const r = rangeFor(range);
  const q = useQuery(overviewQuery(r.from, r.to));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">My Tasks</h1>
        <p className="mt-1 text-muted-foreground">What do I need to do?</p>
      </div>
      <div className="overflow-x-auto"><SegTabs value={range} onChange={(v) => navigate({ search: { range: v } })} options={RANGE_OPTIONS} /></div>
      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {q.data && (
        <>
          {range !== "today" && <TaskSummary data={q.data} memberId={q.data.me.id} />}
          <TaskAgenda data={q.data} memberId={q.data.me.id} mine emptyText="You have no drop-offs or pickups in this period." />
        </>
      )}
    </div>
  );
}
