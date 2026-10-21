import { Link } from "@tanstack/react-router";
import { Loader2, LockKeyhole } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LoadingPanel,
  RequestError,
  SuccessNotice,
} from "@/components/shared/feedback";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCheckout } from "@/lib/queries";
import type { CheckoutData } from "@/lib/api";

import { useCheckoutForm } from "./use-checkout-form";
import { CardFields } from "./card-fields";

export function CheckoutPayment({ id }: { id: string }) {
  const query = useCheckout(id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay by card</CardTitle>

        <CardDescription>
          Enter test card details to simulate a payment.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {query.isPending ? (
          <LoadingPanel />
        ) : query.isError ? (
          <RequestError
            error={query.error}
            retry={() => void query.refetch()}
          />
        ) : query.data.status !== 2 ? (
          <div className="grid justify-items-start gap-4">
            <StatusBadge value={query.data.status} />
            <p className="text-sm text-muted-foreground">
              This checkout is complete.
            </p>

            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to="/" />}
            >
              Return to dashboard
            </Button>
          </div>
        ) : (
          <CheckoutPaymentForm data={query.data} />
        )}
      </CardContent>

      <CardFooter className="grid gap-2 border-t pt-4 text-xs leading-5 text-muted-foreground">
        <p className="font-medium text-foreground">Default test cards</p>

        <p>
          4242 4242 4242 4242 · Success
          <br />
          4000 0000 0000 0002 · Declined
        </p>

        <p>
          Your saved rules take precedence. Name, expiration, CVV, and phone are
          test fields; only the card number is submitted.
        </p>
      </CardFooter>
    </Card>
  );
}

function CheckoutPaymentForm({ data }: { data: CheckoutData }) {
  const { form, mutation } = useCheckoutForm(data.orderNumber);

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <RequestError error={mutation.error} />

      {mutation.data?.message && (
        <SuccessNotice>{mutation.data.message}</SuccessNotice>
      )}

      <fieldset disabled={mutation.isPending}>
        <CardFields form={form} />
      </fieldset>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting] as const}
      >
        {([canSubmit, submitting]) => (
          <Button
            disabled={!canSubmit || submitting || mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <LockKeyhole />
            )}
            {mutation.isPending
              ? "Processing…"
              : `Pay ${data.currency} ${data.amountCustomer}`}
          </Button>
        )}
      </form.Subscribe>

      <Button
        variant="ghost"
        type="button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ cardNumber: "", cancel: true })}
      >
        Cancel payment
      </Button>
    </form>
  );
}
