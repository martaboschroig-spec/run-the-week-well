import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Users, HeartHandshake, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
    cta: "Choose Family",
    highlight: true,
  },
];

function PricingPage() {
  const { signedIn } = Route.useLoaderData();
  return (
    <div className="theme-playful min-h-screen">
    <div className="mx-auto max-w-5xl px-6">
      <header className="flex items-center gap-2 py-6">
        <span className="grid h-9 w-9 shrink-0 place-items-center rotate-[-6deg] rounded-xl bg-primary text-primary-foreground font-extrabold">R</span>
        <span className="text-lg font-extrabold">RunTheWeek</span>
        <nav className="ml-auto flex items-center gap-2">
          {signedIn ? (
            <Button asChild><Link to="/schedule">Open my week</Link></Button>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
              <Button asChild><Link to="/signup">Get started</Link></Button>
            </>
          )}
        </nav>
      </header>

      <section className="relative py-10 text-center sm:py-14">
        <span aria-hidden className="absolute left-4 top-6 h-16 w-16 rounded-full bg-sun-soft sm:left-16" />
        <span aria-hidden className="absolute right-6 top-20 h-10 w-10 rotate-12 rounded-2xl bg-accent sm:right-20" />
        <span className="relative inline-block rounded-full bg-sun px-4 py-1 text-sm font-bold">Try Family for 7 days — $1.95</span>
        <h1 className="relative mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl">Pricing that covers <span className="text-primary">the whole family</span></h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
          One plan per household, not per person. Try Family for 7 days, then pick what fits.
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
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-2 whitespace-nowrap rounded-full bg-sun px-4 py-1 text-xs font-extrabold text-foreground ">
                Most families pick this
              </span>
            )}
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
            <Button
              size="lg"
              className="mt-6 w-full rounded-full font-bold"
              variant={p.highlight ? "default" : "outline"}
              asChild
            >
              <Link to="/signup" search={{ plan: p.id === "plus" ? "plus" : "family" }}>{p.cta}</Link>
            </Button>
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
              <p className="mt-1 text-sm text-muted-foreground">Cancel from Settings. Your week stays readable either way.</p>
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
          Add Tuesday's activities and see who's covering what — 7 days for $1.95.
        </p>
        <Button size="lg" className="mt-6 rounded-full font-bold" asChild>
          <Link to="/signup">{signedIn ? "Open my week" : "Start for $1.95"}</Link>
        </Button>
      </section>

      <footer className="flex flex-wrap items-center gap-2 border-t py-6 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        RunTheWeek — made for busy families.
        <span className="ml-auto">Billing opens soon. Everything is free to use until then.</span>
      </footer>
    </div>
    </div>
  );
}
