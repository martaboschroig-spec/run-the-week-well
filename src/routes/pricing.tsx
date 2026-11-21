import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Users, HeartHandshake, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StartButton } from "@/components/app/StartButton";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — RunTheWeek" },
      { name: "description", content: "Family Trial: try 7 days for $1.95, then $9.99 every 4 weeks. One plan for the whole household." },
      { property: "og:title", content: "Pricing — RunTheWeek" },
      { property: "og:description", content: "Family Trial covers two adults and all the kids — 7-day trial for $1.95, then $9.99 every 4 weeks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    const { data } = await supabase.auth.getSession();
    return { signedIn: !!data.session };
  },
  component: PricingPage,
});

const PLANS = [
  {
    id: "family",
    name: "Family Trial",
    price: "$1.95",
    per: "for your first 7 days, then $9.99 every 4 weeks",
    blurb: "The whole household, running on one plan.",
    features: [
      "2 adults + all your kids",
      "Drop-off and pickup on every activity",
      "Swap requests, accepted before anything moves",
      "Clash and gap warnings",
      "Gear checklists per activity",
      "Notes and documents per activity",
      "Alerts by email and push",
    ],
    cta: "Start your 7-day trial",
    highlight: true,
  },
];

function PricingPage() {
  const { signedIn } = Route.useLoaderData();
  return (
    <div className="theme-playful min-h-screen">
    <div className="mx-auto max-w-5xl px-6">
      <header className="flex flex-wrap items-center gap-2 py-5">
        <Link to="/" className="flex items-center gap-2 font-extrabold sm:text-lg"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">R</span>RunTheWeek</Link>
        <nav className="ml-auto flex items-center gap-2">
          {signedIn ? (
            <Button asChild><Link to="/schedule">Open my week</Link></Button>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
            </>
          )}
        </nav>
      </header>

      <section className="py-8 text-center sm:py-10">
        <h1 className="text-3xl font-extrabold sm:text-4xl">One plan for your family</h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
          One plan per household, not per person. Your activities, rides and packing lists — together.
        </p>
      </section>

      <section className="grid gap-6 pb-14 mx-auto max-w-md">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={
              p.highlight
                ? "relative flex flex-col rounded-[2rem] border-4 border-primary bg-card p-7 shadow-soft "
                : "flex flex-col rounded-[2rem] border-2 border-border bg-card p-7 shadow-soft"
            }
          >
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{p.name}</p>
            <p className={"mt-3 text-5xl font-extrabold tracking-tight " + (p.highlight ? "text-primary" : "")}>{p.price}</p>
            <p className="text-sm text-muted-foreground">{p.per}</p>
            <p className="mt-3 text-sm font-medium">{p.blurb}</p>
            <ul className="mt-5 grid flex-1 content-start gap-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent"><Check className="h-3 w-3 text-accent-foreground" strokeWidth={3} /></span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <StartButton
              size="lg"
              className="mt-6 w-full rounded-full font-bold"
              variant={p.highlight ? "default" : "outline"}
            >
              {p.cta}
            </StartButton>
            <p className="mt-3 text-center text-xs text-muted-foreground">Taxes included. Renews automatically. Cancel any time.</p>
          </div>
        ))}
      </section>

      <section className="border-t py-14">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun-soft"><Users className="h-5 w-5 text-primary" /></span>
            <div>
              <p className="font-bold">One bill, whole household</p>
              <p className="mt-1 text-sm text-muted-foreground">Grandma, the sitter, the carpool parent — they join free once the family is on a plan.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent"><HeartHandshake className="h-5 w-5 text-accent-foreground" /></span>
            <div>
              <p className="font-bold">Stop when you want</p>
              <p className="mt-1 text-sm text-muted-foreground">Your plan renews automatically until you cancel.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun-soft"><Sparkles className="h-5 w-5 text-primary" /></span>
            <div>
              <p className="font-bold">Nothing to install</p>
              <p className="mt-1 text-sm text-muted-foreground">It runs in the browser on any phone, and you can add it to your home screen.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="my-6 rounded-[2.5rem] bg-secondary px-6 py-14 text-center text-secondary-foreground">
        <h2 className="text-3xl font-extrabold tracking-tight">Try it on this week</h2>
        <p className="mx-auto mt-2 max-w-md text-secondary-foreground/90">
          Add Tuesday's activities and see who's covering what.
        </p>
        {signedIn ? <Button size="lg" className="mt-6" asChild><Link to="/schedule">Open my week</Link></Button> : <StartButton size="lg" className="mt-6">Start your 7-day trial</StartButton>}
      </section>

      <footer className="flex flex-wrap items-center gap-2 border-t py-6 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        RunTheWeek — made for busy families.
        <Link to="/" className="ml-auto font-semibold text-primary">Back to RunTheWeek</Link>
      </footer>
    </div>
    </div>
  );
}
