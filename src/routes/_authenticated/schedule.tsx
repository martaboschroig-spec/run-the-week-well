import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";
import { AttentionList, CoveredHero, OccurrenceCard, SegTabs, type Data } from "@/components/app/parts";
import { dayLabel, iso, kidDot, localToday, monthBounds, overviewQuery, shift, startOfWeek, toDate } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { DayWeather } from "@/components/app/Weather";

const search = z.object({ view: z.enum(["day", "week", "month"]).optional(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });

export const Route = createFileRoute("/_authenticated/schedule")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Schedule — RunTheWeek" },
      { name: "description", content: "Your family's day, week and month at a glance." },
      { property: "og:title", content: "Schedule — RunTheWeek" },
      { property: "og:description", content: "Your family's week at a glance." },
    ],
  }),
  component: Schedule,
});

function Schedule() {
  const { view = "week", date } = Route.useSearch();
  const navigate = useNavigate({ from: "/schedule" });
  const today = localToday();
  const anchor = date ?? today;
  const range = view === "day" ? { from: anchor, to: anchor } : view === "week" ? { from: startOfWeek(anchor), to: shift(startOfWeek(anchor), 6) } : monthBounds(anchor);
  const q = useQuery(overviewQuery(range.from, range.to));
  const go = (v: typeof view, d?: string) => navigate({ search: { view: v, date: d } });
  const step = (dir: number) => {
    if (view === "day") return go(view, shift(anchor, dir));
    if (view === "week") return go(view, shift(anchor, 7 * dir));
    const d = toDate(anchor); return go(view, iso(new Date(d.getFullYear(), d.getMonth() + dir, 1)));
  };
  const title = view === "day" ? dayLabel(anchor, today)
    : view === "week" ? (range.from <= today && today <= range.to ? "Your week" : `Week of ${toDate(range.from).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`)
    : toDate(anchor).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegTabs value={view} onChange={(v) => go(v, date)} options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]} />
        <div className="flex items-center gap-1">
          <button aria-label="Previous" onClick={() => step(-1)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => go(view)} className="h-11 rounded-full px-4 text-sm font-semibold hover:bg-secondary">Today</button>
          <button aria-label="Next" onClick={() => step(1)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        {q.data && <Stats data={q.data} view={view} />}
      </div>
      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {q.error && <p className="text-attention">We couldn't load the schedule. Please refresh.</p>}
      {q.data && (
        <>
          {q.data.overview.attention.length > 0 ? <AttentionList data={q.data} items={q.data.overview.attention} />
            : q.data.overview.stats.total > 0 && <CoveredHero title={view === "week" ? "Your week is covered" : view === "day" ? "Today is covered" : "Everything's covered"} />}
          {view === "month" ? <MonthGrid data={q.data} anchor={anchor} onPick={(d) => go("day", d)} /> : <DayList data={q.data} from={range.from} to={range.to} />}
        </>
      )}
    </div>
  );
}

function Stats({ data, view }: { data: Data; view: string }) {
  const s = data.overview.stats;
  if (!s.total) return <p className="mt-1 text-muted-foreground">Nothing planned{view === "day" ? " today" : ""}.</p>;
  return (
    <p className="mt-1 text-muted-foreground">
      {s.total} {s.total === 1 ? "activity" : "activities"} · <span className="font-semibold text-covered">{s.covered} covered</span>
      {s.attention > 0 && <> · <span className="font-semibold text-attention">{s.attention} need attention</span></>}
      {s.waiting > 0 && <> · <span className="font-semibold text-waiting">{s.waiting} waiting for approval</span></>}
    </p>
  );
}

function DayList({ data, from, to }: { data: Data; from: string; to: string }) {
  const days: string[] = [];
  for (let d = from; d <= to; d = shift(d, 1)) days.push(d);
  const groups = days.map((d) => ({ d, list: data.overview.occurrences.filter((o) => o.date === d) })).filter((g) => g.list.length || from === to);
  if (!data.overview.occurrences.length) return <EmptyPlan />;
  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.d}>
          <div className="mb-3 flex items-center gap-3">{from !== to && <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{dayLabel(g.d)}</h2>}<DayWeather date={g.d} /></div>
          <div className="space-y-4">{g.list.map((o) => <OccurrenceCard key={o.key} data={data} o={o} />)}</div>
        </section>
      ))}
    </div>
  );
}

function EmptyPlan() {
  return <div className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">Nothing planned here yet. Tap <span className="font-semibold text-foreground">+ Add activity</span> to start.</div>;
}

function MonthGrid({ data, anchor, onPick }: { data: Data; anchor: string; onPick: (d: string) => void }) {
  const { from, to } = monthBounds(anchor);
  const start = startOfWeek(from);
  const cells: string[] = [];
  for (let d = start; d <= to || cells.length % 7; d = shift(d, 1)) cells.push(d);
  const today = localToday();
  return (
    <div className="rounded-3xl border bg-card p-3 shadow-soft sm:p-5">
      <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const list = data.overview.occurrences.filter((o) => o.date === d);
          const inMonth = d >= from && d <= to;
          const bad = list.some((o) => o.status === "attention");
          const wait = list.some((o) => o.status === "waiting");
          return (
            <button key={d} disabled={!inMonth} onClick={() => onPick(d)} className={cn("flex aspect-square flex-col items-center justify-start gap-1 rounded-2xl pt-2 text-sm font-semibold hover:bg-secondary disabled:opacity-0", d === today && "bg-accent text-accent-foreground")}>
              <span className={cn(bad && "text-attention")}>{toDate(d).getDate()}</span>
              <span className="flex flex-wrap justify-center gap-0.5">
                {list.slice(0, 4).map((o) => <span key={o.key} className={cn("h-1.5 w-1.5 rounded-full", kidDot[data.children.find((c) => c.id === o.childId)?.color ?? "lavender"])} />)}
              </span>
              {(bad || wait) && <span className={cn("h-1 w-4 rounded-full", bad ? "bg-attention" : "bg-waiting")} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
