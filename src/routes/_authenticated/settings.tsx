import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellRing, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  registerPushToken,
  renameHousehold,
  saveAlertPrefs,
  saveMember,
} from "@/lib/api.functions";
import { errMsg, meQuery, useRefresh } from "@/lib/ui";
import { disablePush, enablePush, pushIsConfigured } from "@/lib/push";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — RunTheWeek" },
      { name: "description", content: "Your family name, your profile, how we reach you and sign out." },
      { property: "og:title", content: "Settings — RunTheWeek" },
      { property: "og:description", content: "Your RunTheWeek settings." },
    ],
  }),
  component: Settings,
});

const NOTICE: Record<string, string> = {
  "not-configured": "Phone alerts aren't wired up yet — we're still waiting on the alerts service to be connected.",
  unsupported: "This browser can't show alerts on this device.",
  "open-in-new-tab": "Open the app in its own tab (not inside the editor preview) to turn alerts on.",
  denied: "Your browser blocked alerts. Allow them for this site in your browser's site settings, then try again.",
};

function Settings() {
  const me = useQuery(meQuery());
  const [family, setFamily] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(true);
  const [pushOn, setPushOn] = useState(false);
  const [smsOn, setSmsOn] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const rename = useServerFn(renameHousehold);
  const saveM = useServerFn(saveMember);
  const savePrefs = useServerFn(saveAlertPrefs);
  const regTok = useServerFn(registerPushToken);
  const refresh = useRefresh();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!me.data) return;
    const m = me.data.member as any;
    setFamily(me.data.household.name);
    setName(m.name);
    setPhone(m.phone ?? "");
    setEmail(Boolean(m.notify_email));
    setPushOn(Boolean(m.notify_push));
    setSmsOn(Boolean(m.notify_sms));
  }, [me.data]);

  if (!me.data) return null;
  const member = me.data.member as any;

  const saveAlerts = async () => {
    try {
      await savePrefs({ data: { phone: phone.trim() || null, notifyEmail: email, notifyPush: pushOn, notifySms: smsOn } });
      await refresh();
      toast.success("Saved");
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const turnOnPhone = async () => {
    setBusy(true);
    setNotice("");
    try {
      const r = await enablePush();
      if (r.status === "registered") {
        await regTok({ data: { token: r.token } });
        if (!pushOn) {
          setPushOn(true);
          await savePrefs({ data: { phone: phone.trim() || null, notifyEmail: email, notifyPush: true, notifySms: smsOn } });
        }
        setNotice("Alerts are on for this device.");
        toast.success("Phone alerts are on");
      } else {
        setNotice(NOTICE[r.status]);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const turnOffPhone = async () => {
    setBusy(true);
    try {
      await disablePush();
      setNotice("Alerts are off in this browser.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>

      <section className="space-y-2 rounded-3xl border bg-card p-5 shadow-soft">
        <label className="text-sm font-semibold">Family name</label>
        <div className="flex gap-2">
          <Input className="h-12 rounded-xl text-base" value={family} onChange={(e) => setFamily(e.target.value)} />
          <Button onClick={async () => { try { await rename({ data: { name: family } }); await refresh(); toast.success("Saved"); } catch (e) { toast.error(errMsg(e)); } }}>Save</Button>
        </div>
      </section>

      <section className="space-y-2 rounded-3xl border bg-card p-5 shadow-soft">
        <label className="text-sm font-semibold">Your name</label>
        <div className="flex gap-2">
          <Input className="h-12 rounded-xl text-base" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={async () => { try { await saveM({ data: { id: member.id, name, role_label: member.role_label, email: member.email } }); await refresh(); toast.success("Saved"); } catch (e) { toast.error(errMsg(e)); } }}>Save</Button>
        </div>
        <p className="text-sm text-muted-foreground">You're {member.role_label} · {member.email}</p>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">How we reach you</h2>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">Email</p>
            <p className="text-sm text-muted-foreground">Turns on the moment your family's sender address is set up.</p>
          </div>
          <Switch checked={email} onCheckedChange={(v) => setEmail(Boolean(v))} />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">Phone alerts</p>
            <p className="text-sm text-muted-foreground">A banner on your phone, even with the app closed.</p>
          </div>
          <Switch checked={pushOn} onCheckedChange={(v) => setPushOn(Boolean(v))} />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">Text message</p>
            <p className="text-sm text-muted-foreground">Only for the important ones — it costs per message.</p>
          </div>
          <Switch checked={smsOn} onCheckedChange={(v) => setSmsOn(Boolean(v))} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Your phone number</label>
          <Input className="h-12 rounded-xl text-base" inputMode="tel" placeholder="+1 555 012 3456" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={saveAlerts}>Save</Button>
          {pushIsConfigured() && (
            pushOn ? (
              <Button variant="outline" disabled={busy} onClick={turnOffPhone}>Turn off alerts here</Button>
            ) : (
              <Button variant="outline" disabled={busy} onClick={turnOnPhone}>
                <Smartphone className="mr-2 h-4 w-4" /> Turn on phone alerts
              </Button>
            )
          )}
        </div>
        {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
        <p className="text-sm text-muted-foreground">
          Everything still shows up in the app right away — these are the extra ways we reach you.
        </p>
      </section>

      <Button variant="outline" size="lg" onClick={async () => {
        await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true });
      }}>Sign out</Button>
    </div>
  );
}
