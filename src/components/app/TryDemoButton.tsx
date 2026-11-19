import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startDemo } from "@/lib/demo.functions";
import { Button } from "@/components/ui/button";

export function TryDemoButton({ className, size = "lg" }: { className?: string; size?: "lg" | "default" }) {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function go() {
    setBusy(true);
    try {
      const { tokenHash } = await startDemo();
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
      if (error) throw error;
      navigate({ to: "/schedule" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The demo didn't open");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button type="button" size={size} variant="secondary" className={className} disabled={busy} onClick={go}>
      {busy ? "Opening…" : "Try it without an account"}
    </Button>
  );
}
