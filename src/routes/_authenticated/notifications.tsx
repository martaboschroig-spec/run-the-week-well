import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { toast } from "sonner";
import { MapPin, Bell, MessageSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cancelChange, markMessagesRead, markNotificationsRead, respondChange } from "@/lib/api.functions";
import { errMsg, kindLabel, localToday, messagesQuery, notificationsQuery, overviewQuery, time12, toDate, useRefresh, verb, who } from "@/lib/ui";
import type { Data } from "@/components/app/parts";
import type { Activity } from "@/lib/domain/logic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — RunTheWeek" },
      { name: "description", content: "Requests for help and answers from your family." },
      { property: "og:title", content: "Notifications — RunTheWeek" },
      { property: "og:description", content: "Requests and answers from your family." },
    ],
  }),
  component: Notifications,
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function when(a: Activity | undefined) {
  if (!a) return "";
  if (a.recurrence === "weekly") return (a.weekdays.length ? a.weekdays : [toDate(a.start_date).getDay()]).map((w) => DAYS[w]).join(", ");
  return toDate(a.start_date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function Notifications() {
  const t = localToday();
  const o = useQuery(overviewQuery(t, t));
  const n = useQuery(notificationsQuery());
  const respond = useServerFn(respondChange);
  const cancel = useServerFn(cancelChange);
  const markRead = useServerFn(markNotificationsRead);
  const msgs = useQuery(messagesQuery());
  const markMsgs = useServerFn(markMessagesRead);
  useEffect(() => { const t = setTimeout(() => markMsgs().then(() => msgs.refetch()).catch(() => {}), 4000); return () => clearTimeout(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const refresh = useRefresh();
  useEffect(() => { markRead().then(() => n.refetch()).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const d = o.data as Data | undefined;
  if (!d || !n.data) return <p className="text-muted-foreground">Loading…</p>;
  const mem = (id: string) => who(d.members.find((m) => m.id === id));
  const act = (id: string) => d.activities.find((a) => a.id === id);
  const kid = (a?: Activity) => d.children.find((c) => c.id === a?.child_id)?.name ?? "your child";
  const asks = n.data.filter((x) => x.type === "request" && x.request?.status === "pending");
  const updates = n.data.filter((x) => x.type !== "request");
  const myPending = d.history;

  const answer = async (id: string, accept: boolean) => {
    try { await respond({ data: { requestId: id, accept } }); await refresh(); toast.success(accept ? "Thanks — it's yours now" : "Got it, we let them know"); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>

      <section className="space-y-3">
        {(msgs.data ?? []).map((m) => {
          const a = act(m.activity_id);
          return (
            <Link key={m.id} to="/activities/$id" params={{ id: m.activity_id }} className={cn("block rounded-3xl border p-5 shadow-soft", m.read_at ? "bg-card" : "bg-waiting-soft")}>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary"><MessageSquare className="h-4 w-4" />{m.read_at ? "Note" : "New note for you"}</div>
              <p className="mt-2 font-bold">{mem(m.author_member_id)} wants you to know — {kid(a)}, {a?.name}</p>
              <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
            </Link>
          );
        })}
        {asks.length === 0 && updates.length === 0 && !(msgs.data ?? []).length && (
          <div className="flex flex-col items-center rounded-3xl border border-dashed p-8 text-center text-muted-foreground"><Bell className="mb-2 h-6 w-6" />No requests right now.</div>
        )}
        {asks.map((x) => {
          const a = act(x.activityId);
          return (
            <article key={x.id} className="rounded-3xl border bg-card p-5 shadow-soft">
              <div className="text-xs font-bold uppercase tracking-wide text-waiting">New request</div>
              <h2 className="mt-2 text-xl font-bold">{mem(x.request.requested_by_member_id)} needs your help.</h2>
              <p className="mt-1 text-lg">Can you {verb(x.kind)} {kid(a)} {x.kind === "dropoff" ? "at" : "from"} {a?.name.toLowerCase()}?</p>
              <p className="mt-3 font-semibold">{when(a)} · {time12((x.kind === "dropoff" ? a?.start_time : a?.end_time) ?? "00:00")}</p>
              {a?.location && <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" />{a.location}</p>}
              {x.request.message && <p className="mt-3 rounded-2xl bg-secondary p-3 italic">"{x.request.message}"</p>}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button size="lg" onClick={() => answer(x.request.id, true)}>Accept</Button>
                <Button size="lg" variant="outline" onClick={() => answer(x.request.id, false)}>Can't do it</Button>
              </div>
            </article>
          );
        })}
        {updates.map((x) => {
          const a = act(x.activityId);
          const to = mem(x.request.to_member_id);
          const accepted = x.type === "accepted";
          return (
            <article key={x.id} className={cn("rounded-3xl border p-5", accepted ? "bg-covered-soft" : "bg-attention-soft")}>
              <p className="font-bold">{accepted ? `${to} will ${verb(x.kind)} ${kid(a)}.` : `${to} can't do this ${kindLabel(x.kind).toLowerCase()}.`}</p>
              <p className="text-muted-foreground">{kid(a)} — {a?.name} · {when(a)}{accepted ? "" : ` · ${mem(x.request.from_member_id)} is still responsible.`}</p>
            </article>
          );
        })}
      </section>

      <Waiting d={d} onCancel={async (id) => { try { await cancel({ data: { requestId: id } }); await refresh(); toast("Request cancelled"); } catch (e) { toast.error(errMsg(e)); } }} />

      {myPending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">History</h2>
          <ul className="divide-y rounded-3xl border bg-card">
            {myPending.map((r) => {
              const a = act(r.activityId);
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="font-semibold">{kid(a)} — {a?.name ?? "Activity"}</div>
                    <div className="text-sm text-muted-foreground">{kindLabel(r.kind)} · {mem(r.from_member_id)} → {mem(r.to_member_id)}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-sm font-bold capitalize", r.status === "accepted" ? "text-covered" : r.status === "declined" ? "text-attention" : "text-muted-foreground")}>{r.status}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.responded_at ?? r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Waiting({ d, onCancel }: { d: Data; onCancel: (id: string) => void }) {
  // Pending requests anywhere in the family, from the raw assignment list (not limited to today's dates)
  const pending = d.pendingRequests;
  if (!pending.length) return null;
  const mem = (id: string) => who(d.members.find((m) => m.id === id));
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Waiting for an answer</h2>
      <ul className="space-y-2">
        {pending.map((r) => {
          const a = d.activities.find((x) => x.id === r.activityId);
          const kid = d.children.find((c) => c.id === a?.child_id)?.name;
          return (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-waiting-soft p-4">
              <div>
                <div className="font-semibold">Waiting for {mem(r.to_member_id)}</div>
                <div className="text-sm text-muted-foreground">{kid} — {a?.name} {kindLabel(r.kind).toLowerCase()} · {mem(r.from_member_id)} is still responsible</div>
              </div>
              {r.requested_by_member_id === d.me.id && <Button size="sm" variant="ghost" onClick={() => onCancel(r.id)}>Cancel</Button>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
