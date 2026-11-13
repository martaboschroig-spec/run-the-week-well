import { describe, it, expect } from "vitest";
import { buildOverview, occurrenceDates, tasksFor, type HouseholdData, type Activity } from "./logic";

const act = (p: Partial<Activity>): Activity => ({
  id: "a1", child_id: "emma", name: "Soccer", start_date: "2026-11-10", start_time: "17:00:00", end_time: "18:30:00",
  location: "Riverside Field", recurrence: "none", weekdays: [], until_date: null, ...p,
});
const base = (activities: Activity[], asg: [string, "dropoff" | "pickup", string | null][], requests: HouseholdData["requests"] = []): HouseholdData => ({
  members: [], children: [], items: [], activities, requests,
  assignments: asg.map(([activity_id, kind, member_id]) => ({ id: `${activity_id}-${kind}`, activity_id, kind, member_id, updated_at: "2026-11-01T00:00:00Z" })),
});

describe("recurrence", () => {
  it("weekly Tuesday soccer happens every Tuesday in November", () => {
    const d = occurrenceDates(act({ recurrence: "weekly", weekdays: [2], start_date: "2026-11-03" }), "2026-11-01", "2026-11-30");
    expect(d).toEqual(["2026-11-03", "2026-11-10", "2026-11-17", "2026-11-24"]);
  });
  it("stops at the end date", () => {
    expect(occurrenceDates(act({ recurrence: "weekly", weekdays: [2], start_date: "2026-11-03", until_date: "2026-11-12" }), "2026-11-01", "2026-11-30")).toHaveLength(2);
  });
});

describe("needs attention", () => {
  it("missing pickup is flagged", () => {
    const o = buildOverview(base([act({})], [["a1", "dropoff", "dad"], ["a1", "pickup", null]]), "2026-11-09", "2026-11-15");
    expect(o.attention.map((a) => a.kind)).toEqual(["missing"]);
    expect(o.stats.attention).toBe(1);
  });
  it("Dad in soccer 5-6 and karate 5:15-6:15 is a conflict", () => {
    const o = buildOverview(base(
      [act({ end_time: "18:00:00" }), act({ id: "a2", child_id: "leo", name: "Karate", start_time: "17:15:00", end_time: "18:15:00" })],
      [["a1", "dropoff", "dad"], ["a1", "pickup", "mom"], ["a2", "dropoff", "dad"], ["a2", "pickup", "grandma"]],
    ), "2026-11-10", "2026-11-10");
    expect(o.attention).toHaveLength(1);
    expect(o.attention[0]).toMatchObject({ kind: "conflict", memberId: "dad" });
  });
  it("back-to-back activities are not a conflict", () => {
    const o = buildOverview(base(
      [act({ end_time: "18:00:00" }), act({ id: "a2", start_time: "18:00:00", end_time: "19:00:00" })],
      [["a1", "dropoff", "dad"], ["a1", "pickup", "mom"], ["a2", "dropoff", "dad"], ["a2", "pickup", "mom"]],
    ), "2026-11-10", "2026-11-10");
    expect(o.attention).toHaveLength(0);
  });
  it("pending request keeps the original person and shows waiting", () => {
    const req = { id: "r1", assignment_id: "a1-pickup", from_member_id: "mom", to_member_id: "grandma", requested_by_member_id: "mom", status: "pending" as const, message: null, created_at: "2026-11-02T00:00:00Z", responded_at: null, acknowledged_at: null };
    const o = buildOverview(base([act({})], [["a1", "dropoff", "dad"], ["a1", "pickup", "mom"]], [req]), "2026-11-10", "2026-11-10");
    expect(o.occurrences[0].pickup.memberId).toBe("mom");
    expect(o.occurrences[0].status).toBe("waiting");
    expect(tasksFor(o.occurrences, "mom")).toHaveLength(1);
    expect(tasksFor(o.occurrences, "grandma")).toHaveLength(0);
  });
  it("declined request needs attention until acknowledged", () => {
    const req = { id: "r1", assignment_id: "a1-pickup", from_member_id: "mom", to_member_id: "grandma", requested_by_member_id: "mom", status: "declined" as const, message: null, created_at: "2026-11-02T00:00:00Z", responded_at: "2026-11-03T00:00:00Z", acknowledged_at: null };
    const d = base([act({})], [["a1", "dropoff", "dad"], ["a1", "pickup", "mom"]], [req]);
    expect(buildOverview(d, "2026-11-10", "2026-11-10").attention[0].kind).toBe("declined");
    d.requests[0].acknowledged_at = "2026-11-04T00:00:00Z";
    expect(buildOverview(d, "2026-11-10", "2026-11-10").attention).toHaveLength(0);
  });
  it("everything assigned with no clashes is covered", () => {
    const o = buildOverview(base([act({})], [["a1", "dropoff", "dad"], ["a1", "pickup", "mom"]]), "2026-11-10", "2026-11-10");
    expect(o.stats).toEqual({ total: 1, covered: 1, attention: 0, waiting: 0 });
  });
});
