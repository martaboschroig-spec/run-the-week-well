/** Pure weather rules: turn a forecast into what a family needs to know. */
export type Units = "us" | "metric";
export type DayWeather = { day: string; weather: string; summary: string; min: number; max: number; precip: number; precipType: string };
export type HourWeather = { at: string; weather: string; temp: number; precip: number; precipType: string };
export type Forecast = { place: string; units: Units; days: DayWeather[]; hours: HourWeather[] };

export const HOT = { us: 90, metric: 32 } as const;
export const COLD = { us: 40, metric: 4 } as const;

const wet = (w: string, precip: number, type: string) => precip > 0.0 && type !== "none" || /rain|storm|shower|snow|sleet|drizzle/.test(w);
const snowy = (w: string, type: string) => type === "snow" || /snow|sleet/.test(w);

/** A friendly reminder for an activity, or null when the weather needs nothing extra. */
export function tipFor(w: { weather: string; temp: number; precip: number; precipType: string }, units: Units): string | null {
  if (snowy(w.weather, w.precipType)) return "Snow expected — warm boots and extra time on the road";
  if (/storm/.test(w.weather)) return "Storms likely — check if it's still on";
  if (wet(w.weather, w.precip, w.precipType)) return "Rain likely — pack a raincoat";
  if (w.temp >= HOT[units]) return "Hot out — bring water and sunscreen";
  if (w.temp <= COLD[units]) return "Chilly — grab a warm jacket";
  return null;
}

/** Weather at an activity: the matching hour when we have it, otherwise the day's outlook. */
export function weatherAt(f: Forecast, date: string, time: string) {
  const hour = time.slice(0, 2);
  const h = f.hours.find((x) => x.at.slice(0, 10) === date && x.at.slice(11, 13) === hour);
  if (h) return { weather: h.weather, temp: h.temp, precip: h.precip, precipType: h.precipType };
  const d = f.days.find((x) => x.day === date);
  if (!d) return null;
  return { weather: d.weather, temp: d.max, precip: d.precip, precipType: d.precipType };
}

export const deg = (n: number, units: Units) => `${Math.round(n)}°${units === "us" ? "F" : "C"}`;
export const label = (w: string) => w.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
