import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Plug } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingPanel, RequestError } from "@/components/shared/feedback";
import { infoQuery } from "@/lib/queries";

export function ApiConnection() {
  const query = useQuery(infoQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="size-4" />
          API connection
        </CardTitle>

        <CardDescription>
          Use these values in your TypeScript or PHP client.
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
        ) : (
          <div className="divide-y">
            {[
              ["Merchant", query.data.merchant],
              ["Bearer token", query.data.token],
              [
                "Mobile / payout base URL",
                `${query.data.publicUrl}/api/rest/v1`,
              ],
              ["Card payment URL", `${query.data.publicUrl}/v1.1/pay`],
            ].map(([label, value]) => (
              <ConnectionValue key={label} label={label} value={value} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConnectionValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setError(null);
    } catch (error) {
      setError(
        error instanceof Error ? error : new Error("Could not copy value"),
      );
    }
  }

  return (
    <div className="grid gap-2 py-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]">
        <span className="col-span-2 text-sm text-muted-foreground sm:col-span-1">
          {label}
        </span>
        <code className="min-w-0 flex-1 break-all text-xs">{value}</code>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Copy ${label}`}
          onClick={() => void copy()}
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>

      {copied && (
        <span role="status" className="text-xs text-muted-foreground">
          {label} copied
        </span>
      )}

      <RequestError error={error} />
    </div>
  );
}
