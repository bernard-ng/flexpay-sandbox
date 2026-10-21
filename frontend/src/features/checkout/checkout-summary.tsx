import { CreditCard, ShieldCheck } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { LoadingPanel } from "@/components/shared/feedback";
import { useCheckout } from "@/lib/queries";

export function CheckoutSummary({ id }: { id: string }) {
  const { data, isPending } = useCheckout(id);

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CreditCard className="mb-3 size-7" />

          <CardDescription>
            Payment to {data?.merchant ?? "Test merchant"}
          </CardDescription>

          <CardTitle className="text-4xl tabular-nums">
            {data ? `${data.currency} ${data.amount}` : "Payment details"}
          </CardTitle>

          <CardDescription>{data?.description}</CardDescription>
        </CardHeader>

        <CardContent>
          {isPending ? (
            <LoadingPanel />
          ) : (
            data && (
              <dl className="grid gap-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="break-all text-right">{data.reference}</dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Payment amount</dt>
                  <dd>
                    {data.currency} {data.amount}
                  </dd>
                </div>

                <Separator />

                <div className="flex justify-between gap-4 font-medium">
                  <dt>Total with simulated fee</dt>
                  <dd className="whitespace-nowrap">
                    {data.currency} {data.amountCustomer}
                  </dd>
                </div>
              </dl>
            )
          )}
        </CardContent>
      </Card>

      <Alert>
        <ShieldCheck />
        <AlertTitle>Local test payment</AlertTitle>
        <AlertDescription>
          Use a configured test card. No charge is made.
        </AlertDescription>
      </Alert>
    </div>
  );
}
