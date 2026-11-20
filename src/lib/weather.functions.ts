import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Forecast } from "@/lib/domain/weather";
import { fetchForecast, findPlace, nearestPlace, whereOf } from "@/lib/weather.server";

type Ctx = { supabase: any; userId: string };
const HOUR = 60 * 60 * 1000;

async function myHousehold(ctx: Ctx) {
  const id = (await ctx.supabase.rpc("link_me")).data as string | null;
  if (!id) throw new Error("Set up your family first");
  const m = (await ctx.supabase.from("family_members").select("household_id").eq("id", id).single()).data;
  return (await ctx.supabase.from("households").select("id,location_label,place_id,lat,lon,units,weather,weather_at").eq("id", m.household_id).single()).data as any;
}

/** Forecast for the family's town; null when no town is set or the service is unavailable. Cached for an hour. */
export const getWeather = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const ctx = context as Ctx;
  const h = await myHousehold(ctx);
  const location = { label: (h.location_label as string | null) ?? null, units: (h.units === "metric" ? "metric" : "us") as "us" | "metric" };
  const where = whereOf(h);
  if (!where) return { location, forecast: null as Forecast | null, failed: false };
  if (h.weather && h.weather_at && Date.now() - new Date(h.weather_at).getTime() < HOUR) return { location, forecast: h.weather as Forecast, failed: false };
  const key = process.env["METEOSOURCE_API_KEY"]?.trim();
  if (!key) return { location, forecast: (h.weather as Forecast | null) ?? null, failed: true };
  try {
    const f = await fetchForecast(where, h.location_label ?? "", location.units, key);
    await ctx.supabase.from("households").update({ weather: f, weather_at: new Date().toISOString() }).eq("id", h.id);
    return { location, forecast: f, failed: false };
  } catch (e) {
    console.error("weather fetch failed", e);
    return { location, forecast: (h.weather as Forecast | null) ?? null, failed: !h.weather };
  }
});

export const saveLocation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string; units: "us" | "metric" }) => z.object({ text: z.string().trim().max(100), units: z.enum(["us", "metric"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const h = await myHousehold(ctx);
    if (!data.text) {
      await ctx.supabase.from("households").update({ location_label: null, place_id: null, lat: null, lon: null, weather: null, weather_at: null, units: data.units }).eq("id", h.id);
      return { label: null };
    }
    const key = process.env["METEOSOURCE_API_KEY"]?.trim();
    if (!key) throw new Error("The weather service isn't connected yet");
    const p = await findPlace(data.text, key);
    if (!p) throw new Error("We couldn't find that place — try a town name");
    const r = await ctx.supabase.from("households").update({ location_label: p.label, place_id: p.place_id, lat: null, lon: null, units: data.units, weather: null, weather_at: null }).eq("id", h.id);
    if (r.error) throw new Error(r.error.message);
    return { label: p.label };
  });

export const saveCoords = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { lat: number; lon: number; units: "us" | "metric" }) => z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180), units: z.enum(["us", "metric"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const h = await myHousehold(ctx);
    const key = process.env["METEOSOURCE_API_KEY"]?.trim();
    if (!key) throw new Error("The weather service isn't connected yet");
    const label = await nearestPlace(data.lat, data.lon, key);
    const r = await ctx.supabase.from("households").update({ lat: data.lat, lon: data.lon, place_id: null, location_label: label, units: data.units, weather: null, weather_at: null }).eq("id", h.id);
    if (r.error) throw new Error(r.error.message);
    return { label };
  });
