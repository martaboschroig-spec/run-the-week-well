import type { Forecast } from "@/lib/domain/weather";
const BASE = "https://www.meteosource.com/api/v1/free";

export async function findPlace(text: string, key: string) {
  const r = await fetch(`${BASE}/find_places?text=${encodeURIComponent(text)}&language=en&key=${key}`);
  if (!r.ok) { console.error("meteosource find_places", r.status, (await r.text()).slice(0, 200)); throw new Error("We couldn't look that place up right now"); }
  const list = (await r.json()) as any[];
  const p = list[0];
  if (!p) return null;
  return { place_id: p.place_id as string, label: [p.name, p.adm_area1 ?? p.country].filter(Boolean).join(", ") };
}

export async function fetchForecast(placeId: string, place: string, units: "us" | "metric", key: string): Promise<Forecast> {
  const r = await fetch(`${BASE}/point?place_id=${encodeURIComponent(placeId)}&sections=daily,hourly&units=${units}&timezone=auto&language=en&key=${key}`);
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
