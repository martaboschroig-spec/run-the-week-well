// Public "try it" entry: signs the visitor into a shared demo account that owns its own example family.
// The demo household is separate from every real family, so no private data is ever exposed.
import { createServerFn } from "@tanstack/react-start";

const DEMO_EMAIL = "demo@runtheweek.app";

export const startDemo = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");

  // 1. Demo user (created once, already confirmed).
  let userId: string | undefined;
  const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  userId = list?.users.find((u) => u.email === DEMO_EMAIL)?.id;
  if (!userId) {
    const { data, error } = await db.auth.admin.createUser({ email: DEMO_EMAIL, email_confirm: true });
    if (error) throw new Error(error.message);
    userId = data.user.id;
  }

  // 2. Demo family (created once).
  const { data: me } = await db.from("family_members").select("id").eq("user_id", userId).maybeSingle();
  if (!me) {
    const { data: hh, error } = await db.from("households").insert({ name: "The Demo Family", created_by: userId }).select("id").single();
    if (error) throw new Error(error.message);
    const { data: adults } = await db.from("family_members").insert([
      { household_id: hh.id, name: "Sarah", role_label: "Mom", email: DEMO_EMAIL, user_id: userId },
      { household_id: hh.id, name: "Michael", role_label: "Dad" },
      { household_id: hh.id, name: "Grandma", role_label: "Caregiver" },
    ]).select("id,name");
    const who = (n: string) => adults?.find((a) => a.name === n)?.id ?? null;
    const { data: kids } = await db.from("children").insert([
      { household_id: hh.id, name: "Emma", age: 12, color: "lavender" },
      { household_id: hh.id, name: "Leo", age: 9, color: "blue" },
      { household_id: hh.id, name: "Sophie", age: 6, color: "coral" },
    ]).select("id,name");
    const kid = (n: string) => kids!.find((k) => k.name === n)!.id;
    const today = new Date().toISOString().slice(0, 10);
    const plan = [
      { child: "Emma", name: "Soccer", start: "17:00", end: "18:30", loc: "Riverside Park", days: [1, 3, 5], drop: "Sarah", pick: "Michael", items: ["Cleats", "Water bottle", "Shin guards"] },
      { child: "Leo", name: "Karate", start: "17:15", end: "18:15", loc: "Dojo on 5th", days: [2, 5], drop: "Grandma", pick: null, items: ["Gi", "Belt"] },
      { child: "Sophie", name: "Swim", start: "09:00", end: "10:00", loc: "Community pool", days: [6], drop: "Michael", pick: "Sarah", items: ["Towel", "Goggles"] },
    ];
    for (const p of plan) {
      const { data: act } = await db.from("activities").insert({
        child_id: kid(p.child), name: p.name, start_date: today, start_time: p.start, end_time: p.end,
        location: p.loc, recurrence: "weekly", weekdays: p.days,
      }).select("id").single();
      if (!act) continue;
      await db.from("activity_items").insert(p.items.map((label, position) => ({ activity_id: act.id, label, position })));
      await db.from("activity_assignments").insert([
        { activity_id: act.id, kind: "dropoff", member_id: who(p.drop) },
        { activity_id: act.id, kind: "pickup", member_id: p.pick ? who(p.pick) : null },
      ]);
    }
  }

  // 3. One-time sign-in token the browser exchanges for a session.
  const { data: link, error } = await db.auth.admin.generateLink({ type: "magiclink", email: DEMO_EMAIL });
  if (error) throw new Error(error.message);
  return { tokenHash: link.properties.hashed_token };
});
