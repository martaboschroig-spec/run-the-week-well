import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — RunTheWeek" },
      { name: "description", content: "Choose a new password for RunTheWeek." },
      { property: "og:title", content: "Set a new password — RunTheWeek" },
      { property: "og:description", content: "Choose a new password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  return (
    <form className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 px-6" onSubmit={async (e) => {
      e.preventDefault();
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) { toast.error(error.message); return; }
      toast.success("Password updated");
      navigate({ to: "/schedule" });
    }}>
      <h1 className="text-3xl font-extrabold tracking-tight">Set a new password</h1>
      <Input type="password" minLength={6} required className="h-12 rounded-xl text-base" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" />
      <Button size="lg" type="submit">Save password</Button>
    </form>
  );
}
