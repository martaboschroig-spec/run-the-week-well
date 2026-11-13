import { localToday, monthBounds, shift, startOfWeek } from "@/lib/ui";
export type RangeKey = "today" | "week" | "month" | "all";
export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "today", label: "Today" }, { value: "week", label: "This Week" }, { value: "month", label: "This Month" }, { value: "all", label: "All" },
];
export function rangeFor(k: RangeKey) {
  const t = localToday();
  if (k === "today") return { from: t, to: t };
  if (k === "week") return { from: t, to: shift(startOfWeek(t), 6) };
  if (k === "month") return { from: t, to: monthBounds(t).to };
  return { from: t, to: shift(t, 120) };
}
