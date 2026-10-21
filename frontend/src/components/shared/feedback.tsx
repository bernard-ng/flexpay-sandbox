import { AlertCircle, Check } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function RequestError({
  error,
  retry,
}: {
  error: Error | null;
  retry?: () => void;
}) {
  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        <span>{error.message}</span>
        {retry && (
          <Button size="sm" variant="outline" onClick={retry}>
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function SuccessNotice({ children }: { children: React.ReactNode }) {
  return (
    <Alert role="status">
      <Check />
      <AlertTitle>{children}</AlertTitle>
    </Alert>
  );
}

export function LoadingPanel() {
  return (
    <div className="grid gap-4" role="status" aria-label="Loading">
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-72 w-full" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
