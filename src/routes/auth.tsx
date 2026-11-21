import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MagicLinkAuth } from "@/components/app/MagicLinkAuth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { email?: string | undefined } => ({
    email: typeof search["email"] === "string" ? search["email"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — RunTheWeek" },
      { name: "description", content: "One tap in: Google, Apple, or a link in your email." },
      { property: "og:title", content: "Sign in — RunTheWeek" },
      { property: "og:description", content: "One tap in: Google, Apple, or a link in your email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  // Returning users go straight to their week — no pricing, no forms.
  useEffect(() => {
    const go = () => navigate({ to: "/schedule", replace: true });
    supabase.auth.getSession().then(({ data }) => { if (data.session) go(); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (s && e === "SIGNED_IN") go(); });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">R</span>
          RunTheWeek
        </Link>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Get into your week</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {email ? "Use the email your family added for you." : "Enter your email and we'll send you a sign-in link."}
        </p>
        <div className="mt-6">
          <MagicLinkAuth email={email ?? ""} returnTo="/schedule" />
        </div>
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        Invited by your family? Use the email they added for you above.
      </p>
      <p className="mt-3 text-center text-sm">
        New here? <Link to="/signup" className="font-semibold text-primary">Start your family's trial</Link>
      </p>
    </div>
  );
}
