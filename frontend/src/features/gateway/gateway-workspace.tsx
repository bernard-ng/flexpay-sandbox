import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingPanel, RequestError } from "@/components/shared/feedback";
import { infoQuery } from "@/lib/queries";
import type { Info } from "@/lib/api";

import { usePaymentForm } from "./use-payment-form";
import { PaymentFields } from "./payment-fields";
import { PaymentResponse } from "./payment-response";

export function GatewayWorkspace() {
  const query = useQuery(infoQuery);

  if (query.isPending) return <LoadingPanel />;

  if (query.isError)
    return (
      <RequestError error={query.error} retry={() => void query.refetch()} />
    );

  return <PaymentWorkspace info={query.data} />;
}

function PaymentWorkspace({ info }: { info: Info }) {
  const { form, mutation } = usePaymentForm(info);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_0.9fr]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Create a test payment</CardTitle>

            <CardDescription>
              Choose a method and send a request to your local API.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <fieldset disabled={mutation.isPending}>
              <PaymentFields
                form={form}
                onMethodChange={() => mutation.reset()}
              />
            </fieldset>
          </CardContent>

          <CardFooter className="justify-between gap-3 border-t pt-4">
            <span className="text-xs text-muted-foreground">
              No real money is moved
            </span>

            <form.Subscribe
              selector={(state) =>
                [state.canSubmit, state.isSubmitting] as const
              }
            >
              {([canSubmit, submitting]) => (
                <Button disabled={!canSubmit || submitting} type="submit">
                  {submitting ? <Loader2 className="animate-spin" /> : <Plus />}
                  Create payment
                </Button>
              )}
            </form.Subscribe>
          </CardFooter>
        </Card>
      </form>

      <PaymentResponse
        data={mutation.data}
        error={mutation.error}
        pending={mutation.isPending}
      />
    </div>
  );
}
