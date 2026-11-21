import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { SegTabs } from "@/components/app/parts";
import { TaskAgenda, TaskSummary } from "@/components/app/TaskAgenda";
import { overviewQuery, who } from "@/lib/ui";
import { RANGE_OPTIONS, rangeFor } from "@/lib/ranges";

export const Route = createFileRoute("/_authenticated/family/$memberId")({
  validateSearch: z.object({ range: z.enum(["today", "week", "month", "all"]).optional() }),
  head: () => ({
    meta: [
      { title: "Responsibilities — RunTheWeek" },
      { name: "description", content: "Everything one family member is taking care of." },
      { property: "og:title", content: "Responsibilities — RunTheWeek" },
      { property: "og:description", content: "One person's drop-offs and pickups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MemberView,
});

function MemberView() {
  const { memberId } = Route.useParams();
  const { range = "month" } = Route.useSearch();
  const navigate = useNavigate({ from: "/family/$memberId" });
  const r = rangeFor(range);
  const q = useQuery(overviewQuery(r.from, r.to));
  const m = q.data?.members.find((x) => x.id === memberId);
  return (
    <div className="space-y-6">
      <Link to="/family" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"><ChevronLeft className="h-4 w-4" />Family</Link>
      {q.data && !m && <p className="text-muted-foreground">This person isn't in your family anymore.</p>}
      {q.data && m && (
        <>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{who(m)}'s responsibilities</h1>
            <TaskSummary data={q.data} memberId={m.id} />
          </div>
          <SegTabs value={range} onChange={(v) => navigate({ search: { range: v } })} options={RANGE_OPTIONS} />
          <TaskAgenda data={q.data} memberId={m.id} mine={m.id === q.data.me.id} emptyText={`${who(m)} has nothing assigned in this period.`} />
        </>
      )}
    </div>
  );
}
