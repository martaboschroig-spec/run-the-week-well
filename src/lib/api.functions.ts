import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildOverview, type HouseholdData, type Activity, type Assignment, type ChangeRequest } from "@/lib/domain/logic";
import { alertForRequest, alertForNote } from "@/lib/notify";

type Ctx = { supabase: any; userId: string };
const ok = <T,>(r: { data: T; error: { message: string } | null }): T => { if (r.error) throw new Error(r.error.message); return r.data; };

async function meOf(ctx: Ctx) {
  const memberId = ok(await ctx.supabase.rpc("link_me")) as string | null;
  if (!memberId) return null;
  const member = ok(await ctx.supabase.from("family_members").select("*").eq("id", memberId).single()) as any;
  const household = ok(await ctx.supabase.from("households").select("*").eq("id", member.household_id).single()) as any;
  return { member, household };
}
async function requireMe(ctx: Ctx) { const me = await meOf(ctx); if (!me) throw new Error("Set up your family first"); return me; }

async function loadData(ctx: Ctx, householdId: string): Promise<HouseholdData> {
  const sb = ctx.supabase;
  const [members, children] = await Promise.all([
    sb.from("family_members").select("id,name,role_label,email,user_id").eq("household_id", householdId).order("created_at"),
    sb.from("children").select("id,name,age,color").eq("household_id", householdId).order("created_at"),
  ]);
  const childIds = (ok(children) as any[]).map((c) => c.id);
  const activities = childIds.length ? (ok(await sb.from("activities").select("*").in("child_id", childIds).order("start_time")) as Activity[]) : [];
  const ids = activities.map((a) => a.id);
  const [items, assignments] = ids.length
    ? await Promise.all([sb.from("activity_items").select("*").in("activity_id", ids), sb.from("activity_assignments").select("*").in("activity_id", ids)])
    : [{ data: [], error: null }, { data: [], error: null }];
  const asg = ok(assignments) as Assignment[];
  const requests = asg.length ? (ok(await sb.from("reassignment_requests").select("*").in("assignment_id", asg.map((a) => a.id)).order("created_at", { ascending: false })) as ChangeRequest[]) : [];
  return { members: ok(members) as any, children: ok(children) as any, activities, items: ok(items) as any, assignments: asg, requests };
}

export const getMe = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => meOf(context as Ctx));

export const createHousehold = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; me: string }) => z.object({ name: z.string().max(80), me: z.enum(["Sarah", "Michael", "Grandma"]) }).parse(d))
  .handler(async ({ data, context }) => { ok(await (context as Ctx).supabase.rpc("create_household", { _name: data.name, _me: data.me })); return true; });

const range = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

/** Everything a screen needs: family, activities and the computed schedule for a date range. */
export const getOverview = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string }) => range.parse(d))
  .handler(async ({ data, context }) => {
    const me = await requireMe(context as Ctx);
    const hd = await loadData(context as Ctx, me.household.id);
    const overview = buildOverview(hd, data.from, data.to);
    const withKind = (r: ChangeRequest) => { const a = hd.assignments.find((x) => x.id === r.assignment_id)!; return { ...r, kind: a.kind, activityId: a.activity_id }; };
    const pendingRequests = hd.requests.filter((r) => r.status === "pending").map(withKind);
    const history = hd.requests.filter((r) => r.status !== "pending").slice(0, 30).map((r) => {
      const a = hd.assignments.find((x) => x.id === r.assignment_id)!;
      return { ...r, kind: a.kind, activityId: a.activity_id };
    });
    return { me: me.member, household: me.household, members: hd.members, children: hd.children, activities: hd.activities, items: hd.items, assignments: hd.assignments, overview, history, pendingRequests };
  });

const activityInput = z.object({
  id: z.string().uuid().optional(),
  child_id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}/),
  end_time: z.string().regex(/^\d{2}:\d{2}/),
  location: z.string().trim().max(120),
  recurrence: z.enum(["none", "weekly"]),
  weekdays: z.array(z.number().int().min(0).max(6)),
  until_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  dropoff: z.string().uuid().nullable(),
  pickup: z.string().uuid().nullable(),
  items: z.array(z.object({ id: z.string().uuid().optional(), label: z.string().trim().min(1).max(80), checked: z.boolean() })).max(40),
}).refine((a) => a.end_time > a.start_time, { message: "End time must be after start time" });

