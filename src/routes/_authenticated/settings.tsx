import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { renameHousehold, saveMember } from "@/lib/api.functions";
import { errMsg, meQuery, useRefresh } from "@/lib/ui";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — RunTheWeek" },
      { name: "description", content: "Your family name, your profile and sign out." },
      { property: "og:title", content: "Settings — RunTheWeek" },
      { property: "og:description", content: "Your RunTheWeek settings." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const me = useQuery(meQuery());
  const [family, setFamily] = useState("");
  const [name, setName] = useState("");
  const rename = useServerFn(renameHousehold);
  const saveM = useServerFn(saveMember);
  const refresh = useRefresh();
  const qc = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => { if (me.data) { setFamily(me.data.household.name); setName(me.data.member.name); } }, [me.data]);
  if (!me.data) return null;
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
      <section className="space-y-2 rounded-3xl border bg-card p-5 shadow-soft">
        <label className="text-sm font-semibold">Family name</label>
        <div className="flex gap-2"><Input className="h-12 rounded-xl text-base" value={family} onChange={(e) => setFamily(e.target.value)} />
          <Button onClick={async () => { try { await rename({ data: { name: family } }); await refresh(); toast.success("Saved"); } catch (e) { toast.error(errMsg(e)); } }}>Save</Button></div>
      </section>
      <section className="space-y-2 rounded-3xl border bg-card p-5 shadow-soft">
        <label className="text-sm font-semibold">Your name</label>
        <div className="flex gap-2"><Input className="h-12 rounded-xl text-base" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={async () => { const m = me.data!.member; try { await saveM({ data: { id: m.id, name, role_label: m.role_label, email: m.email } }); await refresh(); toast.success("Saved"); } catch (e) { toast.error(errMsg(e)); } }}>Save</Button></div>
        <p className="text-sm text-muted-foreground">You're {me.data.member.role_label} · {me.data.member.email}</p>
      </section>
      <Button variant="outline" size="lg" onClick={async () => {
        await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true });
      }}>Sign out</Button>
    </div>
  );
}
