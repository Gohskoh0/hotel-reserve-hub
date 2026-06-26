import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { verifyPaystackTransaction } from "@/lib/paystack.functions";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/payment/callback")({
  validateSearch: z.object({
    reference: z.string().optional(),
    trxref: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Verifying payment — Lakewood Hotel" }] }),
  component: PaymentCallback,
});

function PaymentCallback() {
  const { reference, trxref } = Route.useSearch();
  const navigate = useNavigate();
  const verify = useServerFn(verifyPaystackTransaction);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = reference || trxref;
    if (!ref) { setError("Missing payment reference"); return; }
    verify({ data: { reference: ref } })
      .then((res) => {
        if (res.ok) {
          navigate({ to: "/booking/$reference", params: { reference: res.bookingReference } });
        } else if (res.bookingReference) {
          navigate({
            to: "/booking/$reference",
            params: { reference: res.bookingReference },
            search: { paymentError: res.error },
          });
        } else {
          setError(res.error);
        }
      })
      .catch((e) => setError(e?.message || "Verification failed"));
  }, [reference, trxref, verify, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container-page py-24 max-w-md text-center flex-1">
        {error ? (
          <>
            <h1 className="font-display text-2xl">Verification problem</h1>
            <p className="mt-3 text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <div className="mx-auto size-10 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
            <h1 className="mt-6 font-display text-2xl">Verifying your payment…</h1>
            <p className="mt-2 text-muted-foreground">This will only take a moment.</p>
          </>
        )}
      </main>
    </div>
  );
}
