import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RunTheWeek — your family's week, covered" },
      { name: "description", content: "Know who drops off, who picks up and what to bring for every kids' activity. Ask for help and see when everything's covered." },
      { property: "og:title", content: "RunTheWeek — your family's week, covered" },
      { property: "og:description", content: "Who drops off, who picks up, what to bring — all in one calm plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/schedule", replace: true }); });
  }, [navigate]);
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <div className="flex items-center gap-2 text-lg font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">R</span>RunTheWeek</div>
      <h1 className="mt-10 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Who's taking Emma to soccer?</h1>
      <p className="mt-4 text-lg text-muted-foreground">RunTheWeek turns your kids' activities into a clear plan — who drops off, who picks up, what to bring, and what still needs someone.</p>
      <ul className="mt-8 space-y-3">
        {["See your whole week at a glance", "Know exactly what you need to do today", "Ask for help — they tap Accept, done"].map((t) => (
          <li key={t} className="flex items-center gap-3 font-medium"><span className="grid h-6 w-6 place-items-center rounded-full bg-covered-soft text-covered"><Check className="h-4 w-4" /></span>{t}</li>
        ))}
      </ul>
      <div className="mt-10 flex gap-3">
        <Button size="lg" asChild><Link to="/auth">Get started</Link></Button>
        <Button size="lg" variant="outline" asChild><Link to="/auth">Sign in</Link></Button>
      </div>
    </div>
  );
}
