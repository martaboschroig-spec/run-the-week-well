import { createFileRoute, Link } from "@tanstack/react-router";
import { CarFront, HandHelping, Backpack, CalendarCheck2, BellRing, Users, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RunTheWeek — your family's week, covered" },
      { name: "description", content: "Who drops off, who picks up and what to bring for every kids' activity. One calm plan for the whole family." },
      { property: "og:title", content: "RunTheWeek — your family's week, covered" },
      { property: "og:description", content: "Who drops off, who picks up, what to bring — all in one calm plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    const { data } = await supabase.auth.getSession();
    return { signedIn: !!data.session };
  },
  component: LandingPage,
});

const FEATURES = [
  { icon: CarFront, title: "Every ride, assigned", text: "Drop-off and pickup have a name next to them — for every activity, every day." },
  { icon: HandHelping, title: "Ask for a swap in one tap", text: "Can't make it? Request a hand-off. Nothing moves until the other person accepts." },
  { icon: Backpack, title: "Nothing forgotten", text: "Cleats, snacks, the karate belt — a checklist per activity, ticked off as you pack." },
  { icon: BellRing, title: "Gaps flag themselves", text: "Missing pickup, a clash between two activities, a request gone quiet — you'll see it before it's a problem." },
];

const STEPS = [
  { n: "1", title: "Add the activities", text: "Soccer on Tuesdays, karate on Thursdays. Set them once, they repeat." },
  { n: "2", title: "Assign the rides", text: "Who drops off, who picks up. Grandma counts too." },
  { n: "3", title: "Relax — or ask for help", text: "Everyone sees the same plan. When life happens, hand a ride over in one tap." },
];

function MockCard() {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tuesday</p>
      <div className="mt-3 grid gap-3">
        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-kid-lavender px-2.5 py-0.5 text-xs font-bold text-kid-lavender-ink">Emma</span>
            <span className="font-bold">Soccer</span>
            <span className="ml-auto text-sm text-muted-foreground">5:00 PM</span>
          </div>
          <div className="mt-3 grid gap-1.5 text-sm">
            <p className="flex items-center gap-2"><Check className="h-4 w-4 text-covered" />Drop-off — <b>Dad</b></p>
            <p className="flex items-center gap-2"><Check className="h-4 w-4 text-covered" />Pickup — <b>Mom</b></p>
          </div>
        </div>
        <div className="rounded-2xl border border-waiting/40 bg-waiting-soft p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-kid-blue px-2.5 py-0.5 text-xs font-bold text-kid-blue-ink">Leo</span>
            <span className="font-bold">Karate</span>
            <span className="ml-auto text-sm text-muted-foreground">5:15 PM</span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-waiting">
            <BellRing className="h-4 w-4" />Pickup needs someone
          </p>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const { signedIn } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Nav */}
      <header className="flex items-center gap-2 py-6">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-extrabold">R</span>
        <span className="text-lg font-extrabold">RunTheWeek</span>
        <nav className="ml-auto flex items-center gap-2">
          {signedIn ? (
            <Button asChild><Link to="/schedule">Open my week</Link></Button>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/pricing">Pricing</Link></Button>
              <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
              <Button asChild><Link to="/signup">Get started</Link></Button>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Your family's week, covered.
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Soccer at 5, karate at 5:15, and someone has to bring the snacks. RunTheWeek turns your kids' activities into one calm plan the whole family can see.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild><Link to="/signup">Start your family plan</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/auth">Sign in</Link></Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Free to start. Made for parents, grandparents and carpools.</p>
        </div>
        <MockCard />
      </section>

      {/* Features */}
      <section className="border-t py-14">
        <h2 className="text-3xl font-extrabold tracking-tight">Less coordinating, more showing up</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-4 rounded-3xl border bg-card p-5 shadow-soft">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold">{f.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t py-14">
        <h2 className="text-3xl font-extrabold tracking-tight">Up and running in minutes</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-3xl border bg-card p-5 shadow-soft">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-extrabold text-primary-foreground">{s.n}</span>
              <p className="mt-3 font-bold">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="my-14 rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground">
        <CalendarCheck2 className="mx-auto h-8 w-8" />
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight">This week can be the calm one</h2>
        <p className="mx-auto mt-2 max-w-md text-primary-foreground/80">
          Set up your family's activities today and see exactly what's covered — and what still needs someone.
        </p>
        <Button size="lg" variant="secondary" className="mt-6" asChild><Link to="/signup">Get started free</Link></Button>
      </section>

      <footer className="flex items-center gap-2 border-t py-6 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        RunTheWeek — made for busy families.
        <Link to="/pricing" className="ml-auto font-semibold text-primary">Pricing</Link>
      </footer>
    </div>
  );
}
