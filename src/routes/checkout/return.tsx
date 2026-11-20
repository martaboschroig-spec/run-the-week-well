import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => (typeof s["session_id"] === "string" ? { session_id: s["session_id"] } : {}),
  head: () => ({
    meta: [
      { title: "You're in — RunTheWeek" },
      { name: "description", content: "Your RunTheWeek Family Trial has started." },
      { property: "og:title", content: "You're in — RunTheWeek" },
      { property: "og:description", content: "Your Family Trial has started." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReturnPage,
});

function ReturnPage() {
  const { session_id } = Route.useSearch();
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md rounded-3xl border-2 border-border bg-card p-8 text-center shadow-soft">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-secondary-foreground"><Check className="h-7 w-7" strokeWidth={3} /></span>
        <h1 className="mt-4 text-2xl font-extrabold">{session_id ? "Your trial has started" : "Nothing to show here"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{session_id ? "7 days of full access. After that, $9.99 every 4 weeks until you cancel." : "Head back to start your trial."}</p>
        <Button asChild className="mt-6 w-full"><Link to="/schedule">Open my week</Link></Button>
      </div>
    </div>
  );
}
