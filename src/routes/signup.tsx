import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Lock, CreditCard, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SignupModal } from "@/components/app/SignupModal";
import { TrialCheckout } from "@/components/app/TrialCheckout";
import { getStripeEnvironment } from "@/lib/stripe";
import { PaymentTestModeBanner } from "@/components/app/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";

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

function SignUpPage() {
  const { email, plan = "family" } = Route.useSearch();
  const navigate = useNavigate({ from: "/signup" });
  useEffect(() => {
    localStorage.setItem("rtw-chosen-plan", plan);
  }, [plan]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setModal(true); return; }
      // Already paying (trial or active plan): skip checkout and open the week directly.
      const { data: subs } = await supabase.from("subscriptions").select("id").eq("user_id", data.session.user.id)
        .eq("environment", getStripeEnvironment()).in("status", ["trialing", "active", "past_due"]).limit(1);
      if (subs && subs.length > 0) { navigate({ to: "/schedule", replace: true }); return; }
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
  useEffect(() => { if (signedIn) setModal(false); }, [signedIn]);
  const included = ["Shared family schedule", "Swaps that never get lost", "Notes & documents", "Alerts by email and push"];
  return (
    <div className="min-h-screen">
      <PaymentTestModeBanner />
      <SignupModal open={modal} onOpenChange={setModal} email={email} returnTo="/signup" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 shrink-0 rotate-[-6deg] place-items-center rounded-xl bg-primary text-primary-foreground">R</span>
          RunTheWeek
        </Link>
        {signedIn ? <span className="max-w-[50%] break-all text-right text-xs text-muted-foreground">{userEmail}</span> : <Link to="/auth" className="text-sm font-semibold text-primary">Sign in</Link>}
      </header>
      <p className="mt-5 px-6 text-center text-xs font-semibold text-muted-foreground">{signedIn ? "Account ready" : "Create account"} <span aria-hidden="true">→</span> Payment <span aria-hidden="true">→</span> Your family's week</p>
      <h1 className="mt-10 px-6 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Start your family's week</h1>
      <div className="mx-auto mt-8 grid max-w-6xl items-start gap-8 px-6 pb-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
        <div className="grid gap-5">
          <section className="rounded-3xl border-2 border-border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-extrabold tracking-tight">Payment details</h2>
            <div className="mb-3 mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Secure payment <span className="h-px flex-1 bg-border" />
            </div>
            {signedIn ? (
              <TrialCheckout />
            ) : (
              <Button type="button" variant="outline" onClick={() => setModal(true)} className="w-full">Continue with your account</Button>
            )}
          </section>
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
            <ul className="mt-5 grid gap-2.5 border-t pt-4 text-sm font-semibold sm:grid-cols-2">
              {included.map((x) => (
                <li key={x} className="flex items-start gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"><Check className="h-3 w-3" strokeWidth={3} /></span>{x}</li>
              ))}
            </ul>
            <p className="mt-5 border-t pt-4 text-xs leading-relaxed text-muted-foreground">After your 7-day trial, your plan renews automatically every 4 weeks until you cancel. Taxes included. Cancel any time.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Secure checkout</span>
            <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> Cards & wallets</span>
            <span className="flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Cancel any time</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
