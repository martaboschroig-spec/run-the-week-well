import { createFileRoute } from "@tanstack/react-router";
import { OneTapAuth } from "@/components/app/OneTapAuth";

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
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">R</span>
          RunTheWeek
        </div>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Get into your week</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {email ? "Use the email your family added for you." : "Pick a way in — it takes a second."}
        </p>
        <div className="mt-6">
          <OneTapAuth email={email ?? ""} />
        </div>
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        New here? Ask whoever runs your household to add your email in Family — then use that email above.
      </p>
      <p className="mt-3 text-center text-sm">
        <Link to="/pricing" className="font-semibold text-primary">See pricing</Link>
      </p>
    </div>
  );
}
