import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Users, HeartHandshake, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — RunTheWeek" },
      { name: "description", content: "Free to start, Family: try 7 days for $1.95, then $9.99 every 4 weeks. One plan for the whole household." },
      { property: "og:title", content: "Pricing — RunTheWeek" },
      { property: "og:description", content: "Free to start. Family covers two adults and all the kids — 7-day trial for $1.95, then $9.99 every 4 weeks." },
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
    id: "free",
    name: "Free",
    price: "$0",
    per: "forever",
    blurb: "See the week, spot what's missing.",
    features: [
      "1 adult",
      "Week view for the family",
      "Needs-attention flags",
      "Ask for a swap once a week",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    id: "family",
    name: "Family",
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
      "Alerts by email, push or text",
    ],
    cta: "Choose Family",
    highlight: true,
  },
  {
    id: "plus",
    name: "Family Plus",
    price: "$149",
    per: "a year",
    blurb: "For the household that runs a lot.",
    features: [
      "Everything in Family",
      "Extra caregivers and carpools",
      "Automations",
      "Import your activities",
      "Heavy use, no limits",
    ],
    cta: "Choose Family Plus",
    highlight: false,
  },
];

function PricingPage() {
  const { signedIn } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-5xl px-6">
      <header className="flex items-center gap-2 py-6">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-extrabold">R</span>
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

      <section className="py-10 text-center sm:py-14">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Pricing that covers the family</h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
          One plan per household, not per person. Start free and only pay when everyone in the family is on it.
        </p>
      </section>

      <section className="grid gap-6 pb-14 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={
              p.highlight
                ? "relative flex flex-col rounded-3xl border-2 border-primary bg-card p-6 shadow-soft"
                : "flex flex-col rounded-3xl border bg-card p-6 shadow-soft"
            }
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                Most families pick this
              </span>
            )}
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{p.name}</p>
            <p className="mt-3 text-4xl font-extrabold tracking-tight">{p.price}</p>
            <p className="text-sm text-muted-foreground">{p.per}</p>
            <p className="mt-3 text-sm font-medium">{p.blurb}</p>
            <ul className="mt-5 grid flex-1 content-start gap-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-covered" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="mt-6 w-full"
              variant={p.highlight ? "default" : "outline"}
              asChild
            >
              <Link to={signedIn ? "/schedule" : "/signup"}>{p.cta}</Link>
            </Button>
          </div>
        ))}
      </section>

      <section className="border-t py-14">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Users className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="font-bold">One bill, whole household</p>
              <p className="mt-1 text-sm text-muted-foreground">Grandma, the sitter, the carpool parent — they join free once the family is on a plan.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HeartHandshake className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="font-bold">Stop when you want</p>
              <p className="mt-1 text-sm text-muted-foreground">Cancel from Settings. Your week stays readable either way.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="font-bold">Nothing to install</p>
              <p className="mt-1 text-sm text-muted-foreground">It runs in the browser on any phone, and you can add it to your home screen.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="my-6 rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground">
        <h2 className="text-3xl font-extrabold tracking-tight">Try it on this week</h2>
        <p className="mx-auto mt-2 max-w-md text-primary-foreground/80">
          Add Tuesday's activities and see who's covering what — free, no card.
        </p>
        <Button size="lg" variant="secondary" className="mt-6" asChild>
          <Link to={signedIn ? "/schedule" : "/signup"}>{signedIn ? "Open my week" : "Get started free"}</Link>
        </Button>
      </section>

      <footer className="flex flex-wrap items-center gap-2 border-t py-6 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        RunTheWeek — made for busy families.
        <span className="ml-auto">Billing opens soon. Everything is free to use until then.</span>
      </footer>
    </div>
  );
}
