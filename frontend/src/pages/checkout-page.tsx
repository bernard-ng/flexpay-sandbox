import { CheckoutLayout } from "@/features/checkout/checkout-layout";
import { CheckoutSummary } from "@/features/checkout/checkout-summary";
import { CheckoutPayment } from "@/features/checkout/checkout-payment";

export function CheckoutPage({ id }: { id: string }) {
  return (
    <CheckoutLayout>
      <CheckoutSummary id={id} />
      <CheckoutPayment id={id} />
    </CheckoutLayout>
  );
}
