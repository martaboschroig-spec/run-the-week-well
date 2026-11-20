import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Lock, CreditCard, ShieldCheck, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AccountAuth } from "@/components/app/AccountAuth";
import { PhoneMock } from "@/components/app/PhoneMock";
import { TrialCheckout } from "@/components/app/TrialCheckout";
import { PaymentTestModeBanner } from "@/components/app/PaymentTestModeBanner";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { email?: string | undefined; plan?: "family" | "plus" | undefined; step?: 2 | undefined } => ({
    email: typeof search["email"] === "string" ? search["email"] : undefined,
    step: Number(search["step"]) === 2 ? 2 : undefined,
    plan: search["plan"] === "plus" ? "plus" : search["plan"] === "family" ? "family" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Get started — RunTheWeek" },
      { name: "description", content: "Start RunTheWeek in one tap: Google, Apple, or a link in your email." },
      { property: "og:title", content: "Get started — RunTheWeek" },
      { property: "og:description", content: "Start in one tap and see your family's drop-offs and pickups in one calm plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignUpPage,
});

function Step({ n, title, done, active, children }: { n: number; title: string; done?: boolean; active?: boolean; children?: ReactNode }) {
  return (
    <section className={"rounded-3xl border-2 bg-card p-5 shadow-soft sm:p-6 " + (active ? "border-primary" : "border-border")}>
      <div className="flex items-center gap-3">
        <span className={"grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold " + (done ? "bg-secondary text-secondary-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
          {done ? <Check className="h-4 w-4" strokeWidth={3} /> : n}
        </span>
        <h2 className={"text-lg font-extrabold tracking-tight " + (!done && !active ? "text-muted-foreground" : "")}>{title}</h2>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

function SignUpPage() {
  const { email, plan = "family" } = Route.useSearch();
  const navigate = useNavigate({ from: "/signup" });
  useEffect(() => {
    localStorage.setItem("rtw-chosen-plan", plan);
  }, [plan]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      // Already part of a family: skip checkout and open the week directly.
      const { data: fam } = await supabase.from("family_members").select("id").eq("user_id", data.session.user.id).limit(1);
      if (fam && fam.length > 0) { navigate({ to: "/schedule", replace: true }); return; }
      setUserEmail(data.session.user.email ?? "your account");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (s) setUserEmail(s.user.email ?? "your account"); });
    // The email link may open in another tab: re-check when this tab regains focus.
    const recheck = () => supabase.auth.getSession().then(({ data }) => { if (data.session) setUserEmail(data.session.user.email ?? "your account"); });
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => { sub.subscription.unsubscribe(); window.removeEventListener("focus", recheck); document.removeEventListener("visibilitychange", recheck); };
  }, []);
  const signedIn = userEmail !== null;
  const included = ["Shared family schedule", "Swaps that never get lost", "Notes & documents", "Alerts by email and push"];
  return (
    <div className="min-h-screen">
      <PaymentTestModeBanner />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 shrink-0 rotate-[-6deg] place-items-center rounded-xl bg-primary text-primary-foreground">R</span>
          RunTheWeek
        </Link>
        <Link to="/auth" className="text-sm font-semibold text-primary">I already have an account</Link>
      </header>
      <div className="bg-accent py-2.5 text-center text-sm font-semibold">
        <ShieldCheck className="mr-1.5 inline h-4 w-4 text-secondary" />
        Your family's data stays private — only your household can see it
      </div>
      <h1 className="mt-10 px-6 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Start your family's week</h1>
      <p className="mt-2 px-6 text-center text-muted-foreground">Three quick steps: your account, your plan, your payment.</p>
      <div className="mx-auto mt-8 grid max-w-6xl items-start gap-8 px-6 pb-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
        <div className="grid gap-5">
          <Step n={1} title={signedIn ? "Account ready" : "Create your account"} done={signedIn} active={!signedIn}>
            {signedIn ? (
              <p className="text-sm text-muted-foreground">Signed in as <span className="font-semibold text-foreground">{userEmail}</span></p>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">One tap, no passwords.</p>
                <AccountAuth email={email} returnTo="/signup" />
              </>
            )}
          </Step>
          <Step n={2} title="Your plan" done={signedIn} active={false}>
            <div className="flex items-center gap-4 rounded-2xl border-2 border-primary bg-accent/40 p-4">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-[6px] border-primary bg-card" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">Family Trial</p>
                <p className="text-sm text-muted-foreground">$1.95 for 7 days, then $9.99 every 4 weeks · cancel any time</p>
              </div>
              <span className="text-2xl font-extrabold tracking-tight">$1.95</span>
            </div>
          </Step>
          <Step n={3} title="Payment" active={signedIn}>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Secure payment <span className="h-px flex-1 bg-border" />
            </div>
            {signedIn ? (
              <TrialCheckout />
            ) : (
              <p className="rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">Your card form opens here as soon as your account is ready.</p>
            )}
          </Step>
          <Link to="/schedule" className="block text-center text-sm font-semibold text-primary">Skip for now and open my week</Link>
        </div>
        <aside className="grid gap-5 md:sticky md:top-6">
          <div className="rounded-3xl border-2 border-border bg-card p-5 shadow-soft sm:p-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 rotate-[-6deg] place-items-center rounded-2xl bg-primary text-2xl font-extrabold text-primary-foreground">R</span>
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-covered-soft px-2 py-0.5 text-[11px] font-bold uppercase text-covered"><Check className="h-3 w-3" strokeWidth={3} /> 7-day trial</span>
                <p className="mt-1 text-lg font-extrabold">Family Trial</p>
                <p className="text-sm text-muted-foreground">2 adults + all your kids</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 border-t pt-4 text-sm">
              <div className="flex justify-between"><span>Every 4 weeks</span><span>$9.99</span></div>
              <div className="flex justify-between text-covered"><span>Trial price <span className="ml-1 rounded-full bg-covered-soft px-2 py-0.5 text-[11px] font-bold">First 7 days</span></span><span>−$8.04</span></div>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t pt-4">
              <span className="text-xl font-extrabold">Due today</span>
              <span><span className="mr-2 text-muted-foreground line-through">$9.99</span><span className="text-4xl font-extrabold tracking-tight">$1.95</span></span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Then $9.99 every 4 weeks until you cancel.</p>
            <ul className="mt-5 grid gap-2.5 border-t pt-4 text-sm font-semibold sm:grid-cols-2">
              {included.map((x) => (
                <li key={x} className="flex items-start gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"><Check className="h-3 w-3" strokeWidth={3} /></span>{x}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Secure checkout</span>
            <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> Cards & wallets</span>
            <span className="flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Cancel any time</span>
          </div>
        </aside>
      </div>
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-soft">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-secondary">What you get</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">A peek at Friday</h2>
              <p className="mt-2 max-w-md text-muted-foreground">Who drops off, who picks up, what to bring — and the one pickup that still needs someone, flagged before it's a problem.</p>
            </div>
            <div className="mx-auto w-full max-w-[300px]">
          <PhoneMock className="-rotate-1">
            <div className="flex h-[470px] flex-col">
              <div className="flex items-center justify-between pb-2 pt-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Friday</p>
                  <p className="text-sm font-extrabold tracking-tight">Your week</p>
                </div>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground">1</span>
              </div>
              <p className="mb-2 rounded-full bg-attention-soft px-2.5 py-1 text-[10px] font-bold text-attention">1 pickup still needs someone</p>
              <ul className="grid gap-1.5">
                {[
                  { kid: "Emma", what: "Soccer 5:00", who: "Mom drops off · Dad picks up", tone: "bg-kid-coral text-kid-coral-ink", state: "Covered", stateTone: "bg-covered-soft text-covered" },
                  { kid: "Leo", what: "Karate 5:15", who: "Grandma drops off · pickup?", tone: "bg-kid-blue text-kid-blue-ink", state: "Needs someone", stateTone: "bg-attention-soft text-attention" },
                  { kid: "Sophie", what: "Doctor 7:00", who: "Dad asked Mom to swap", tone: "bg-kid-sage text-kid-sage-ink", state: "Waiting", stateTone: "bg-waiting-soft text-waiting" },
                ].map((r) => (
                  <li key={r.kid} className="rounded-2xl bg-muted p-2">
                    <div className="flex items-center gap-2">
                      <span className={"grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold " + r.tone}>{r.kid[0]}</span>
                      <p className="min-w-0 flex-1 truncate text-xs font-bold leading-tight">{r.kid} · {r.what}</p>
                      <span className={"shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold " + r.stateTone}>{r.state}</span>
                    </div>
                    <p className="mt-1 pl-9 text-[10px] leading-tight text-muted-foreground">{r.who}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-2 rounded-2xl border border-dashed border-border p-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Bring for Doctor</p>
                <p className="mt-0.5 text-[10px] font-semibold">Analysis forms · water bottle · insurance card</p>
              </div>
              <div className="mt-2 flex items-start gap-2 rounded-2xl bg-accent p-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[9px] font-extrabold text-primary-foreground">D</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold leading-tight">New note from Dad</p>
                  <p className="truncate text-[10px] leading-tight text-muted-foreground">Teacher meeting moved to Thursday 4pm</p>
                </div>
              </div>
              <div className="mt-2 rounded-2xl bg-muted/70 p-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Next up</p>
                <p className="mt-0.5 text-[10px] font-semibold">Sat · Swim 9:00 · Dad drops off</p>
              </div>
              <div className="flex-1" />
              <div aria-hidden="true" className="flex items-center justify-around rounded-2xl bg-muted px-2 py-1.5 text-[10px] font-bold">
                <span className="text-primary">Schedule</span>
                <span className="text-muted-foreground">Tasks</span>
                <span className="text-muted-foreground">Family</span>
              </div>
            </div>
          </PhoneMock>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto mb-12 flex w-fit items-center gap-3 rounded-full border-2 border-border bg-card px-5 py-2.5 shadow-soft">
        <div className="flex -space-x-2">
          {["bg-kid-coral text-kid-coral-ink", "bg-kid-blue text-kid-blue-ink", "bg-kid-sage text-kid-sage-ink"].map((c, i) => (
            <span key={c} className={"grid h-8 w-8 place-items-center rounded-full border-2 border-card text-xs font-extrabold " + c}>{"MJA"[i]}</span>
          ))}
        </div>
        <p className="text-sm"><span className="font-bold">Families</span> plan their week here every day</p>
      </div>
    </div>
  );
}
