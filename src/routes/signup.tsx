import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { email: string } => ({
    email: typeof search.email === "string" ? search.email : "",
  }),
  head: () => ({
    meta: [
      { title: "Join your family — RunTheWeek" },
      { name: "description", content: "Create your RunTheWeek account and see your family's drop-offs and pickups." },
      { property: "og:title", content: "Join your family — RunTheWeek" },
      { property: "og:description", content: "Create your account to see your tasks and requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { email: prefill } = Route.useSearch();
  const [email, setEmail] = useState(prefill);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      if (data.session) navigate({ to: "/schedule", replace: true });
      else setSent("Check your email to confirm your account, then sign in.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="flex items-center gap-2 text-lg font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">R</span>RunTheWeek</div>
      <h1 className="mt-8 text-3xl font-extrabold tracking-tight">Join your family</h1>
      <p className="mt-2 text-muted-foreground">Use the email your family added for you.</p>
      {sent ? (
        <p className="mt-6 rounded-2xl bg-covered-soft p-4 font-medium">{sent}</p>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <Input type="email" required placeholder="Email" autoComplete="email" className="h-12 rounded-xl text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" required minLength={6} placeholder="Password" autoComplete="new-password" className="h-12 rounded-xl text-base" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button size="lg" type="submit" disabled={busy}>Create account</Button>
        </form>
      )}
      <div className="mt-6 text-sm">
        <Link to="/auth" className="font-semibold text-primary">I already have an account</Link>
      </div>
    </div>
  );
}
