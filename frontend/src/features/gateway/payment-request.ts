import type { Info } from "@/lib/api";

export type PaymentKind = "mobile" | "card" | "payout";

export interface PaymentValues {
  kind: PaymentKind;
  amount: string;
  currency: string;
  reference: string;
  phone: string;
  callbackUrl: string;
  returnUrl: string;
}

export function paymentRequest(value: PaymentValues, info: Info) {
  return {
    merchant: info.merchant,
    type: 1,
    reference: value.reference,
    amount: value.amount,
    currency: value.currency,
    callbackUrl: value.callbackUrl,
    ...(value.kind === "card"
      ? {
          authorization: `Bearer ${info.token}`,
          description: "Sandbox payment",
          approveUrl: value.returnUrl,
          cancelUrl: value.returnUrl,
          declineUrl: value.returnUrl,
          homeUrl: value.returnUrl,
        }
      : { phone: value.phone }),
  };
}
