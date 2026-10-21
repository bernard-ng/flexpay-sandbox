import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";

import { WorkspaceStoreProvider } from "./workspace-store";

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: true },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <WorkspaceStoreProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </WorkspaceStoreProvider>
    </QueryClientProvider>
  );
}
