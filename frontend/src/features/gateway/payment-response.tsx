import { ArrowUpRight, Braces, Check } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonPreview } from "@/components/shared/json-preview";
import { RequestError } from "@/components/shared/feedback";

export function PaymentResponse({
  data,
  error,
  pending,
}: {
  data?: Record<string, unknown>;
  error: Error | null;
  pending: boolean;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>API response</CardTitle>

        <CardDescription>
          The same response your integration receives.
        </CardDescription>

        {data && (
          <CardAction>
            <Badge variant="secondary">
              <Check />
              Accepted
            </Badge>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="grid gap-4">
        <RequestError error={error} />

        {data ? (
          <>
            <JsonPreview value={data} />

            {typeof data.url === "string" && (
              <Button
                nativeButton={false}
                render={<a href={data.url} target="_blank" rel="noreferrer" />}
              >
                Open hosted checkout
                <ArrowUpRight />
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              Accepted requests may still be pending. Follow the final outcome
              in Transactions.
            </p>
          </>
        ) : (
          <div className="grid justify-items-center gap-3 rounded-lg border border-dashed px-4 py-16 text-center">
            <Braces className="size-7 text-muted-foreground" />
            <p className="text-sm font-medium">
              {pending ? "Sending your request…" : "Ready when you are"}
            </p>

            <p className="max-w-xs text-sm text-muted-foreground">
              Create a payment to inspect its response and open the hosted
              checkout.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
