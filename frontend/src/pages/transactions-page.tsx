import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { TransactionMetrics } from "@/features/transactions/transaction-metrics";
import { TransactionsTable } from "@/features/transactions/transactions-table";
import { TransactionDetail } from "@/features/transactions/transaction-detail";
import { ResetTransactionsDialog } from "@/features/transactions/reset-transactions-dialog";

export function TransactionsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Local sandbox"
        title="Transactions"
        description="A clear view of every test payment, from the first request to the final callback."
      >
        <Button nativeButton={false} render={<Link to="/gateway" />}>
          <Plus />
          New test payment
        </Button>
      </PageHeading>

      <TransactionMetrics />

      <TransactionsTable />

      <TransactionDetail />

      <ResetTransactionsDialog />
    </>
  );
}
