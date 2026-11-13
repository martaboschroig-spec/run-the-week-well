import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — RunTheWeek" },
      { name: "description", content: "Sign in or create your RunTheWeek account." },
      { property: "og:title", content: "Sign in — RunTheWeek" },
      { property: "og:description", content: "Sign in to see your family's week." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/schedule", replace: true });
      } else if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (data.session) navigate({ to: "/schedule", replace: true });
        else setSent("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent("We sent you a link to reset your password.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="flex items-center gap-2 text-lg font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">R</span>RunTheWeek</div>
      <h1 className="mt-8 text-3xl font-extrabold tracking-tight">{mode === "in" ? "Welcome back" : mode === "up" ? "Create your account" : "Reset your password"}</h1>
      {sent ? (
        <p className="mt-6 rounded-2xl bg-covered-soft p-4 font-medium">{sent}</p>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <Input type="email" required placeholder="Email" autoComplete="email" className="h-12 rounded-xl text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode !== "forgot" && <Input type="password" required minLength={6} placeholder="Password" autoComplete={mode === "in" ? "current-password" : "new-password"} className="h-12 rounded-xl text-base" value={password} onChange={(e) => setPassword(e.target.value)} />}
          <Button size="lg" type="submit" disabled={busy}>{mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}</Button>
        </form>
      )}
      <div className="mt-6 flex flex-col gap-2 text-sm">
        {mode !== "in" && <button className="font-semibold text-primary" onClick={() => { setMode("in"); setSent(null); }}>I already have an account</button>}
        {mode !== "up" && <button className="font-semibold text-primary" onClick={() => { setMode("up"); setSent(null); }}>New here? Create an account</button>}
        {mode === "in" && <button className="text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>}
      </div>
    </div>
  );
}
