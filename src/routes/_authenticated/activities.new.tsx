import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ActivityForm } from "@/components/app/ActivityForm";
import { localToday, overviewQuery } from "@/lib/ui";

export const Route = createFileRoute("/_authenticated/activities/new")({
  head: () => ({
    meta: [
      { title: "Add activity — RunTheWeek" },
      { name: "description", content: "Add a new activity with drop-off, pickup and what to bring." },
      { property: "og:title", content: "Add activity — RunTheWeek" },
      { property: "og:description", content: "Add a new activity." },
    ],
  }),
  component: NewActivity,
});

function NewActivity() {
  const t = localToday();
  const q = useQuery(overviewQuery(t, t));
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Add activity</h1>
      {q.data ? <ActivityForm data={q.data} /> : <p className="text-muted-foreground">Loading…</p>}
    </div>
  );
}
