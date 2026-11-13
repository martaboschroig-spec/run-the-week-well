import { useState } from "react";
import { MapPin } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tasksFor, type Task } from "@/lib/domain/logic";
import { cancelChange } from "@/lib/api.functions";
import { dayLabel, errMsg, kindLabel, time12, useRefresh, who } from "@/lib/ui";
import { CoveredHero, KidChip, RequestChangeSheet, type Data } from "./parts";
import { cn } from "@/lib/utils";

function TaskRow({ data, t, mine }: { data: Data; t: Task; mine: boolean }) {
  const [open, setOpen] = useState(false);
  const cancel = useServerFn(cancelChange);
  const refresh = useRefresh();
  const pendingTo = t.slot.pending && who(data.members.find((m) => m.id === t.slot.pending!.to_member_id));
  return (
    <li className="flex gap-4 rounded-3xl border bg-card p-4 shadow-soft">
      <div className="w-20 shrink-0 pt-1 text-lg font-bold tabular-nums">{time12(t.time)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <KidChip data={data} childId={t.occurrence.childId} />
          <span className="text-lg font-bold">{t.occurrence.name}</span>
        </div>
        <div className={cn("mt-2 inline-block rounded-full px-3 py-0.5 text-sm font-bold", t.kind === "dropoff" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground")}>{kindLabel(t.kind)}</div>
        {t.occurrence.location && <div className="mt-2 flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" />{t.occurrence.location}</div>}
        {pendingTo && <div className="mt-2 text-sm font-semibold text-waiting">Waiting for {pendingTo} — you're still on it until they accept.</div>}
        {mine && (
          <div className="mt-3">
            {t.slot.pending ? (
              <Button size="sm" variant="ghost" onClick={async () => { try { await cancel({ data: { requestId: t.slot.pending!.id } }); await refresh(); toast("Request cancelled"); } catch (e) { toast.error(errMsg(e)); } }}>Cancel request</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Request change</Button>
            )}
          </div>
        )}
      </div>
      <RequestChangeSheet open={open} onOpenChange={setOpen} data={data} slot={t.slot} o={t.occurrence} />
    </li>
  );
}

export function TaskAgenda({ data, memberId, mine, emptyText }: { data: Data; memberId: string; mine: boolean; emptyText: string }) {
  const tasks = tasksFor(data.overview.occurrences, memberId);
  if (!tasks.length) return <CoveredHero title="Nothing on your plate" sub={emptyText} />;
  const days = [...new Set(tasks.map((t) => t.occurrence.date))];
  return (
    <div className="space-y-8">
      {days.map((d) => (
        <section key={d}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">{dayLabel(d)}</h2>
          <ul className="space-y-3">{tasks.filter((t) => t.occurrence.date === d).map((t) => <TaskRow key={t.occurrence.key + t.kind} data={data} t={t} mine={mine} />)}</ul>
        </section>
      ))}
    </div>
  );
}

export function TaskSummary({ data, memberId }: { data: Data; memberId: string }) {
  const tasks = tasksFor(data.overview.occurrences, memberId);
  const drop = tasks.filter((t) => t.kind === "dropoff").length;
  return (
    <p className="mt-1 text-muted-foreground">
      <span className="font-semibold text-foreground">{tasks.length} {tasks.length === 1 ? "responsibility" : "responsibilities"}</span> · {drop} drop-offs · {tasks.length - drop} pickups
    </p>
  );
}
