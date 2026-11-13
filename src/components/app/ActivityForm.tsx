import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteActivity, saveActivity } from "@/lib/api.functions";
import { errMsg, kidChip, localToday, toDate, useRefresh, who } from "@/lib/ui";
import { selectClass, type Data } from "./parts";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ActivityForm({ data, activityId }: { data: Data; activityId?: string }) {
  const a = data.activities.find((x) => x.id === activityId);
  const asg = data.assignments.filter((x) => x.activity_id === activityId);
  const [f, setF] = useState({
    child_id: a?.child_id ?? data.children[0]?.id ?? "",
    name: a?.name ?? "",
    start_date: a?.start_date ?? localToday(),
    start_time: a?.start_time.slice(0, 5) ?? "17:00",
    end_time: a?.end_time.slice(0, 5) ?? "18:00",
    location: a?.location ?? "",
    recurrence: (a?.recurrence ?? "none") as "none" | "weekly",
    weekdays: a?.weekdays ?? [],
    until_date: a?.until_date ?? null as string | null,
    dropoff: asg.find((x) => x.kind === "dropoff")?.member_id ?? null as string | null,
    pickup: asg.find((x) => x.kind === "pickup")?.member_id ?? null as string | null,
  });
  const [items, setItems] = useState(data.items.filter((i) => i.activity_id === activityId).sort((x, y) => x.position - y.position).map((i) => ({ id: i.id as string | undefined, label: i.label, checked: i.checked })));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveActivity);
  const del = useServerFn(deleteActivity);
  const refresh = useRefresh();
  const navigate = useNavigate();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  if (!data.children.length) return <p className="text-muted-foreground">Add a child in Family first.</p>;

  const addItem = () => { const l = draft.trim(); if (l) { setItems((p) => [...p, { id: undefined, label: l, checked: false }]); setDraft(""); } };
  const weekdaysShown = f.weekdays.length ? f.weekdays : [toDate(f.start_date).getDay()];

  async function submit() {
    if (!f.name.trim()) { toast.error("Give the activity a name"); return; }
    if (f.end_time <= f.start_time) { toast.error("End time must be after start time"); return; }
    setBusy(true);
    try {
      const pending = draft.trim() ? [...items, { id: undefined, label: draft.trim(), checked: false }] : items;
      await save({ data: { id: activityId, ...f, weekdays: f.recurrence === "weekly" ? weekdaysShown : [], items: pending } });
      await refresh();
      toast.success(activityId ? "Saved" : "Activity added");
      navigate({ to: "/activities" });
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }

  const Label = ({ children }: { children: string }) => <label className="text-sm font-semibold">{children}</label>;
  const memberSelect = (k: "dropoff" | "pickup") => (
    <select className={selectClass()} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value || null)}>
      <option value="">Not assigned yet</option>
      {data.members.map((m) => <option key={m.id} value={m.id}>{who(m)}{who(m) !== m.name ? ` (${m.name})` : ""}</option>)}
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Who is it for?</Label>
        <div className="flex flex-wrap gap-2">
          {data.children.map((c) => (
            <button key={c.id} onClick={() => set("child_id", c.id)} className={cn("h-11 rounded-full px-5 font-bold", kidChip[c.color], f.child_id === c.id ? "ring-2 ring-foreground/60" : "opacity-60")}>{c.name}</button>
          ))}
        </div>
      </div>
      <div className="space-y-2"><Label>Activity</Label><Input className="h-12 rounded-xl text-base" placeholder="Soccer" value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={80} /></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 space-y-2 sm:col-span-1"><Label>{f.recurrence === "weekly" ? "Starts on" : "Date"}</Label><Input type="date" className="h-12 rounded-xl text-base" value={f.start_date} onChange={(e) => set("start_date", e.target.value)} /></div>
        <div className="space-y-2"><Label>Starts</Label><Input type="time" className="h-12 rounded-xl text-base" value={f.start_time} onChange={(e) => set("start_time", e.target.value)} /></div>
        <div className="space-y-2"><Label>Ends</Label><Input type="time" className="h-12 rounded-xl text-base" value={f.end_time} onChange={(e) => set("end_time", e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label>Where</Label><Input className="h-12 rounded-xl text-base" placeholder="Riverside Field" value={f.location} onChange={(e) => set("location", e.target.value)} maxLength={120} /></div>

      <div className="space-y-3">
        <Label>Repeat</Label>
        <div className="flex gap-2">
          {(["none", "weekly"] as const).map((r) => (
            <button key={r} onClick={() => set("recurrence", r)} className={cn("h-11 rounded-full border px-5 font-semibold", f.recurrence === r && "border-primary bg-accent text-accent-foreground")}>{r === "none" ? "One time" : "Every week"}</button>
          ))}
        </div>
        {f.recurrence === "weekly" && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => {
                const on = weekdaysShown.includes(i);
                return <button key={d} onClick={() => set("weekdays", on ? weekdaysShown.filter((x) => x !== i) : [...weekdaysShown, i].sort())} className={cn("h-11 w-12 rounded-xl border text-sm font-semibold", on && "border-primary bg-primary text-primary-foreground")}>{d}</button>;
              })}
            </div>
            <div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">Until (optional)</span><Input type="date" className="h-11 w-auto rounded-xl" value={f.until_date ?? ""} onChange={(e) => set("until_date", e.target.value || null)} /></div>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Drop-off</Label>{memberSelect("dropoff")}</div>
        <div className="space-y-2"><Label>Pickup</Label>{memberSelect("pickup")}</div>
      </div>

      <div className="space-y-2">
        <Label>What to bring</Label>
        <ul className="space-y-2">
          {items.map((it, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <button aria-label={it.checked ? "Uncheck" : "Check"} onClick={() => setItems((p) => p.map((x, j) => (j === idx ? { ...x, checked: !x.checked } : x)))} className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md border", it.checked && "border-covered bg-covered text-primary-foreground")}>{it.checked && <Check className="h-4 w-4" />}</button>
              <Input className="h-11 rounded-xl" value={it.label} onChange={(e) => setItems((p) => p.map((x, j) => (j === idx ? { ...x, label: e.target.value } : x)))} />
              <button aria-label="Remove item" onClick={() => setItems((p) => p.filter((_, j) => j !== idx))} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input className="h-11 rounded-xl" placeholder="Water bottle" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }} />
          <Button variant="secondary" onClick={addItem}><Plus className="h-4 w-4" /> Add item</Button>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        {activityId ? (
          <Button variant="ghost" className="text-attention" onClick={async () => {
            if (!confirm("Delete this activity? This removes every repeat too.")) return;
            try { await del({ data: { id: activityId } }); await refresh(); toast("Activity deleted"); navigate({ to: "/activities" }); } catch (e) { toast.error(errMsg(e)); }
          }}><Trash2 className="h-4 w-4" /> Delete</Button>
        ) : <span />}
        <Button size="lg" disabled={busy} onClick={submit}>{activityId ? "Save changes" : "Add activity"}</Button>
      </div>
    </div>
  );
}