export const saveActivity = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof activityInput>) => activityInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as Ctx).supabase;
    const { id, dropoff, pickup, items, ...fields } = data;
    if (fields.recurrence === "weekly" && fields.weekdays.length === 0) fields.weekdays = [new Date(fields.start_date + "T00:00:00Z").getUTCDay()];
    if (fields.recurrence === "none") { fields.weekdays = []; fields.until_date = null; }
    const row = id
      ? (ok(await sb.from("activities").update(fields).eq("id", id).select("id").single()) as any)
      : (ok(await sb.from("activities").insert(fields).select("id").single()) as any);
    const aid = row.id as string;
    for (const [kind, member_id] of [["dropoff", dropoff], ["pickup", pickup]] as const) {
      const cur = ok(await sb.from("activity_assignments").select("id,member_id").eq("activity_id", aid).eq("kind", kind).maybeSingle()) as any;
      if (!cur) ok(await sb.from("activity_assignments").insert({ activity_id: aid, kind, member_id }));
      else if (cur.member_id !== member_id) ok(await sb.from("activity_assignments").update({ member_id }).eq("id", cur.id));
    }
    const existing = ok(await sb.from("activity_items").select("id").eq("activity_id", aid)) as { id: string }[];
    const keep = new Set(items.filter((i) => i.id).map((i) => i.id));
    const remove = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);
    if (remove.length) ok(await sb.from("activity_items").delete().in("id", remove));
    for (const [position, it] of items.entries()) {
      if (it.id) ok(await sb.from("activity_items").update({ label: it.label, checked: it.checked, position }).eq("id", it.id).eq("activity_id", aid));
      else ok(await sb.from("activity_items").insert({ activity_id: aid, label: it.label, checked: it.checked, position }));
    }
    return { id: aid };
  });

const idInput = z.object({ id: z.string().uuid() });
export const deleteActivity = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => idInput.parse(d))
  .handler(async ({ data, context }) => { ok(await (context as Ctx).supabase.from("activities").delete().eq("id", data.id)); return true; });

export const toggleItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; checked: boolean }) => z.object({ id: z.string().uuid(), checked: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => { ok(await (context as Ctx).supabase.from("activity_items").update({ checked: data.checked }).eq("id", data.id)); return true; });

export const assignSlot = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { assignmentId: string; memberId: string | null }) => z.object({ assignmentId: z.string().uuid(), memberId: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data, context }) => { ok(await (context as Ctx).supabase.from("activity_assignments").update({ member_id: data.memberId }).eq("id", data.assignmentId)); return true; });

// ----- Family -----
const memberInput = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(60), role_label: z.string().trim().min(1).max(40), email: z.string().trim().email().max(200).nullable() });
export const saveMember = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof memberInput>) => memberInput.parse(d))
  .handler(async ({ data, context }) => {
    const me = await requireMe(context as Ctx);
    const { id, ...f } = data;
    const sb = (context as Ctx).supabase;
    if (id) ok(await sb.from("family_members").update(f).eq("id", id));
    else ok(await sb.from("family_members").insert({ ...f, household_id: me.household.id }));
    return true;
  });
export const deleteMember = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    const me = await requireMe(context as Ctx);
    if (me.member.id === data.id) throw new Error("You can't remove yourself");
    ok(await (context as Ctx).supabase.from("family_members").delete().eq("id", data.id));
    return true;
  });
const childInput = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(60), age: z.number().int().min(0).max(25).nullable(), color: z.enum(["lavender", "blue", "coral", "sage", "butter"]) });
export const saveChild = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof childInput>) => childInput.parse(d))
  .handler(async ({ data, context }) => {
    const me = await requireMe(context as Ctx);
    const { id, ...f } = data;
    const sb = (context as Ctx).supabase;
    if (id) ok(await sb.from("children").update(f).eq("id", id));
    else ok(await sb.from("children").insert({ ...f, household_id: me.household.id }));
    return true;
  });
export const deleteChild = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => idInput.parse(d))
  .handler(async ({ data, context }) => { ok(await (context as Ctx).supabase.from("children").delete().eq("id", data.id)); return true; });
export const renameHousehold = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => z.object({ name: z.string().trim().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await requireMe(context as Ctx);
    ok(await (context as Ctx).supabase.from("households").update({ name: data.name }).eq("id", me.household.id));
    return true;
  });

// ----- Change requests (rules enforced in database functions) -----
export const requestChange = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { assignmentId: string; toMemberId: string; message?: string }) => z.object({ assignmentId: z.string().uuid(), toMemberId: z.string().uuid(), message: z.string().max(300).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const requestId = ok(await ctx.supabase.rpc("request_change", { _assignment: data.assignmentId, _to: data.toMemberId, _message: data.message ?? null })) as string;
    await alertForRequest(ctx, requestId, "request");
    return true;
  });
