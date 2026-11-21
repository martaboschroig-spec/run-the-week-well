import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Repeat, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KidChip } from "@/components/app/parts";
import { kindLabel, localToday, overviewQuery, time12, toDate, who } from "@/lib/ui";

export const Route = createFileRoute("/_authenticated/activities/")({
  head: () => ({
    meta: [
      { title: "Activities — RunTheWeek" },
      { name: "description", content: "All your kids' activities in one place." },
      { property: "og:title", content: "Activities — RunTheWeek" },
      { property: "og:description", content: "All your kids' activities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Activities,
});

const DAYS = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

function Activities() {
  const t = localToday();
  const q = useQuery(overviewQuery(t, t));
  const d = q.data;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Activities</h1>
        <Button asChild className="hidden md:inline-flex"><Link to="/activities/new"><Plus className="h-4 w-4" /> Add activity</Link></Button>
      </div>
      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {d && !d.activities.length && <div className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">No activities yet. Add the first one — soccer, piano, swim…</div>}
      {d && d.children.map((c) => {
        const list = d.activities.filter((a) => a.child_id === c.id);
        if (!list.length) return null;
        return (
          <section key={c.id} className="space-y-3">
            <KidChip data={d} childId={c.id} />
            <ul className="space-y-3">
              {list.map((a) => {
                const asg = d.assignments.filter((x) => x.activity_id === a.id);
                const items = d.items.filter((i) => i.activity_id === a.id);
                const when = a.recurrence === "weekly"
                  ? `${(a.weekdays.length ? a.weekdays : [toDate(a.start_date).getDay()]).map((w) => DAYS[w]).join(", ")}`
                  : toDate(a.start_date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
                return (
                  <li key={a.id}>
                    <Link to="/activities/$id" params={{ id: a.id }} className="block rounded-3xl border bg-card p-5 shadow-soft hover:border-primary/40">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold">{a.name}</h3>
                        {a.recurrence === "weekly" && <Repeat className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <p className="text-muted-foreground">{when} · {time12(a.start_time)} – {time12(a.end_time)}</p>
                      {a.location && <p className="mt-1 flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" />{a.location}</p>}
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        {(["dropoff", "pickup"] as const).map((k) => {
                          const m = d.members.find((x) => x.id === asg.find((y) => y.kind === k)?.member_id);
                          return <span key={k}><span className="text-muted-foreground">{kindLabel(k)}: </span>{m ? <b>{who(m)}</b> : <b className="inline-flex items-center gap-1 text-attention"><AlertCircle className="h-3.5 w-3.5" />Not assigned</b>}</span>;
                        })}
                      </div>
                      {items.length > 0 && <p className="mt-2 text-sm text-muted-foreground">Bring: {items.map((i) => i.label).join(" · ")}</p>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
