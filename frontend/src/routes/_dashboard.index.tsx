import { createFileRoute } from "@tanstack/react-router";

import { TransactionsPage } from "@/pages/transactions-page";

export const Route = createFileRoute("/_dashboard/")({
  component: TransactionsPage,
});