export const respondChange = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { requestId: string; accept: boolean }) => z.object({ requestId: z.string().uuid(), accept: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    ok(await ctx.supabase.rpc("respond_change", { _request: data.requestId, _accept: data.accept }));
    await alertForRequest(ctx, data.requestId, data.accept ? "accepted" : "declined");
    return true;
  });
export const cancelChange = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { requestId: string }) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    ok(await ctx.supabase.rpc("cancel_change", { _request: data.requestId }));
    await alertForRequest(ctx, data.requestId, "cancelled");
    return true;
  });
export const acknowledgeDecline = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { requestId: string }) => z.object({ requestId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => { ok(await (context as Ctx).supabase.rpc("acknowledge_decline", { _request: data.requestId })); return true; });

export const getNotifications = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await meOf(context as Ctx);
    if (!me) return [];
    const sb = (context as Ctx).supabase;
    const rows = ok(await sb.from("notifications").select("id,type,read_at,created_at,request_id, reassignment_requests(*, activity_assignments(kind, activity_id))").eq("recipient_member_id", me.member.id).order("created_at", { ascending: false }).limit(50)) as any[];
    return rows.map((n) => ({
      id: n.id as string, type: n.type as string, read_at: n.read_at as string | null, created_at: n.created_at as string,
      request: n.reassignment_requests as ChangeRequest, kind: n.reassignment_requests?.activity_assignments?.kind as "dropoff" | "pickup",
      activityId: n.reassignment_requests?.activity_assignments?.activity_id as string,
    }));
  });
export const markNotificationsRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await requireMe(context as Ctx);
    ok(await (context as Ctx).supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_member_id", me.member.id).is("read_at", null).neq("type", "request"));
    return true;
  });

// ----- Notes, documents and heads-ups on an activity -----
export const getActivityExtras = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as Ctx).supabase;
    const [notes, files] = await Promise.all([
      sb.from("activity_notes").select("*").eq("activity_id", data.id).order("created_at", { ascending: false }),
      sb.from("activity_files").select("*").eq("activity_id", data.id).order("created_at", { ascending: false }),
    ]);
    return { notes: ok(notes) as any[], files: ok(files) as any[] };
  });
export const addNote = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { activityId: string; body: string; notifyMemberId: string | null }) => z.object({ activityId: z.string().uuid(), body: z.string().trim().min(1).max(2000), notifyMemberId: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await requireMe(context as Ctx);
    if (data.notifyMemberId === me.member.id) data.notifyMemberId = null;
    const ctx = context as Ctx;
    const row = ok(await ctx.supabase.from("activity_notes").insert({ activity_id: data.activityId, author_member_id: me.member.id, body: data.body, notify_member_id: data.notifyMemberId }).select("id").single()) as any;
    if (data.notifyMemberId) await alertForNote(ctx, row.id as string);
    return true;
  });
export const deleteNote = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => idInput.parse(d))
  .handler(async ({ data, context }) => { ok(await (context as Ctx).supabase.from("activity_notes").delete().eq("id", data.id)); return true; });
export const recordFile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { activityId: string; name: string; path: string; size: number }) => z.object({ activityId: z.string().uuid(), name: z.string().min(1).max(200), path: z.string().min(1).max(400), size: z.number().int().min(0) }).parse(d))
  .handler(async ({ data, context }) => {
    const me = await requireMe(context as Ctx);
    if (!data.path.startsWith(`${me.household.id}/${data.activityId}/`)) throw new Error("Invalid file path");
    ok(await (context as Ctx).supabase.from("activity_files").insert({ activity_id: data.activityId, uploaded_by_member_id: me.member.id, name: data.name, path: data.path, size: data.size }));
    return true;
  });
export const deleteFile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => idInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as Ctx).supabase;
    const f = ok(await sb.from("activity_files").select("path").eq("id", data.id).single()) as any;
    await sb.storage.from("activity-docs").remove([f.path]);
    ok(await sb.from("activity_files").delete().eq("id", data.id));
    return true;
  });
/** Notes where someone asked to let me know. */
export const getMessages = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await meOf(context as Ctx);
    if (!me) return [];
    return ok(await (context as Ctx).supabase.from("activity_notes").select("*").eq("notify_member_id", me.member.id).order("created_at", { ascending: false }).limit(50)) as any[];
  });
export const markMessagesRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await requireMe(context as Ctx);
    ok(await (context as Ctx).supabase.from("activity_notes").update({ read_at: new Date().toISOString() }).eq("notify_member_id", me.member.id).is("read_at", null));
    return true;
  });
