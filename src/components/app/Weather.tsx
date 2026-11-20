import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocateFixed, MapPin, Cloud, CloudRain, CloudSnow, CloudLightning, Sun, CloudSun } from "lucide-react";
import { deg, label, tipFor, weatherAt } from "@/lib/domain/weather";
import { getWeather, saveCoords, saveLocation } from "@/lib/weather.functions";

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

/** Week forecast at the top of the schedule; asks for the device location the first time. */
export function WeatherStrip() {
  const q = useQuery(weatherQuery());
  const qc = useQueryClient();
  const toCoords = useServerFn(saveCoords);
  const toTown = useServerFn(saveLocation);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const [town, setTown] = useState("");
  const [msg, setMsg] = useState("");
  if (!q.data) return null;
  const { forecast: f, location, failed } = q.data;
  const done = async (p: Promise<unknown>) => {
    setBusy(true); setMsg("");
    try { await p; setManual(false); await qc.invalidateQueries({ queryKey: ["weather"] }); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setBusy(false); }
  };
  const locate = () => {
    if (!("geolocation" in navigator)) { setManual(true); setMsg("This browser can't share your location — type your town instead."); return; }
    setBusy(true); setMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => void done(toCoords({ data: { lat: pos.coords.latitude, lon: pos.coords.longitude, units: location.units } })),
      () => { setBusy(false); setManual(true); setMsg("No problem — type your town or ZIP instead."); },
      { timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  };
  const ask = !location.label || manual;
  return (
    <section className="rounded-3xl border bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" /> {location.label ? `Weather · ${location.label}` : "See the weather for your week"}
        </p>
        {location.label && !manual && (
          <button disabled={busy} onClick={locate} className="text-sm font-semibold text-primary hover:underline">{busy ? "Finding you…" : "Update location"}</button>
        )}
      </div>
      {ask && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!manual && <Button disabled={busy} onClick={locate}><LocateFixed className="mr-2 h-4 w-4" />{busy ? "Finding you…" : "Use my location"}</Button>}
          {manual ? (
            <form className="flex flex-1 flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void done(toTown({ data: { text: town, units: location.units } })); }}>
              <Input className="h-11 min-w-0 flex-1 rounded-xl" placeholder="Austin, TX" value={town} onChange={(e) => setTown(e.target.value)} />
              <Button disabled={busy || !town.trim()} type="submit">Save</Button>
            </form>
          ) : <button onClick={() => setManual(true)} className="text-sm font-semibold text-muted-foreground hover:underline">or type your town</button>}
        </div>
      )}
      {msg && <p className="mt-2 text-sm text-muted-foreground">{msg}</p>}
      {!ask && f && f.days.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {f.days.slice(0, 7).map((d) => (
            <div key={d.day} title={d.summary || label(d.weather)} className="flex flex-col items-center gap-1 rounded-2xl bg-sun-soft px-2 py-2 text-center">
              <span className="text-xs font-semibold text-muted-foreground">{new Date(d.day + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}</span>
              <Icon w={d.weather} className="h-5 w-5" />
              <span className="text-sm font-bold">{deg(d.max, f.units)}</span>
              <span className="text-xs text-muted-foreground">{deg(d.min, f.units)}</span>
            </div>
          ))}
        </div>
      )}
      {!ask && !f && failed && <p className="mt-2 text-sm text-muted-foreground">We couldn't reach the weather service — try again later.</p>}
    </section>
  );
}
