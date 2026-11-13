import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Clock, MapPin, Repeat, AlertCircle, Pencil } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { acknowledgeDecline, assignSlot, cancelChange, requestChange, toggleItem } from "@/lib/api.functions";
import type { getOverview } from "@/lib/api.functions";
import type { AttentionItem, Occurrence, Slot, Member } from "@/lib/domain/logic";
import { dayLabel, errMsg, kidChip, kindLabel, time12, useRefresh, verb, who, shortDay } from "@/lib/ui";
import { cn } from "@/lib/utils";

export type Data = Awaited<ReturnType<typeof getOverview>>;

export function KidChip({ data, childId, className }: { data: Data; childId: string; className?: string }) {
  const c = data.children.find((x) => x.id === childId);
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-bold", kidChip[c?.color ?? "lavender"], className)}>{c?.name ?? "Child"}</span>;
}

export function selectClass() {
  return "h-12 w-full rounded-xl border border-input bg-card px-3 text-base outline-none focus:ring-2 focus:ring-ring/40";
}

function SlotRow({ data, o, slot }: { data: Data; o: Occurrence; slot: Slot }) {
  const m = data.members.find((x) => x.id === slot.memberId);
  const [assigning, setAssigning] = useState(false);
  const [asking, setAsking] = useState(false);
  const isMine = slot.memberId === data.me.id;
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{kindLabel(slot.kind)} · {time12(slot.kind === "dropoff" ? o.start : o.end)}</div>
        {m ? (
          <div className="font-semibold">{who(m)}{isMine && <span className="font-normal text-muted-foreground"> (you)</span>}</div>
        ) : (
          <button onClick={() => setAssigning(true)} className="flex items-center gap-1 font-semibold text-attention"><AlertCircle className="h-4 w-4" /> Not assigned</button>
        )}
        {slot.pending && <div className="text-sm font-medium text-waiting">Waiting for {who(data.members.find((x) => x.id === slot.pending!.to_member_id))}</div>}
        {slot.declined && <div className="text-sm font-medium text-attention">{who(data.members.find((x) => x.id === slot.declined!.to_member_id))} can't do it</div>}
      </div>
      {isMine && !slot.pending && <Button size="sm" variant="outline" onClick={() => setAsking(true)}>Request change</Button>}
      {!m && <Button size="sm" variant="outline" onClick={() => setAssigning(true)}>Assign</Button>}
      <AssignSheet open={assigning} onOpenChange={setAssigning} data={data} slot={slot} o={o} />
      <RequestChangeSheet open={asking} onOpenChange={setAsking} data={data} slot={slot} o={o} />
    </div>
  );
}

