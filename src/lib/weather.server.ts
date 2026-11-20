import type { Forecast } from "@/lib/domain/weather";
const BASE = "https://www.meteosource.com/api/v1/free";

export async function findPlace(text: string, key: string) {
  const r = await fetch(`${BASE}/find_places?text=${encodeURIComponent(text)}&language=en&key=${key}`);
  if (!r.ok) { console.error("meteosource find_places", r.status, (await r.text()).slice(0, 200)); throw new Error("We couldn't reach the weather service — try again later"); }
  const list = (await r.json()) as any[];
  const p = list[0];
  if (!p) return null;
  return { place_id: p.place_id as string, label: [p.name, p.adm_area1 ?? p.country].filter(Boolean).join(", ") };
}

const coord = (n: number, pos: string, neg: string) => `${Math.abs(n).toFixed(3)}${n >= 0 ? pos : neg}`;
/** Query fragment for Meteosource: coordinates when we have them, otherwise a place id. */
export const whereOf = (h: { lat: number | null; lon: number | null; place_id: string | null }) =>
  h.lat != null && h.lon != null ? `lat=${coord(Number(h.lat), "N", "S")}&lon=${coord(Number(h.lon), "E", "W")}` : h.place_id ? `place_id=${encodeURIComponent(h.place_id)}` : null;

export async function nearestPlace(lat: number, lon: number, key: string) {
  const r = await fetch(`${BASE}/nearest_place?lat=${coord(lat, "N", "S")}&lon=${coord(lon, "E", "W")}&language=en&key=${key}`);
  if (!r.ok) { console.error("meteosource nearest_place", r.status, (await r.text()).slice(0, 200)); throw new Error("We couldn't reach the weather service — try again later"); }
  const p = (await r.json()) as any;
  return [p.name, p.adm_area1 ?? p.country].filter(Boolean).join(", ") || "Your location";
}

export async function fetchForecast(where: string, place: string, units: "us" | "metric", key: string): Promise<Forecast> {
  const r = await fetch(`${BASE}/point?${where}&sections=daily,hourly&units=${units}&timezone=auto&language=en&key=${key}`);
  if (!r.ok) throw new Error(`Weather service answered ${r.status}`);
  const j = (await r.json()) as any;
  return {
    place, units,
    days: (j.daily?.data ?? []).map((d: any) => ({
      day: d.day, weather: d.weather ?? "", summary: d.summary ?? "",
      min: d.all_day?.temperature_min ?? 0, max: d.all_day?.temperature_max ?? 0,
      precip: d.all_day?.precipitation?.total ?? 0, precipType: d.all_day?.precipitation?.type ?? "none",
    })),
    hours: (j.hourly?.data ?? []).map((h: any) => ({
      at: h.date, weather: h.weather ?? "", temp: h.temperature ?? 0,
      precip: h.precipitation?.total ?? 0, precipType: h.precipitation?.type ?? "none",
    })),
  };
}
