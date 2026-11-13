import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Check } from "lucide-react";
import { OneTapAuth } from "@/components/app/OneTapAuth";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { email?: string | undefined; plan?: "family" | "plus" | undefined } => ({
    email: typeof search["email"] === "string" ? search["email"] : undefined,
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

const PLANS = [
  { id: "family" as const, name: "Family Trial", price: "$1.95", per: "first 7 days, then $9.99 every 4 weeks", perks: ["2 adults + all your kids", "Swaps, alerts, notes and documents"] },
];

function SignUpPage() {
  const { email, plan = "family" } = Route.useSearch();
  const navigate = useNavigate({ from: "/signup" });
  useEffect(() => {
    localStorage.setItem("rtw-chosen-plan", plan);
  }, [plan]);
  return (
    <div className="mx-auto grid min-h-screen max-w-4xl items-center gap-8 px-6 py-10 md:grid-cols-2">
      <div className="md:order-2">
        <div className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 shrink-0 rotate-[-6deg] place-items-center rounded-xl bg-primary text-primary-foreground">R</span>
          RunTheWeek
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Your plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">One plan for the whole household. Cancel any time.</p>
        <div className="mt-5 grid gap-3" role="radiogroup" aria-label="Plan">
          {PLANS.map((p) => {
            const on = plan === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => navigate({ search: (s) => ({ ...s, plan: p.id }), replace: true })}
                className={"rounded-3xl border-2 bg-card p-5 text-left shadow-soft transition " + (on ? "border-primary" : "border-border hover:border-primary/50")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{p.name}</p>
                    <p className="mt-1 text-3xl font-extrabold tracking-tight">{p.price}</p>
                    <p className="text-sm text-muted-foreground">{p.per}</p>
                  </div>
                  <span className={"grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 " + (on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                </div>
                <ul className="mt-3 grid gap-1 text-sm">
                  {p.perks.map((x) => <li key={x}>· {x}</li>)}
                </ul>
              </button>
            );
          })}
        </div>
        <div className="mt-4 rounded-3xl border-2 border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">What you get — a peek at Friday</p>
          <PhoneMock className="mt-4 -rotate-1">
            <div className="flex items-center justify-between pb-2 pt-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Friday</p>
                <p className="text-sm font-extrabold tracking-tight">Your week</p>
              </div>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground">1</span>
            </div>
            <ul className="grid gap-1.5">
              {[
                { kid: "Emma", what: "Soccer · 5:00 PM", who: "Mom drops · Dad picks up", tone: "bg-kid-coral text-kid-coral-ink", state: "Covered", stateTone: "bg-covered-soft text-covered" },
                { kid: "Leo", what: "Karate · 5:15 PM", who: "Grandma drops · pickup?", tone: "bg-kid-blue text-kid-blue-ink", state: "Needs someone", stateTone: "bg-attention-soft text-attention" },
                { kid: "Sophie", what: "Doctor · 7:00 PM", who: "Dad asked Mom to swap", tone: "bg-kid-sage text-kid-sage-ink", state: "Waiting", stateTone: "bg-waiting-soft text-waiting" },
              ].map((r) => (
                <li key={r.kid} className="flex items-center gap-2 rounded-2xl bg-muted p-2">
                  <span className={"grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold " + r.tone}>{r.kid[0]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold leading-tight">{r.kid} — {r.what}</p>
                    <p className="truncate text-[10px] leading-tight text-muted-foreground">{r.who}</p>
                  </div>
                  <span className={"shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold " + r.stateTone}>{r.state}</span>
                </li>
              ))}
            </ul>
            <div aria-hidden="true" className="mt-2 flex items-center justify-around rounded-2xl bg-muted px-2 py-1.5 text-[10px] font-bold">
              <span className="text-primary">Schedule</span>
              <span className="text-muted-foreground">Tasks</span>
              <span className="text-muted-foreground">Family</span>
            </div>
          </PhoneMock>
          <p className="mt-3 text-xs text-muted-foreground">Plus gear checklists, notes and documents, and alerts by email, push or text.</p>
        </div>
        <Link to="/pricing" className="mt-3 inline-block text-sm font-semibold text-primary">See everything included</Link>
      </div>

      <div>
        <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight">Create your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {email ? "Use the email your family added for you." : "You'll set up your family in the next step."}
          </p>
          <div className="mt-6">
            <OneTapAuth email={email ?? ""} />
          </div>
        </div>
        <p className="mt-4 text-center text-sm">
          <Link to="/auth" className="font-semibold text-primary">I already have an account</Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">Billing opens soon — nothing is charged today.</p>
      </div>
    </div>
  );
}
