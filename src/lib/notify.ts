// Server-only. Delivers one alert to one family member over whichever channels they turned on.
// Every channel degrades quietly: a provider that isn't connected yet never breaks the action
// that triggered the alert (asking for a swap, accepting one, leaving a note).

type Ctx = { supabase: any };

export type Alert = { title: string; body: string; path: string };

const GATEWAY = "https://connector-gateway.lovable.dev";

const env = (k: string): string | undefined =>
  typeof process !== "undefined" ? (process.env as Record<string, string | undefined>)[k] : undefined;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FRIENDLY = ["mom", "dad", "grandma", "grandpa", "nanny"];
const nameOf = (m: any): string =>
  m && (FRIENDLY.includes(String(m.role_label).toLowerCase()) ? m.role_label : m.name) || "Someone";
const verb = (k: string) => (k === "dropoff" ? "drop off" : "pick up");
const slotOf = (k: string) => (k === "dropoff" ? "drop-off" : "pickup");

function time12(t = "00:00") {
  const [h = 0, m = 0] = String(t).split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function whenText(a: { recurrence: string; weekdays: number[] | null; start_date: string }) {
  if (a.recurrence === "weekly" && (a.weekdays ?? []).length) return a.weekdays!.map((w) => DAYS[w] ?? "").filter(Boolean).join(", ");
  const d = new Date(a.start_date + "T00:00:00Z");
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

// ---------- channels ----------

async function sendPush(ctx: Ctx, memberId: string, alert: Alert) {
  const connectionKey = env("FIREBASE_MESSAGING_API_KEY");
  const lovableKey = env("LOVABLE_API_KEY");
  if (!connectionKey || !lovableKey) return 0;

  const rows = await ctx.supabase.from("push_tokens").select("id,token").eq("member_id", memberId);
  let sent = 0;
  for (const t of (rows.data ?? []) as { id: string; token: string }[]) {
    const res = await fetch(`${GATEWAY}/firebase_messaging/v1/projects/_/messages:send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: t.token,
          notification: { title: alert.title, body: alert.body },
          data: { path: alert.path },
        },
      }),
    });
    if (res.ok) {
      sent++;
      continue;
    }
    const detail = await res.text();
    console.error(`[notify] push failed ${res.status}: ${detail}`);
    // A stale token is dead for good — stop offering it.
    if (res.status === 404 || res.status === 400) await ctx.supabase.from("push_tokens").delete().eq("id", t.id);
  }
  return sent;
}

async function sendText(phone: string, alert: Alert) {
  const connectionKey = env("TWILIO_API_KEY");
  const fromNumber = env("TWILIO_FROM_NUMBER");
  if (!connectionKey || !fromNumber) return false;

  const res = await fetch(`${GATEWAY}/twilio/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: phone, From: fromNumber, Body: `${alert.title}. ${alert.body}` }),
  });
  if (!res.ok) console.error(`[notify] text failed ${res.status}: ${await res.text()}`);
  return res.ok;
}

// Email goes out through the project's own sender once that domain is set up.
// Until then the alert still lands in the app and on the phone.

// ---------- delivery ----------

export async function deliver(ctx: Ctx, memberId: string, alert: Alert) {
  try {
    const found = await ctx.supabase
      .from("family_members")
      .select("email,phone,notify_email,notify_push,notify_sms")
      .eq("id", memberId)
      .maybeSingle();
    const m = found.data as any;
    if (!m) return;
    if (m.notify_push) await sendPush(ctx, memberId, alert);
    if (m.notify_sms && m.phone) await sendText(String(m.phone), alert);
    if (m.notify_email && m.email) {
      // sender domain not configured yet — nothing to send through
    }
  } catch (e) {
    console.error("[notify] delivery failed", e);
  }
}

// ---------- copy ----------

type ReqRow = {
  id: string;
  message: string | null;
  from_member_id: string;
  to_member_id: string;
  requested_by_member_id: string;
  kind: string;
  activity_id: string;
  activity: string;
  child: string;
  location: string | null;
  start_time: string;
  end_time: string;
  recurrence: string;
  weekdays: number[] | null;
  start_date: string;
};

