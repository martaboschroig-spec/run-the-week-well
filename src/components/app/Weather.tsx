import { queryOptions, useQuery } from "@tanstack/react-query";
import { Cloud, CloudRain, CloudSnow, CloudLightning, Sun, CloudSun } from "lucide-react";
import { deg, label, tipFor, weatherAt } from "@/lib/domain/weather";
import { getWeather } from "@/lib/weather.functions";

export const weatherQuery = () => queryOptions({ queryKey: ["weather"], queryFn: () => getWeather(), staleTime: 30 * 60 * 1000 });

function Icon({ w, className }: { w: string; className?: string }) {
  const I = /snow|sleet/.test(w) ? CloudSnow : /storm/.test(w) ? CloudLightning : /rain|shower|drizzle/.test(w) ? CloudRain
    : /partly|mostly_sunny/.test(w) ? CloudSun : /sun|clear/.test(w) ? Sun : Cloud;
  return <I className={className} aria-hidden />;
}

/** Small forecast pill next to a day heading. */
export function DayWeather({ date }: { date: string }) {
  const q = useQuery(weatherQuery());
  const f = q.data?.forecast;
  const d = f?.days.find((x) => x.day === date);
  if (!f || !d) return null;
  return (
    <span title={d.summary || label(d.weather)} className="inline-flex items-center gap-1.5 rounded-full bg-sun-soft px-2.5 py-1 text-xs font-semibold normal-case tracking-normal text-foreground">
      <Icon w={d.weather} className="h-3.5 w-3.5" /> {deg(d.max, f.units)} / {deg(d.min, f.units)}
    </span>
  );
}

/** Weather at an activity's start, with a reminder when it matters. */
export function ActivityWeather({ date, time }: { date: string; time: string }) {
  const q = useQuery(weatherQuery());
  const f = q.data?.forecast;
  if (!f) return null;
  const w = weatherAt(f, date, time);
  if (!w) return null;
  const tip = tipFor(w, f.units);
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-sun-soft px-3 py-2 text-sm">
      <Icon w={w.weather} className="h-4 w-4 shrink-0" />
      <span className="font-semibold">{label(w.weather)} · {deg(w.temp, f.units)}</span>
      {tip && <span className="text-muted-foreground">— {tip}</span>}
    </div>
  );
}
