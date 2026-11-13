// One-tap access: no passwords anywhere. Google, Apple, or a link by email.

import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GoogleMark = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
  </svg>
);

export function OneTapAuth({ email = "", hint }: { email?: string; hint?: string }) {
  const [value, setValue] = useState(email);
  const [busy, setBusy] = useState<"google" | "apple" | "link" | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const navigate = useNavigate();

  async function social(provider: "google" | "apple") {
    setBusy(provider);
    try {
      const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (r.error) {
        toast.error(r.error.message || "That sign-in didn't go through");
        setBusy(null);
        return;
      }
      if (r.redirected) return; // the browser is on its way to the provider
      navigate({ to: "/schedule", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setBusy(null);
    }
  }

  async function magicLink(e: FormEvent) {
    e.preventDefault();
    setBusy("link");
    setSent(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: value, options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      setSent(`We emailed a sign-in link to ${value}. Open it on this device.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        size="lg"
        disabled={busy !== null}
        onClick={() => social("google")}
        className="h-12 w-full justify-center gap-[10px] rounded-xl px-3 font-medium"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #747775", color: "#1F1F1F" }}
      >
        <GoogleMark />
        Continue with Google
      </Button>

      <Button
        type="button"
        size="lg"
        disabled={busy !== null}
        onClick={() => social("apple")}
        className="h-12 w-full justify-center rounded-xl px-3 font-medium"
        style={{ backgroundColor: "#000000", border: "1px solid #000000", color: "#FFFFFF" }}
      >
        Continue with Apple
      </Button>

      <div className="my-1 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      {sent ? (
        <p className="rounded-2xl bg-covered-soft p-4 font-medium">{sent}</p>
      ) : (
        <form onSubmit={magicLink} className="grid gap-3">
          <Input
            type="email"
            required
            placeholder="Email"
            autoComplete="email"
            className="h-12 rounded-xl text-base"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button size="lg" type="submit" disabled={busy !== null}>
            {busy === "link" ? "Sending…" : "Email me a sign-in link"}
          </Button>
        </form>
      )}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <p className="text-xs leading-relaxed text-muted-foreground">
        No passwords to remember. The link works once, on the device that asked for it.
      </p>
    </div>
  );
}
