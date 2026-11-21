import { useCallback, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createTrialCheckout } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";

export function TrialCheckout() {
  const create = useServerFn(createTrialCheckout);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const fetchClientSecret = useCallback(async () => {
    try {
    const result = await create({
      data: { environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}` },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Payment form could not start");
    return result.clientSecret;
    } catch (error) {
      setError(error instanceof Error ? error.message : "The payment form couldn't load.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [create]);
  return (
    <div id="checkout" className="overflow-hidden rounded-2xl">
      {error ? <div role="alert" className="space-y-3 py-6 text-center"><p className="text-sm text-muted-foreground">The payment form couldn't load. Please try again.</p><details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Error details</summary><p className="mt-2 break-words">{error}</p></details><Button variant="outline" onClick={() => { setError(null); setLoading(true); setAttempt(attempt + 1); }}>Try again</Button></div> : <>
      {loading && <p role="status" className="py-4 text-center text-sm text-muted-foreground">Preparing your secure payment form…</p>}
      <EmbeddedCheckoutProvider key={attempt} stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
      </>}
    </div>
  );
}
