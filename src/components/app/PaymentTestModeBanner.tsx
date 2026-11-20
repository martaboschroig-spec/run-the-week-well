const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return <div className="w-full border-b bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">Card payments aren't live yet.</div>;
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b bg-sun-soft px-4 py-2 text-center text-sm">
        Test mode: payments in the preview use test cards, no real money.{" "}
        <a href="https://docs.lovable.dev/features/payments#test-and-live-environments" target="_blank" rel="noopener noreferrer" className="font-medium underline">Read more</a>
      </div>
    );
  }
  return null;
}
