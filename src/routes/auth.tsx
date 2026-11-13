import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CalendarCheck2, CarFront, HandHelping, Backpack } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "RunTheWeek — your family's week, covered" },
      { name: "description", content: "Who drops off, who picks up and what to bring for every kids' activity. Sign in to see your family's plan." },
      { property: "og:title", content: "RunTheWeek — your family's week, covered" },
      { property: "og:description", content: "Who drops off, who picks up, what to bring — all in one calm plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const FEATURES = [
  { icon: CarFront, title: "Every ride, assigned", text: "Who drops off and who picks up, for every activity." },
  { icon: HandHelping, title: "Ask for a swap", text: "Can't make it? Hand a ride to someone else in one tap." },
  { icon: Backpack, title: "Nothing forgotten", text: "Cleats, snacks, the karate belt — a checklist per activity." },
];

function AuthPage() {
  const [mode, setMode] = useState<"in" | "forgot">("in");
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
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-6 py-10 lg:grid-cols-2 lg:gap-16">
      {/* Brand / pitch side */}
      <div>
        <div className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">R</span>
          RunTheWeek
        </div>
        <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Your family's week,<br />covered.
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          Soccer at 5, karate at 5:15, and someone has to bring the snacks. RunTheWeek turns your kids' activities into one calm plan everyone can see.
        </p>
        <ul className="mt-8 grid gap-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8 hidden items-center gap-2 rounded-2xl bg-covered-soft px-4 py-3 text-sm font-semibold text-covered lg:flex">
          <CalendarCheck2 className="h-4 w-4" />
          Tuesday: Emma's soccer — Dad drops off, Mom picks up. All covered.
        </div>
      </div>

      {/* Sign-in card */}
      <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
        <h2 className="text-2xl font-extrabold tracking-tight">{mode === "in" ? "Welcome back" : "Reset your password"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "in" ? "Sign in to see this week's plan." : "We'll email you a link to choose a new one."}
        </p>
        {sent ? (
          <p className="mt-6 rounded-2xl bg-covered-soft p-4 font-medium">{sent}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 grid gap-3">
            <Input type="email" required placeholder="Email" autoComplete="email" className="h-12 rounded-xl text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
            {mode === "in" && <Input type="password" required minLength={6} placeholder="Password" autoComplete="current-password" className="h-12 rounded-xl text-base" value={password} onChange={(e) => setPassword(e.target.value)} />}
            <Button size="lg" type="submit" disabled={busy}>{mode === "in" ? "Sign in" : "Send reset link"}</Button>
          </form>
        )}
        <div className="mt-6 flex flex-col gap-2 text-sm">
          {mode === "in" ? (
            <button className="text-muted-foreground" onClick={() => { setMode("forgot"); setSent(null); }}>Forgot password?</button>
          ) : (
            <button className="font-semibold text-primary" onClick={() => { setMode("in"); setSent(null); }}>Back to sign in</button>
          )}
        </div>
        <p className="mt-8 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
          New to the family? Ask whoever runs your household to add your email in Family — they'll send you a link to join.
        </p>
      </div>
    </div>
  );
}