export function OccurrenceCard({ data, o, showDate }: { data: Data; o: Occurrence; showDate?: boolean }) {
  const toggle = useServerFn(toggleItem);
  const refresh = useRefresh();
  return (
    <article className={cn("rounded-3xl border bg-card p-5 shadow-soft", o.status === "attention" && "border-attention/40")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><KidChip data={data} childId={o.childId} />{o.status === "covered" && <span className="flex items-center gap-1 text-sm font-semibold text-covered"><Check className="h-4 w-4" /> Covered</span>}</div>
          <h3 className="mt-3 text-xl font-bold tracking-tight">{o.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{showDate && `${dayLabel(o.date)} · `}{time12(o.start)} – {time12(o.end)}</span>
            {o.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{o.location}</span>}
            {o.recurring && <span className="flex items-center gap-1.5"><Repeat className="h-4 w-4" />Weekly</span>}
          </div>
        </div>
        <Link to="/activities/$id" params={{ id: o.activityId }} aria-label="Edit activity" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><Pencil className="h-4 w-4" /></Link>
      </div>
      <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
        <SlotRow data={data} o={o} slot={o.dropoff} />
        <SlotRow data={data} o={o} slot={o.pickup} />
      </div>
      {o.items.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bring</div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {o.items.map((i) => (
              <li key={i.id}>
                <button
                  onClick={async () => { try { await toggle({ data: { id: i.id, checked: !i.checked } }); await refresh(); } catch (e) { toast.error(errMsg(e)); } }}
                  className={cn("flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium", i.checked && "border-covered/40 bg-covered-soft text-muted-foreground line-through")}
                >
                  <span className={cn("grid h-4 w-4 place-items-center rounded border", i.checked && "border-covered bg-covered text-primary-foreground")}>{i.checked && <Check className="h-3 w-3" />}</span>
                  {i.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function MemberPicker({ members, value, onChange, exclude }: { members: Member[]; value: string | null; onChange: (id: string) => void; exclude?: string | null }) {
  return (
    <div className="grid gap-2">
      {members.filter((m) => m.id !== exclude).map((m) => (
        <button key={m.id} onClick={() => onChange(m.id)} className={cn("flex h-14 items-center justify-between rounded-2xl border bg-card px-4 text-left", value === m.id && "border-primary ring-2 ring-primary/30")}>
          <span className="font-semibold">{who(m)}</span>
          <span className="text-sm text-muted-foreground">{m.name !== who(m) ? m.name : m.role_label}</span>
        </button>
      ))}
    </div>
  );
}

export function AssignSheet({ open, onOpenChange, data, slot, o }: { open: boolean; onOpenChange: (v: boolean) => void; data: Data; slot: Slot; o: Occurrence }) {
  const [pick, setPick] = useState<string | null>(slot.memberId);
  const assign = useServerFn(assignSlot);
  const refresh = useRefresh();
  const child = data.children.find((c) => c.id === o.childId);
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md px-4 pb-8">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="text-xl">Who will {verb(slot.kind)} {child?.name}?</DrawerTitle>
            <DrawerDescription>{o.name} · {shortDay(o.date)} · {time12(slot.kind === "dropoff" ? o.start : o.end)}</DrawerDescription>
          </DrawerHeader>
          <MemberPicker members={data.members} value={pick} onChange={setPick} />
          <Button size="lg" className="mt-6 w-full" disabled={!pick} onClick={async () => {
            try { await assign({ data: { assignmentId: slot.assignmentId, memberId: pick } }); await refresh(); onOpenChange(false); toast.success("Assigned"); } catch (e) { toast.error(errMsg(e)); }
          }}>Assign</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function RequestChangeSheet({ open, onOpenChange, data, slot, o }: { open: boolean; onOpenChange: (v: boolean) => void; data: Data; slot: Slot; o: Occurrence }) {
  const [pick, setPick] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const req = useServerFn(requestChange);
  const refresh = useRefresh();
  const child = data.children.find((c) => c.id === o.childId);
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md px-4 pb-8">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="text-xl">Who should take this instead?</DrawerTitle>
            <DrawerDescription>{child?.name} · {o.name} · {kindLabel(slot.kind)} · {o.recurring ? `every ${shortDay(o.date)}` : shortDay(o.date)} · {time12(slot.kind === "dropoff" ? o.start : o.end)}</DrawerDescription>
          </DrawerHeader>
          <MemberPicker members={data.members} value={pick} onChange={setPick} exclude={slot.memberId} />
          <Textarea className="mt-4 rounded-xl" placeholder="Add a note (optional)" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={300} />
          <p className="mt-3 text-sm text-muted-foreground">You stay responsible until they say yes.</p>
          <Button size="lg" className="mt-4 w-full" disabled={!pick} onClick={async () => {
            try { await req({ data: { assignmentId: slot.assignmentId, toMemberId: pick!, message: msg || undefined } }); await refresh(); onOpenChange(false); toast.success(`Asked ${who(data.members.find((m) => m.id === pick))}`); } catch (e) { toast.error(errMsg(e)); }
          }}>Request change</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function CoveredHero({ title = "Everything's covered", sub = "Everything is taken care of." }: { title?: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-covered-soft px-6 py-10 text-center">
      <div className="animate-pop grid h-16 w-16 place-items-center rounded-full bg-covered text-primary-foreground"><Check className="h-8 w-8" strokeWidth={3} /></div>
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-1 text-muted-foreground">{sub}</p>
    </div>
  );
}

export function AttentionList({ data, items }: { data: Data; items: AttentionItem[] }) {
  const refresh = useRefresh();
  const ack = useServerFn(acknowledgeDecline);
  const cancel = useServerFn(cancelChange);
  const [assignFor, setAssignFor] = useState<AttentionItem | null>(null);
  const act = (id?: string) => data.activities.find((a) => a.id === id);
  const kid = (id: string) => data.children.find((c) => c.id === id)?.name ?? "Your child";
  const mem = (id?: string) => who(data.members.find((m) => m.id === id));
  const occ = assignFor && data.overview.occurrences.find((o) => o.activityId === assignFor.activityId && o.date === assignFor.date);

  return (
    <section className="rounded-3xl border border-attention/30 bg-attention-soft p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-attention">{items.length} {items.length === 1 ? "thing needs" : "things need"} attention</h2>
      <ul className="mt-3 divide-y divide-attention/15">
        {items.map((it) => {
          const a = act(it.activityId);
          const name = a?.name.toLowerCase() ?? "activity";
          let text = "", sub = "", actions: React.ReactNode = null;
          if (it.kind === "missing") {
            text = it.slotKind === "pickup" ? `${kid(it.childId)} still needs someone to pick her up from ${name}.` : `${kid(it.childId)} still needs a ride to ${name}.`;
            text = text.replace(" her ", " them ");
            sub = `${dayLabel(it.date)} · ${time12((it.slotKind === "dropoff" ? a?.start_time : a?.end_time) ?? "00:00")}`;
            actions = <Button size="sm" onClick={() => setAssignFor(it)}>Assign someone</Button>;
          } else if (it.kind === "conflict") {
            const b = act(it.otherActivityId);
            const kidB = data.children.find((c) => c.id === b?.child_id)?.name;
            text = `${mem(it.memberId)} is needed in two places at the same time.`;
            sub = `${dayLabel(it.date)} · ${kid(it.childId)} — ${a?.name} ${time12(a?.start_time ?? "00:00")} · ${kidB} — ${b?.name} ${time12(b?.start_time ?? "00:00")}`;
            actions = <Button size="sm" asChild><Link to="/activities/$id" params={{ id: it.otherActivityId! }}>Resolve</Link></Button>;
          } else if (it.kind === "pending") {
            const r = data.overview.occurrences.flatMap((o) => [o.dropoff, o.pickup]).find((s) => s.pending?.id === it.requestId)?.pending;
            text = `Waiting for ${mem(it.memberId)}`;
            sub = `${kid(it.childId)} — ${a?.name} ${kindLabel(it.slotKind!).toLowerCase()}`;
            actions = (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild><Link to="/notifications">View request</Link></Button>
                {r?.requested_by_member_id === data.me.id && <Button size="sm" variant="ghost" onClick={async () => { try { await cancel({ data: { requestId: it.requestId! } }); await refresh(); toast("Request cancelled"); } catch (e) { toast.error(errMsg(e)); } }}>Cancel</Button>}
              </div>
            );
          } else {
            text = `${mem(it.memberId)} can't do this ${kindLabel(it.slotKind!).toLowerCase()}.`;
            const slot = data.overview.occurrences.find((o) => o.activityId === it.activityId);
            const still = slot ? (it.slotKind === "dropoff" ? slot.dropoff.memberId : slot.pickup.memberId) : null;
            sub = `${kid(it.childId)} — ${a?.name} · ${mem(still ?? undefined)} is still responsible.`;
            actions = <Button size="sm" variant="outline" onClick={async () => { try { await ack({ data: { requestId: it.requestId! } }); await refresh(); } catch (e) { toast.error(errMsg(e)); } }}>Got it</Button>;
          }
          return (
            <li key={it.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold">{text}</p><p className="text-sm text-muted-foreground">{sub}</p></div>
              <div className="shrink-0">{actions}</div>
            </li>
          );
        })}
      </ul>
      {occ && assignFor && (
        <AssignSheet open onOpenChange={(v) => !v && setAssignFor(null)} data={data} o={occ} slot={assignFor.slotKind === "dropoff" ? occ.dropoff : occ.pickup} />
      )}
    </section>
  );
}

export function SegTabs<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-full bg-secondary p-1">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn("h-10 rounded-full px-4 text-sm font-semibold text-muted-foreground", value === o.value && "bg-card text-foreground shadow-soft")}>{o.label}</button>
      ))}
    </div>
  );
}
