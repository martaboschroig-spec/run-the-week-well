import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createHousehold } from "@/lib/api.functions";
import { errMsg, useRefresh } from "@/lib/ui";
import { cn } from "@/lib/utils";

const PEOPLE = [
  { id: "Sarah", label: "Sarah", role: "Mom" },
  { id: "Michael", label: "Michael", role: "Dad" },
  { id: "Grandma", label: "Grandma", role: "Caregiver" },
] as const;

export function Onboarding() {
  const [name, setName] = useState("The Parkers");
  const [me, setMe] = useState<(typeof PEOPLE)[number]["id"]>("Sarah");
  const [busy, setBusy] = useState(false);
  const create = useServerFn(createHousehold);
  const refresh = useRefresh();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Let's set up your family</h1>
      <p className="mt-2 text-muted-foreground">We'll start you with an example family — Sarah, Michael, Grandma, Emma, Leo and Sophie. You can rename or remove anyone later.</p>
      <label className="mt-8 text-sm font-semibold">Family name</label>
      <Input className="mt-2 h-12 rounded-xl text-base" value={name} onChange={(e) => setName(e.target.value)} />
      <p className="mt-6 text-sm font-semibold">Which one are you?</p>
      <div className="mt-2 grid gap-2">
        {PEOPLE.map((p) => (
          <button key={p.id} onClick={() => setMe(p.id)} className={cn("flex h-14 items-center justify-between rounded-2xl border bg-card px-4 text-left", me === p.id && "border-primary ring-2 ring-primary/30")}>
            <span className="font-semibold">{p.label}</span><span className="text-muted-foreground">{p.role}</span>
          </button>
        ))}
      </div>
      <Button size="lg" className="mt-8" disabled={busy} onClick={async () => {
        setBusy(true);
        try { await create({ data: { name, me } }); await refresh(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
      }}>Create our family</Button>
      <p className="mt-4 text-center text-sm text-muted-foreground">Invited by family? Ask them to add your email in Family, then sign in again.</p>
    </div>
  );
}
