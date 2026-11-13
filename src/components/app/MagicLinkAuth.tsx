// Passwordless access: the only way in is a one-time sign-in link sent by email.
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  email?: string;
  hint?: string;
  /** Path the emailed link brings the user back to (defaults to the home page). */
  returnTo?: string;
};

export function MagicLinkAuth({ email = "", hint, returnTo = "" }: Props) {
  const [value, setValue] = useState(email);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  async function sendLink(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: { emailRedirectTo: window.location.origin + returnTo },
      });
      if (error) throw error;
      setSent(`We emailed a sign-in link to ${value}. Open it on this device.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't send the link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      {sent ? (
        <p className="rounded-2xl bg-covered-soft p-4 font-medium">{sent}</p>
      ) : (
        <form onSubmit={sendLink} className="grid gap-3">
          <Input type="email" required placeholder="Email" autoComplete="email" className="h-12 rounded-xl text-base" value={value} onChange={(e) => setValue(e.target.value)} />
          <Button size="lg" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Email me a sign-in link"}
          </Button>
        </form>
      )}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <p className="text-xs leading-relaxed text-muted-foreground">No passwords to remember. The link works once, on the device that asked for it.</p>
    </div>
  );
}
