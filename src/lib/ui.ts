import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { getMe, getNotifications, getOverview } from "@/lib/api.functions";
import type { Kind, Member } from "@/lib/domain/logic";

export const pad = (n: number) => String(n).padStart(2, "0");
export const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const toDate = (s: string) => new Date(s + "T00:00:00");
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const shift = (s: string, n: number) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
export const startOfWeek = (s: string) => shift(s, -toDate(s).getDay()); // Sunday-first, US style
export const monthBounds = (s: string) => { const d = toDate(s); return { from: iso(new Date(d.getFullYear(), d.getMonth(), 1)), to: iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }; };

export function time12(t: string) {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}
export function dayLabel(s: string, today = localToday()) {
  if (s === today) return "Today";
  if (s === shift(today, 1)) return "Tomorrow";
  return toDate(s).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
export const shortDay = (s: string) => toDate(s).toLocaleDateString("en-US", { weekday: "long" });
export const kindLabel = (k: Kind) => (k === "dropoff" ? "Drop-off" : "Pickup");
export const verb = (k: Kind) => (k === "dropoff" ? "drop off" : "pick up");

const FRIENDLY = ["mom", "dad", "grandma", "grandpa", "nanny"];
/** "Dad" reads better than "Michael" in family logistics. */
export function who(m: Pick<Member, "name" | "role_label"> | undefined | null) {
  if (!m) return "Someone";
  return FRIENDLY.includes(m.role_label.toLowerCase()) ? m.role_label : m.name;
}

export const KID_COLORS = ["lavender", "blue", "coral", "sage", "butter"] as const;
export const kidChip: Record<string, string> = {
  lavender: "bg-kid-lavender text-kid-lavender-ink",
  blue: "bg-kid-blue text-kid-blue-ink",
  coral: "bg-kid-coral text-kid-coral-ink",
  sage: "bg-kid-sage text-kid-sage-ink",
  butter: "bg-kid-butter text-kid-butter-ink",
};
export const kidDot: Record<string, string> = {
  lavender: "bg-kid-lavender-ink", blue: "bg-kid-blue-ink", coral: "bg-kid-coral-ink", sage: "bg-kid-sage-ink", butter: "bg-kid-butter-ink",
};

export const meQuery = () => queryOptions({ queryKey: ["me"], queryFn: () => getMe() });
export const overviewQuery = (from: string, to: string) =>
  queryOptions({ queryKey: ["overview", from, to], queryFn: () => getOverview({ data: { from, to } }) });
export const notificationsQuery = () => queryOptions({ queryKey: ["notifications"], queryFn: () => getNotifications(), refetchInterval: 20000 });

export function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
