// Pure business rules for RunTheWeek. Runs on the server (see src/lib/api.functions.ts).
export type Kind = "dropoff" | "pickup";
export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface Member { id: string; name: string; role_label: string; email: string | null; user_id: string | null }
export interface Child { id: string; name: string; age: number | null; color: string }
export interface Item { id: string; activity_id: string; label: string; checked: boolean; position: number }
export interface Assignment { id: string; activity_id: string; kind: Kind; member_id: string | null; updated_at: string }
export interface Activity {
  id: string; child_id: string; name: string; start_date: string; start_time: string; end_time: string;
  location: string; recurrence: "none" | "weekly"; weekdays: number[]; until_date: string | null;
}
export interface ChangeRequest {
  id: string; assignment_id: string; from_member_id: string; to_member_id: string; requested_by_member_id: string;
  status: RequestStatus; message: string | null; created_at: string; responded_at: string | null; acknowledged_at: string | null;
}
export interface HouseholdData {
  members: Member[]; children: Child[]; activities: Activity[]; items: Item[];
  assignments: Assignment[]; requests: ChangeRequest[];
}

export interface Slot {
  assignmentId: string; kind: Kind; memberId: string | null;
  pending: ChangeRequest | null; declined: ChangeRequest | null;
}
export interface Occurrence {
  key: string; date: string; activityId: string; childId: string; name: string;
  start: string; end: string; location: string; recurring: boolean;
  dropoff: Slot; pickup: Slot; items: Item[];
  status: "covered" | "waiting" | "attention";
}
export type AttentionKind = "missing" | "conflict" | "pending" | "declined";
export interface AttentionItem {
  id: string; kind: AttentionKind; date: string; activityId: string; childId: string;
  slotKind?: Kind; memberId?: string; requestId?: string; otherActivityId?: string;
  occurrences?: string[];
}

// ---------- dates (all YYYY-MM-DD, treated as calendar days) ----------
export function parseDate(d: string): Date { return new Date(d + "T00:00:00Z"); }
export function fmtDate(d: Date): string { return d.toISOString().slice(0, 10); }
export function addDays(d: string, n: number): string { const x = parseDate(d); x.setUTCDate(x.getUTCDate() + n); return fmtDate(x); }
export function weekday(d: string): number { return parseDate(d).getUTCDay(); }
export function toMinutes(t: string): number { const [h = 0, m = 0] = t.split(":").map(Number); return h * 60 + m; }

/** All calendar dates in [from, to] on which the activity happens. */
export function occurrenceDates(a: Activity, from: string, to: string): string[] {
  if (a.recurrence === "none") return a.start_date >= from && a.start_date <= to ? [a.start_date] : [];
  const days = a.weekdays.length ? a.weekdays : [weekday(a.start_date)];
  const start = a.start_date > from ? a.start_date : from;
  const end = a.until_date && a.until_date < to ? a.until_date : to;
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) if (days.includes(weekday(d))) out.push(d);
  return out;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

function latest(reqs: ChangeRequest[]): ChangeRequest | null {
  return reqs.reduce<ChangeRequest | null>((acc, r) => (!acc || r.created_at > acc.created_at ? r : acc), null);
}

/** A declined request still needs attention until someone acknowledges it or the slot changes. */
export function openDecline(reqs: ChangeRequest[], a: Assignment): ChangeRequest | null {
  const last = latest(reqs);
  if (!last || last.status !== "declined" || last.acknowledged_at) return null;
  if (last.responded_at && a.updated_at > last.responded_at) return null;
  return last;
}

function buildSlot(a: Assignment | undefined, reqsByAssignment: Map<string, ChangeRequest[]>, activityId: string, kind: Kind): Slot {
  if (!a) return { assignmentId: `${activityId}:${kind}`, kind, memberId: null, pending: null, declined: null };
  const reqs = reqsByAssignment.get(a.id) ?? [];
  return {
    assignmentId: a.id, kind, memberId: a.member_id,
    pending: reqs.find((r) => r.status === "pending") ?? null,
    declined: openDecline(reqs, a),
  };
}

export function expand(data: HouseholdData, from: string, to: string): Occurrence[] {
  const reqsByAssignment = new Map<string, ChangeRequest[]>();
  for (const r of data.requests) reqsByAssignment.set(r.assignment_id, [...(reqsByAssignment.get(r.assignment_id) ?? []), r]);
  const out: Occurrence[] = [];
  for (const a of data.activities) {
    const dates = occurrenceDates(a, from, to);
    if (!dates.length) continue;
    const asg = data.assignments.filter((x) => x.activity_id === a.id);
    const dropoff = buildSlot(asg.find((x) => x.kind === "dropoff"), reqsByAssignment, a.id, "dropoff");
    const pickup = buildSlot(asg.find((x) => x.kind === "pickup"), reqsByAssignment, a.id, "pickup");
    const items = data.items.filter((i) => i.activity_id === a.id).sort((x, y) => x.position - y.position);
    for (const date of dates) {
      out.push({
        key: `${a.id}@${date}`, date, activityId: a.id, childId: a.child_id, name: a.name,
        start: a.start_time.slice(0, 5), end: a.end_time.slice(0, 5), location: a.location,
        recurring: a.recurrence === "weekly", dropoff, pickup, items, status: "covered",
      });
    }
  }
  out.sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start));
  return out;
}

