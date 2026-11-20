import { describe, expect, it } from "vitest";
import { tipFor, weatherAt, type Forecast } from "./weather";

const base = { weather: "sunny", temp: 70, precip: 0, precipType: "none" };
describe("weather tips", () => {
  it("rain asks for a raincoat", () => expect(tipFor({ ...base, weather: "rain", precip: 2, precipType: "rain" }, "us")).toMatch(/raincoat/));
  it("90°F is hot", () => expect(tipFor({ ...base, temp: 90 }, "us")).toMatch(/water/));
  it("40°F is chilly", () => expect(tipFor({ ...base, temp: 40 }, "us")).toMatch(/jacket/));
  it("a mild sunny day needs nothing", () => expect(tipFor(base, "us")).toBeNull());
});
describe("weatherAt", () => {
  const f: Forecast = { place: "x", units: "us", days: [{ day: "2026-11-21", weather: "cloudy", summary: "", min: 50, max: 60, precip: 0, precipType: "none" }],
    hours: [{ at: "2026-11-20T17:00:00", weather: "rain", temp: 55, precip: 1, precipType: "rain" }] };
  it("uses the activity's hour", () => expect(weatherAt(f, "2026-11-20", "17:30")?.weather).toBe("rain"));
  it("falls back to the day", () => expect(weatherAt(f, "2026-11-21", "09:00")?.temp).toBe(60));
  it("nothing beyond the forecast", () => expect(weatherAt(f, "2026-12-30", "09:00")).toBeNull());
});
