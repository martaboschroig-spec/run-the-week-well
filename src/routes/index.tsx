import { StartButton } from "@/components/app/StartButton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { CarFront, Backpack, CalendarDays, Check, Play, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

const ACTIVITIES = [
  { day: "Tuesday", time: "5:00 PM", child: "Emma", activity: "Soccer practice", place: "Riverside field", dropoff: "Dad", pickup: "Mom", bring: "Cleats, water bottle", color: "bg-kid-lavender text-kid-lavender-ink" },
  { day: "Wednesday", time: "4:30 PM", child: "Leo", activity: "Swimming", place: "Community pool", dropoff: "Mom", pickup: "Grandma", bring: "Swimsuit, towel", color: "bg-kid-blue text-kid-blue-ink" },
  { day: "Thursday", time: "3:00 PM", child: "Emma", activity: "Parent–teacher meeting", place: "Oakwood school", dropoff: "Mom", pickup: "Dad", bring: "Questions for the teacher", color: "bg-kid-coral text-kid-coral-ink" },
];

function LandingPage() {
  const { signedIn } = Route.useLoaderData();
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-5">
        <Link to="/" className="flex items-center gap-2 font-extrabold sm:text-lg">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">R</span>RunTheWeek
        </Link>
        <nav className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Button variant="ghost" asChild><Link to="/pricing">Pricing</Link></Button>
          <Button variant="ghost" asChild><Link to={signedIn ? "/schedule" : "/auth"}>{signedIn ? "My week" : "Sign in"}</Link></Button>
        </nav>
      </header>

      <section className="mx-auto max-w-2xl pb-9 pt-8 text-center sm:pb-12 sm:pt-12">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">RunTheWeek</h1>
        <p className="mt-4 text-2xl font-bold sm:text-3xl">Less juggling. More family time.</p>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">Keep your kids' activities, pickups and things to bring in one shared plan. Everyone knows what's happening — and who's helping.</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          {signedIn ? <Button size="lg" asChild><Link to="/schedule">Open my week<ArrowRight className="h-4 w-4" /></Link></Button> : <StartButton size="lg">Start your 7-day trial<ArrowRight className="h-4 w-4" /></StartButton>}
          <Button variant="ghost" onClick={() => setDemoOpen(true)}><Play className="h-4 w-4" />See how it works</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Works on your phone. Nothing to download.</p>
      </section>

      <section className="pb-10" aria-label="Example family week">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-bold"><CalendarDays className="h-5 w-5 text-accent-foreground" />A little look at your week</p>
          <span className="text-xs text-muted-foreground">Example family</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {ACTIVITIES.map(a => <article key={a.day} className="rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
            <div className="flex justify-between gap-2 text-xs font-semibold text-muted-foreground"><span>{a.day}</span><span>{a.time}</span></div>
            <span className={"mt-4 inline-block rounded-full px-2.5 py-1 text-xs font-bold " + a.color}>{a.child}</span>
            <h2 className="mt-2 text-lg font-extrabold">{a.activity}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{a.place}</p>
            <div className="mt-4 grid gap-2 border-t pt-3 text-sm">
              <p className="flex justify-between gap-3"><span className="text-muted-foreground">Drop-off</span><b>{a.dropoff}</b></p>
              <p className="flex justify-between gap-3"><span className="text-muted-foreground">Pickup</span><b>{a.pickup}</b></p>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><Backpack className="h-4 w-4 shrink-0" />{a.bring}</p>
          </article>)}
        </div>
      </section>

      <section className="border-y py-10 sm:py-12">
        <h2 className="text-2xl font-extrabold">A plan that takes care of the little things</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            { icon: CalendarDays, title: "The same week for everyone", text: "Add an activity once. Your family can see the time, the place and the plan." },
            { icon: CarFront, title: "Help when plans change", text: "Ask someone to take a ride. They accept, and the whole family sees the update." },
            { icon: Check, title: "Fewer last-minute surprises", text: "Spot missing pickups and clashing activities before it's time to leave." },
          ].map(item => <div key={item.title}><item.icon className="mb-3 h-6 w-6 text-accent-foreground" /><h3 className="font-bold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-2xl py-10">
        <h2 className="text-2xl font-extrabold">Good to know</h2>
        <div className="mt-4 divide-y">
          {[
            ["Can grandparents join too?", "Yes. Invite grandparents or other grown-ups with a family join link so they can see the plan and help with rides."],
            ["What happens when someone can't make pickup?", "They can ask another grown-up to help. The original person stays responsible until the other person accepts."],
            ["Do I need to install anything?", "No. Open RunTheWeek in your phone or computer browser."],
          ].map(([q, a]) => <details key={q} className="py-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p></details>)}
        </div>
      </section>

      <section className="border-t py-10 text-center">
        <h2 className="text-2xl font-extrabold">Make room for an easier week.</h2>
        {signedIn ? <Button className="mt-5" size="lg" asChild><Link to="/schedule">Open my week</Link></Button> : <StartButton className="mt-5" size="lg">Start your 7-day trial<ArrowRight className="h-4 w-4" /></StartButton>}
        <p className="mt-3 text-sm"><Link to="/pricing" className="font-semibold text-primary">See plan & pricing</Link></p>
      </section>
      <footer className="flex flex-wrap justify-between gap-3 border-t py-5 text-xs text-muted-foreground"><span>RunTheWeek · made for busy families</span><Link to={signedIn ? "/schedule" : "/auth"}>{signedIn ? "Open my week" : "Already a member? Sign in"}</Link></footer>

      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader><DialogTitle>Meet your family's week</DialogTitle><DialogDescription>A quick look at RunTheWeek.</DialogDescription></DialogHeader>
          {demoOpen && <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground" role="status">Loading example…</p>}><FamilyDemo /></Suspense>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
