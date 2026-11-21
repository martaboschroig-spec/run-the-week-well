// Landing CTA: opens the sign-up modal; once the account exists, goes to pricing + payment.
import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
const SignupModal = lazy(() => import("@/components/app/SignupModal").then((module) => ({ default: module.SignupModal })));

export function StartButton({ children, variant = "cta", ...props }: ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    const go = () => navigate({ to: "/signup" });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (s) go(); });
    const recheck = () => supabase.auth.getSession().then(({ data }) => { if (data.session) go(); });
    window.addEventListener("focus", recheck);
    return () => { sub.subscription.unsubscribe(); window.removeEventListener("focus", recheck); };
  }, [open, navigate]);
  async function start() {
    const { data } = await supabase.auth.getSession();
    if (data.session) navigate({ to: "/signup" });
    else setOpen(true);
  }
  return (
    <>
      <Button {...props} variant={variant} onClick={start}>{children}</Button>
      {open && <Suspense fallback={null}><SignupModal open={open} onOpenChange={setOpen} returnTo="/signup" /></Suspense>}
    </>
  );
}
