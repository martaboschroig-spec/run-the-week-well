import { StartButton } from "@/components/app/StartButton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { CarFront, HandHelping, Backpack, CalendarCheck2, BellRing, Users, Check, Play, ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const FamilyDemo = lazy(() => import("@/components/app/FamilyDemo"));

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

function MockCard({ playing, onPlay }: { playing: boolean; onPlay: () => void }) {
  return (
    <div id="family-demo" className="min-h-[370px] scroll-mt-6 rounded-3xl border bg-card p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b pb-3">
        <span className="font-extrabold">RunTheWeek</span>
        <span className="text-xs font-semibold text-muted-foreground">Sample week</span>
      </div>
      {playing ? <Suspense fallback={<p className="py-12 text-center text-sm text-muted-foreground" role="status">Opening your sample week…</p>}><FamilyDemo /></Suspense> : <>
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
      <Button variant="outline" className="mt-4 w-full" onClick={onPlay}><Play className="h-4 w-4" />See a pickup swap</Button>
      </>}
    </div>
  );
}

function LandingPage() {
  const { signedIn } = Route.useLoaderData();
  const [playing, setPlaying] = useState(false);
  function playDemo() {
    setPlaying(true);
    document.getElementById("family-demo")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" });
  }
  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Nav */}
      <header className="flex flex-wrap items-center gap-2 py-6">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-extrabold">R</span>
        <span className="text-lg font-extrabold">RunTheWeek</span>
        <nav className="ml-auto flex items-center gap-2">
          {signedIn ? (
            <Button asChild><Link to="/schedule">Open my week</Link></Button>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/pricing">Pricing</Link></Button>
              <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
              <StartButton className="hidden sm:inline-flex">Start your trial</StartButton>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-bold text-accent-foreground">RunTheWeek · the family activity planner</p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            RunTheWeek
          </h1>
          <p className="mt-3 text-2xl font-bold">Who's picking up? Already sorted.</p>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">Every activity, every ride, every thing to bring. One shared week for the people who keep your family moving.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {signedIn ? <Button size="lg" asChild><Link to="/schedule">Open my week <ArrowRight className="h-4 w-4" /></Link></Button> : <StartButton size="lg">Start your 7-day trial <ArrowRight className="h-4 w-4" /></StartButton>}
            <Button variant="outline" size="lg" onClick={playDemo}><Play className="h-4 w-4" />Try a quick demo</Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">No password. Nothing to install.</p>
          <Link to="/pricing" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">See the plan & pricing <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <MockCard playing={playing} onPlay={playDemo} />
      </section>

      <div className="flex flex-wrap gap-x-8 gap-y-3 border-y py-5 text-sm font-semibold">
        <span className="flex items-center gap-2"><Users className="h-4 w-4 text-accent-foreground" />Parents, grandparents & carpools</span>
        <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent-foreground" />Your family's plan stays private</span>
        <span className="flex items-center gap-2"><Check className="h-4 w-4 text-covered" />Swaps only move when accepted</span>
      </div>

      {/* Features */}
      <section className="py-14">
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
            <div key={s.n} className="py-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-extrabold text-primary-foreground">{s.n}</span>
              <p className="mt-3 font-bold">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t py-12">
        <h2 className="text-2xl font-extrabold">A few things you might be wondering</h2>
        <div className="mt-5 divide-y">
          {[
            ["How is this different from a shared calendar?", "A calendar says when. RunTheWeek also says who: drop-off, pickup, what to pack, and which rides still need someone."],
            ["Can Grandma help with pickups?", "Yes. Invite her with a family join link so she can see the plan and take responsibility for a ride."],
            ["Does a swap change the plan straight away?", "No. The original person stays responsible until the person they're asking accepts."],
            ["Do we need to download an app?", "No. RunTheWeek works in your browser, on your phone or computer."],
          ].map(([question, answer]) => <details key={question} className="group py-4"><summary className="cursor-pointer font-bold focus-visible:outline-ring">{question}</summary><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{answer}</p></details>)}
        </div>
      </section>

      {/* Final CTA */}
      <section className="my-8 border-y py-12 text-center">
        <CalendarCheck2 className="mx-auto h-8 w-8" />
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight">This week can be the calm one</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Set up your family's activities today and see exactly what's covered — and what still needs someone.
        </p>
        {signedIn ? <Button size="lg" className="mt-6" asChild><Link to="/schedule">Open my week</Link></Button> : <StartButton size="lg" className="mt-6">Start your 7-day trial</StartButton>}
      </section>

      <footer className="flex items-center gap-2 border-t py-6 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        RunTheWeek — made for busy families.
        <Link to="/pricing" className="ml-auto font-semibold text-primary">Pricing</Link>
      </footer>
    </div>
  );
}