async function loadRequest(ctx: Ctx, requestId: string): Promise<ReqRow | null> {
  const r = await ctx.supabase
    .from("reassignment_requests")
    .select(
      "id,message,from_member_id,to_member_id,requested_by_member_id, activity_assignments(kind, activity_id, activities(name, start_date, start_time, end_time, recurrence, weekdays, location, children(name)))",
    )
    .eq("id", requestId)
    .maybeSingle();
  const row = r.data as any;
  if (!row) return null;
  const asg = row.activity_assignments ?? {};
  const a = asg.activities ?? {};
  return {
    id: row.id,
    message: row.message ?? null,
    from_member_id: row.from_member_id,
    to_member_id: row.to_member_id,
    requested_by_member_id: row.requested_by_member_id,
    kind: asg.kind ?? "dropoff",
    activity_id: asg.activity_id ?? "",
    activity: a.name ?? "the activity",
    child: a.children?.name ?? "your child",
    location: a.location ?? null,
    start_time: a.start_time ?? "00:00",
    end_time: a.end_time ?? "00:00",
    recurrence: a.recurrence ?? "none",
    weekdays: a.weekdays ?? null,
    start_date: a.start_date ?? "",
  };
}

async function namesOf(ctx: Ctx, ids: string[]) {
  const ms = await ctx.supabase.from("family_members").select("id,name,role_label").in("id", ids);
  const rows = (ms.data ?? []) as any[];
  return (id: string) => nameOf(rows.find((x) => x.id === id));
}

export async function alertForRequest(
  ctx: Ctx,
  requestId: string,
  event: "request" | "accepted" | "declined" | "cancelled",
) {
  try {
    const r = await loadRequest(ctx, requestId);
    if (!r) return;
    const mem = await namesOf(ctx, [r.from_member_id, r.to_member_id, r.requested_by_member_id]);
    const from = mem(r.from_member_id);
    const to = mem(r.to_member_id);
    const by = mem(r.requested_by_member_id);
    const when = `${whenText(r)} · ${time12(r.kind === "dropoff" ? r.start_time : r.end_time)}`;
    const place = r.location ? ` (${r.location})` : "";

    let alert: Alert;
    let recipient: string;

    if (event === "request") {
      recipient = r.to_member_id;
      alert = {
        title: `New request from ${from}`,
        body: `Can you ${verb(r.kind)} ${r.child} ${r.kind === "dropoff" ? "at" : "from"} ${r.activity}${place}? ${when}${
          r.message ? ` — they said: "${r.message}"` : ""
        }`,
        path: "/notifications",
      };
    } else if (event === "accepted") {
      recipient = r.requested_by_member_id;
      alert = { title: "Swap confirmed", body: `${to} will ${verb(r.kind)} ${r.child} — ${r.activity}, ${when}.`, path: "/schedule" };
    } else if (event === "declined") {
      recipient = r.requested_by_member_id;
      alert = {
        title: `${to} can't do it`,
        body: `${to} can't ${verb(r.kind)} ${r.child}. ${from} is still responsible — ${r.activity}, ${when}.`,
        path: "/notifications",
      };
    } else {
      recipient = r.to_member_id;
      alert = {
        title: "Request cancelled",
        body: `${by} cancelled the request about ${r.child}'s ${slotOf(r.kind)} — ${r.activity}, ${when}.`,
        path: "/schedule",
      };
    }

    await deliver(ctx, recipient, alert);
  } catch (e) {
    console.error("[notify] request alert failed", e);
  }
}

export async function alertForNote(ctx: Ctx, noteId: string) {
  try {
    const n = await ctx.supabase
      .from("activity_notes")
      .select("id,body,author_member_id,notify_member_id,activity_id, activities(name, children(name))")
      .eq("id", noteId)
      .maybeSingle();
    const row = n.data as any;
    if (!row?.notify_member_id) return;
    const mem = await namesOf(ctx, [row.author_member_id]);
    const a = row.activities ?? {};
    await deliver(ctx, row.notify_member_id, {
      title: `${mem(row.author_member_id)} wants you to know`,
      body: `${a.children?.name ?? "Your child"} — ${a.name ?? "the activity"}: ${String(row.body).slice(0, 300)}`,
      path: `/activities/${row.activity_id}`,
    });
  } catch (e) {
    console.error("[notify] note alert failed", e);
  }
}
