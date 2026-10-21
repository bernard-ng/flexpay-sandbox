import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  api,
  type CheckoutData,
  type Info,
  type Settings,
  type Transaction,
} from "./api";

import { useWorkspace } from "@/app/workspace-store";

export const simulatorKeys = {
  all: ["simulator"] as const,
  transactions: ["simulator", "transactions"] as const,
  settings: ["simulator", "settings"] as const,
  info: ["simulator", "info"] as const,
  checkout: (id: string) => ["simulator", "checkout", id] as const,
};

export const infoQuery = queryOptions({
  queryKey: simulatorKeys.info,
  queryFn: ({ signal }) => api<Info>("/api/simulator/info", { signal }),
});

export const settingsQuery = queryOptions({
  queryKey: simulatorKeys.settings,
  queryFn: ({ signal }) => api<Settings>("/api/simulator/settings", { signal }),
  refetchOnWindowFocus: false,
});

export function useTransactions() {
  const live = useWorkspace((state) => state.live);

  return useQuery({
    queryKey: simulatorKeys.transactions,
    queryFn: ({ signal }) =>
      api<Transaction[]>("/api/simulator/transactions", { signal }),
    refetchInterval: live ? 2000 : false,
    refetchOnWindowFocus: live,
  });
}

export function useCheckout(id: string) {
  return useQuery({
    queryKey: simulatorKeys.checkout(id),
    queryFn: ({ signal }) =>
      api<CheckoutData>(`/api/simulator/checkout/${encodeURIComponent(id)}`, {
        signal,
      }),
    refetchInterval: (query) => (query.state.data?.status === 2 ? 2000 : false),
  });
}

export function useTransactionAction(id: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (action: number | "callback") =>
      api(
        `/api/simulator/transactions/${encodeURIComponent(id)}/${action === "callback" ? "callback" : "resolve"}`,
        {
          method: "POST",
          ...(action === "callback"
            ? {}
            : { body: JSON.stringify({ status: action }) }),
        },
      ),

    onSuccess: () => client.invalidateQueries({ queryKey: simulatorKeys.all }),
  });
}
