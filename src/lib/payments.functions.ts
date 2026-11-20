import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

// Family Trial: $1.95 today (one-time fee), 7-day trial, then $9.99 every 4 weeks.
const TRIAL_FEE_PRICE = "family_trial_fee";
const RENEWAL_CENTS = 999;
const TRIAL_DAYS = 7;

async function resolveOrCreateCustomer(stripe: Stripe, options: { email?: string; userId: string }): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, { metadata: { ...customer.metadata, userId: options.userId } });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email ? { email: options.email } : {}),
    metadata: { userId: options.userId },
  });
  return created.id;
}

export const createTrialCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) => {
    if (data.environment !== "sandbox" && data.environment !== "live") throw new Error("Invalid environment");
    return data;
  })
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    try {
      const email = (context.claims as { email?: string }).email;
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [TRIAL_FEE_PRICE] });
      const fee = prices.data[0];
      if (!fee) throw new Error("Price not found");
      const productId = typeof fee.product === "string" ? fee.product : fee.product.id;
      const customerId = await resolveOrCreateCustomer(stripe, { userId: context.userId, ...(email ? { email } : {}) });
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        line_items: [
          { price_data: { currency: "usd", product: productId, unit_amount: RENEWAL_CENTS, recurring: { interval: "week", interval_count: 4 }, tax_behavior: "inclusive" }, quantity: 1 },
          { price: fee.id, quantity: 1 },
        ],
        subscription_data: { trial_period_days: TRIAL_DAYS, metadata: { userId: context.userId } },
        metadata: { userId: context.userId, managed_payments: "true" },
        managed_payments: { enabled: true },
      } as Stripe.Checkout.SessionCreateParams);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
