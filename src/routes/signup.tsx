import { createFileRoute, Link } from "@tanstack/react-router";
import { OneTapAuth } from "@/components/app/OneTapAuth";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { email?: string | undefined } => ({
    email: typeof search["email"] === "string" ? search["email"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Get started — RunTheWeek" },
      { name: "description", content: "Start RunTheWeek in one tap: Google, Apple, or a link in your email." },
      { property: "og:title", content: "Get started — RunTheWeek" },
      { property: "og:description", content: "Start in one tap and see your family's drop-offs and pickups in one calm plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { email } = Route.useSearch();
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <div className="rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">R</span>
          RunTheWeek
        </div>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Start your family's week</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {email
            ? "Use the email your family added for you."
            : "Free to start — you'll set up your family in the next step."}
        </p>
        <div className="mt-6">
          <OneTapAuth email={email ?? ""} />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        <Link to="/auth" className="font-semibold text-primary">I already have an account</Link>
        <span className="text-muted-foreground">·</span>
        <Link to="/pricing" className="font-semibold text-primary">See pricing</Link>
      </div>
    </div>
  );
}
