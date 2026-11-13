import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ActivityForm } from "@/components/app/ActivityForm";
import { localToday, overviewQuery } from "@/lib/ui";

export const Route = createFileRoute("/_authenticated/activities/$id")({
  head: () => ({
    meta: [
      { title: "Edit activity — RunTheWeek" },
      { name: "description", content: "Change times, place, who drives and what to bring." },
      { property: "og:title", content: "Edit activity — RunTheWeek" },
      { property: "og:description", content: "Edit an activity." },
    ],
  }),
  component: EditActivity,
});

function EditActivity() {
  const { id } = Route.useParams();
  const t = localToday();
  const q = useQuery(overviewQuery(t, t));
  const exists = q.data?.activities.some((a) => a.id === id);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Edit activity</h1>
      {!q.data ? <p className="text-muted-foreground">Loading…</p>
        : !exists ? <p className="text-muted-foreground">This activity no longer exists. <Link to="/activities" className="font-semibold text-primary">Back to activities</Link></p>
        : <ActivityForm key={id} data={q.data} activityId={id} />}
    </div>
  );
}