/** Same person assigned to two different activities whose times overlap on the same day. */
export function findConflicts(occ: Occurrence[]): { memberId: string; a: Occurrence; b: Occurrence }[] {
  const res: { memberId: string; a: Occurrence; b: Occurrence }[] = [];
  const byDate = new Map<string, Occurrence[]>();
  for (const o of occ) byDate.set(o.date, [...(byDate.get(o.date) ?? []), o]);
  for (const list of byDate.values()) {
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i]!, b = list[j]!;
      if (a.activityId === b.activityId || !overlaps(a.start, a.end, b.start, b.end)) continue;
      const am = new Set([a.dropoff.memberId, a.pickup.memberId].filter(Boolean) as string[]);
      const shared = new Set([b.dropoff.memberId, b.pickup.memberId].filter((m): m is string => !!m && am.has(m)));
      for (const m of shared) res.push({ memberId: m, a, b });
    }
  }
  return res;
}

export interface Overview { occurrences: Occurrence[]; attention: AttentionItem[]; stats: { total: number; covered: number; attention: number; waiting: number } }

/** Builds occurrences with status and a de-duplicated "needs attention" list for a date range. */
export function buildOverview(data: HouseholdData, from: string, to: string): Overview {
  const occ = expand(data, from, to);
  const conflicts = findConflicts(occ);
  const conflictKeys = new Set(conflicts.flatMap((c) => [c.a.key, c.b.key]));
  const attention = new Map<string, AttentionItem>();
  const add = (id: string, item: Omit<AttentionItem, "id">) => { if (!attention.has(id)) attention.set(id, { id, ...item }); };

  for (const o of occ) {
    let bad = conflictKeys.has(o.key);
    let waiting = false;
    for (const s of [o.dropoff, o.pickup]) {
      if (!s.memberId) { bad = true; add(`missing:${o.activityId}:${s.kind}`, { kind: "missing", date: o.date, activityId: o.activityId, childId: o.childId, slotKind: s.kind }); }
      if (s.declined) { bad = true; add(`declined:${s.declined.id}`, { kind: "declined", date: o.date, activityId: o.activityId, childId: o.childId, slotKind: s.kind, requestId: s.declined.id, memberId: s.declined.to_member_id }); }
      if (s.pending) { waiting = true; add(`pending:${s.pending.id}`, { kind: "pending", date: o.date, activityId: o.activityId, childId: o.childId, slotKind: s.kind, requestId: s.pending.id, memberId: s.pending.to_member_id }); }
    }
    o.status = bad ? "attention" : waiting ? "waiting" : "covered";
  }
  for (const c of conflicts) {
    const pair = [c.a.activityId, c.b.activityId].sort().join("|");
    add(`conflict:${c.memberId}:${pair}`, { kind: "conflict", date: c.a.date, activityId: c.a.activityId, otherActivityId: c.b.activityId, childId: c.a.childId, memberId: c.memberId, occurrences: [c.a.key, c.b.key] });
  }
  const order: AttentionKind[] = ["conflict", "missing", "declined", "pending"];
  const list = [...attention.values()].sort((x, y) => order.indexOf(x.kind) - order.indexOf(y.kind) || x.date.localeCompare(y.date));
  return {
    occurrences: occ,
    attention: list,
    stats: {
      total: occ.length,
      covered: occ.filter((o) => o.status === "covered").length,
      attention: occ.filter((o) => o.status === "attention").length,
      waiting: occ.filter((o) => o.status === "waiting").length,
    },
  };
}

export interface Task { occurrence: Occurrence; kind: Kind; time: string; slot: Slot }
/** Responsibilities of one member: drop-off happens at start time, pickup at end time. */
export function tasksFor(occ: Occurrence[], memberId: string): Task[] {
  const out: Task[] = [];
  for (const o of occ) {
    if (o.dropoff.memberId === memberId) out.push({ occurrence: o, kind: "dropoff", time: o.start, slot: o.dropoff });
    if (o.pickup.memberId === memberId) out.push({ occurrence: o, kind: "pickup", time: o.end, slot: o.pickup });
  }
  return out.sort((a, b) => (a.occurrence.date + a.time).localeCompare(b.occurrence.date + b.time));
}
