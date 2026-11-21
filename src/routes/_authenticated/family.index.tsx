import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Copy, Pencil, Plus } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteChild, deleteMember, saveChild, saveMember } from "@/lib/api.functions";
import { errMsg, KID_COLORS, kidChip, localToday, overviewQuery, useRefresh, who } from "@/lib/ui";
import type { Child, Member } from "@/lib/domain/logic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/family/")({
  head: () => ({
    meta: [
      { title: "Family — RunTheWeek" },
      { name: "description", content: "The grown-ups and kids in your family." },
      { property: "og:title", content: "Family — RunTheWeek" },
      { property: "og:description", content: "Your family members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Family,
});

function Family() {
  const t = localToday();
  const q = useQuery(overviewQuery(t, t));
  const [member, setMember] = useState<Partial<Member> | null>(null);
  const [child, setChild] = useState<Partial<Child> | null>(null);
  const d = q.data;
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Family</h1>
      {d && (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Grown-ups</h2><Button size="sm" variant="secondary" onClick={() => setMember({})}><Plus className="h-4 w-4" /> Add</Button></div>
            <ul className="divide-y rounded-3xl border bg-card shadow-soft">
              {d.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2 p-2 pl-5">
                  <Link to="/family/$memberId" params={{ memberId: m.id }} className="flex min-h-14 flex-1 items-center justify-between gap-3">
                    <div>
                      <div className="font-bold">{m.name} {m.id === d.me.id && <span className="font-normal text-muted-foreground">(you)</span>}</div>
                      <div className="text-sm text-muted-foreground">{m.role_label}{m.user_id ? " · signed up" : m.email ? " · invited" : ""}</div>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-primary">Responsibilities <ChevronRight className="h-4 w-4" /></span>
                  </Link>
                  <button aria-label={`Edit ${m.name}`} onClick={() => setMember(m)} className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-3">
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Kids</h2><Button size="sm" variant="secondary" onClick={() => setChild({ color: KID_COLORS[d.children.length % KID_COLORS.length] ?? "lavender" })}><Plus className="h-4 w-4" /> Add</Button></div>
            <ul className="grid gap-3 sm:grid-cols-3">
              {d.children.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setChild(c)} className={cn("flex w-full items-center justify-between rounded-3xl p-5 text-left", kidChip[c.color])}>
                    <div><div className="text-lg font-bold">{c.name}</div><div className="text-sm opacity-80">{c.age != null ? `${c.age} years old` : ""}</div></div>
                    <Pencil className="h-4 w-4 opacity-70" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {member && <MemberSheet m={member} isMe={member.id === d.me.id} onClose={() => setMember(null)} />}
          {child && <ChildSheet c={child} onClose={() => setChild(null)} />}
        </>
      )}
    </div>
  );
}

function MemberSheet({ m, isMe, onClose }: { m: Partial<Member>; isMe: boolean; onClose: () => void }) {
  const [f, setF] = useState({ name: m.name ?? "", role_label: m.role_label ?? "Caregiver", email: m.email ?? "" });
  const save = useServerFn(saveMember); const del = useServerFn(deleteMember); const refresh = useRefresh();
  return (
    <Drawer open onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md space-y-3 px-4 pb-8">
          <DrawerHeader className="px-0 text-left"><DrawerTitle className="text-xl">{m.id ? `Edit ${m.name}` : "Add a grown-up"}</DrawerTitle></DrawerHeader>
          <Input className="h-12 rounded-xl text-base" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <div className="flex flex-wrap gap-2">
            {["Mom", "Dad", "Grandma", "Grandpa", "Nanny", "Caregiver"].map((r) => (
              <button key={r} onClick={() => setF({ ...f, role_label: r })} className={cn("h-10 rounded-full border px-4 text-sm font-semibold", f.role_label === r && "border-primary bg-accent text-accent-foreground")}>{r}</button>
            ))}
          </div>
          <Input className="h-12 rounded-xl text-base" type="email" placeholder="Email (so they can sign in)" value={f.email} disabled={isMe} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <p className="text-sm text-muted-foreground">When they create an account with this email, they'll see their tasks and requests.</p>
          {m.id && !isMe && !m.user_id && f.email.trim() && <InviteBox name={f.name || "them"} email={f.email.trim()} />}
          <Button size="lg" className="w-full" onClick={async () => {
            try { await save({ data: { id: m.id, name: f.name, role_label: f.role_label, email: f.email.trim() || null } }); await refresh(); onClose(); } catch (e) { toast.error(errMsg(e)); }
          }}>Save</Button>
          {m.id && !isMe && <Button variant="ghost" className="w-full text-attention" onClick={async () => {
            if (!confirm(`Remove ${m.name}? Their drop-offs and pickups become unassigned.`)) return;
            try { await del({ data: { id: m.id! } }); await refresh(); onClose(); } catch (e) { toast.error(errMsg(e)); }
          }}>Remove {who(m as Member)}</Button>}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ChildSheet({ c, onClose }: { c: Partial<Child>; onClose: () => void }) {
  const [f, setF] = useState({ name: c.name ?? "", age: c.age != null ? String(c.age) : "", color: (c.color ?? "lavender") as (typeof KID_COLORS)[number] });
  const save = useServerFn(saveChild); const del = useServerFn(deleteChild); const refresh = useRefresh();
  return (
    <Drawer open onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md space-y-3 px-4 pb-8">
          <DrawerHeader className="px-0 text-left"><DrawerTitle className="text-xl">{c.id ? `Edit ${c.name}` : "Add a child"}</DrawerTitle></DrawerHeader>
          <Input className="h-12 rounded-xl text-base" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input className="h-12 rounded-xl text-base" type="number" min={0} max={25} placeholder="Age" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
          <div className="flex gap-2">
            {KID_COLORS.map((col) => <button key={col} aria-label={col} onClick={() => setF({ ...f, color: col })} className={cn("h-11 w-11 rounded-full", kidChip[col], f.color === col && "ring-2 ring-foreground/60 ring-offset-2")} />)}
          </div>
          <Button size="lg" className="w-full" onClick={async () => {
            try { await save({ data: { id: c.id, name: f.name, age: f.age === "" ? null : Number(f.age), color: f.color } }); await refresh(); onClose(); } catch (e) { toast.error(errMsg(e)); }
          }}>Save</Button>
          {c.id && <Button variant="ghost" className="w-full text-attention" onClick={async () => {
            if (!confirm(`Remove ${c.name}? Their activities will be deleted too.`)) return;
            try { await del({ data: { id: c.id! } }); await refresh(); onClose(); } catch (e) { toast.error(errMsg(e)); }
          }}>Remove {c.name}</Button>}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Invite a grown-up (e.g. Grandma): they open the link, get a sign-in email and land in this family.
function InviteBox({ name, email }: { name: string; email: string }) {
  const link = `${window.location.origin}/auth?email=${encodeURIComponent(email)}`;
  const item = "flex h-12 items-center gap-3 rounded-2xl border bg-card px-4 text-sm font-semibold hover:bg-secondary";
  return (
    <div className="space-y-2 rounded-3xl bg-accent/60 p-4">
      <p className="text-sm font-bold">Invite {name}</p>
      <button type="button" className={item + " w-full"} onClick={async () => {
        try { await navigator.clipboard.writeText(link); toast.success("Invite link copied"); } catch { toast.error(link); }
      }}><Copy className="h-4 w-4 text-muted-foreground" /> Copy invite link</button>
      <p className="text-xs text-muted-foreground">Save first. They join free — no payment needed.</p>
    </div>
  );
}
