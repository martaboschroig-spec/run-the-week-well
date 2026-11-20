import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type AppRole = "admin" | "support" | "user";

/** The signed-in person's own roles (used to show the admin link). */
export const myRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    return (data ?? []).map((r) => r.role as AppRole);
  });

async function staffRole(context: { supabase: any; userId: string }) {
  const [a, s] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "support" }),
  ]);
  return a.data ? "admin" : s.data ? "support" : null;
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const staff = await staffRole(context);
    if (!staff) throw new Error("Only the admin can see this page");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error("Couldn't load users");
    const [{ data: roles }, { data: members }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("family_members").select("user_id, name, role_label, households(name)").not("user_id", "is", null),
    ]);
    const users = list.users.map((u) => {
      const r = (roles ?? []).filter((x) => x.user_id === u.id).map((x) => x.role as AppRole);
      const m = (members ?? []).find((x) => x.user_id === u.id) as any;
      return {
        id: u.id, email: u.email ?? "", createdAt: u.created_at, lastSignIn: u.last_sign_in_at ?? null,
        role: (r.includes("admin") ? "admin" : r.includes("support") ? "support" : "user") as AppRole,
        family: m?.households?.name ?? null, name: m ? `${m.name} (${m.role_label})` : null,
      };
    });
    return { viewer: staff as AppRole, users };
  });

export const setRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), role: z.enum(["support", "user"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("set_user_role", { _user: data.userId, _role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
