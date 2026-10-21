import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <Activity className="size-5" />
          FlexPay
        </Link>

        <Badge variant="outline">Test checkout</Badge>
      </header>

      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        <Button
          variant="ghost"
          className="-ml-3"
          nativeButton={false}
          render={<Link to="/" />}
        >
          <ArrowLeft />
          Back to sandbox
        </Button>
      </div>

      <main className="mx-auto grid max-w-4xl items-start gap-6 px-4 py-6 sm:px-6 md:grid-cols-2">
        {children}
      </main>
      <footer className="p-6 text-center text-xs text-muted-foreground">
        FlexPay local sandbox · Simulated payments for integration testing
      </footer>
    </div>
  );
}
