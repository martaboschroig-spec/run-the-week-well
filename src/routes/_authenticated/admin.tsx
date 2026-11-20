import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { listUsers, setRole, type AppRole } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Users & roles — RunTheWeek" },
    { name: "description", content: "Manage who uses RunTheWeek and what they can do." },
    { property: "og:title", content: "Users & roles — RunTheWeek" },
    { property: "og:description", content: "Manage who uses RunTheWeek and what they can do." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminPage,
});

const LABEL: Record<AppRole, string> = { admin: "Admin", support: "Support", user: "User" };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Never");

function AdminPage() {
  const load = useServerFn(listUsers);
  const save = useServerFn(setRole);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => load(), retry: false });
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (q.isLoading) return <p className="text-muted-foreground">Loading users…</p>;
  if (q.error) return <p className="rounded-2xl border bg-card p-6 text-muted-foreground">This page is only for the admin.</p>;
  const { viewer, users } = q.data!;

  const change = async (userId: string, role: "support" | "user") => {
    setBusy(userId); setErr(null);
    try { await save({ data: { userId, role } }); await qc.invalidateQueries({ queryKey: ["admin-users"] }); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight"><ShieldCheck className="h-7 w-7 text-primary" /> Users & roles</h1>
        <p className="mt-1 text-muted-foreground">{users.length} people use RunTheWeek. {viewer === "admin" ? "You can make someone Support or set them back to User." : "You can see everyone, but only the admin changes roles."}</p>
      </div>
      {err && <p className="rounded-xl bg-attention/10 p-3 text-sm text-attention">{err}</p>}
      <ul className="divide-y rounded-2xl border-2 bg-card">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{u.email}</p>
              <p className="text-sm text-muted-foreground">{u.family ? `${u.name} · ${u.family}` : "No family yet"} · joined {fmt(u.createdAt)} · last in {fmt(u.lastSignIn)}</p>
            </div>
            {u.role === "admin" || viewer !== "admin" ? (
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">{LABEL[u.role]}</span>
            ) : (
              <select aria-label={`Role for ${u.email}`} disabled={busy === u.id} value={u.role}
                onChange={(e) => change(u.id, e.target.value as "support" | "user")}
                className="h-10 rounded-full border-2 bg-background px-3 text-sm font-semibold">
                <option value="user">User</option>
                <option value="support">Support</option>
              </select>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
