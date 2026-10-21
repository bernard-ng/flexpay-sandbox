import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { JsonPreview } from "@/components/shared/json-preview";
import type { Transaction } from "@/lib/api";

export function CallbackDeliveries({
  transaction,
  replay,
  pending,
}: {
  transaction: Transaction;
  replay: () => void;
  pending: boolean;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Callback deliveries</h3>

        {[0, 1, 5].includes(transaction.status) && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={replay}
          >
            <RefreshCw />
            Replay
          </Button>
        )}
      </div>

      {!transaction.callbackAttempts.length && (
        <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          No callback delivered yet.
        </p>
      )}

      {transaction.callbackAttempts.map((attempt, index) => (
        <Card key={`${attempt.at}-${index}`}>
          <CardHeader>
            <Badge variant={attempt.error ? "destructive" : "secondary"}>
              {attempt.status ? `HTTP ${attempt.status}` : "Connection failed"}
            </Badge>

            <CardDescription>{attempt.at} · UTC</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3">
            {attempt.error && (
              <p className="break-all text-sm text-destructive">
                {attempt.error}
              </p>
            )}

            <JsonPreview value={attempt.payload} />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
