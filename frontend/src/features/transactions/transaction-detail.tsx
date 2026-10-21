import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/status-badge";
import { RequestError, SuccessNotice } from "@/components/shared/feedback";
import { useWorkspace, useWorkspaceActions } from "@/app/workspace-store";
import { useTransactionAction, useTransactions } from "@/lib/queries";
import type { Transaction } from "@/lib/api";

import { CallbackDeliveries } from "./callback-deliveries";

export function TransactionDetail() {
  const id = useWorkspace((state) => state.selectedId);
  const update = useWorkspaceActions();
  const { data } = useTransactions();

  const transaction = data?.find((tx) => tx.orderNumber === id);

  return (
    <Sheet
      open={id !== null}
      onOpenChange={(open) => {
        if (!open) update({ selectedId: null });
      }}
    >
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {transaction?.request.reference ?? "Transaction details"}
          </SheetTitle>

          <SheetDescription>
            Payment information and callback history
          </SheetDescription>
        </SheetHeader>

        {transaction ? (
          <TransactionDetailContent
            key={transaction.orderNumber}
            transaction={transaction}
          />
        ) : (
          <p className="px-4 text-sm text-muted-foreground">
            This transaction is no longer available.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TransactionDetailContent({
  transaction: tx,
}: {
  transaction: Transaction;
}) {
  const action = useTransactionAction(tx.orderNumber);

  const actions: [number, string][] =
    tx.status === 2
      ? [
          [0, "Mark successful"],
          [1, "Mark failed"],
          [5, "Cancel"],
        ]
      : tx.status === 0
        ? [[3, "Start refund"]]
        : tx.status === 3
          ? [[4, "Complete refund"]]
          : [];

  return (
    <div className="grid gap-6 px-4 pb-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-3xl font-semibold tabular-nums">
          {tx.request.currency} {tx.amount}
        </p>
        <StatusBadge value={tx.status} />
      </div>

      <RequestError error={action.error} />

      {action.isSuccess && (
        <SuccessNotice>
          {action.variables === "callback"
            ? "Callback queued"
            : "Transaction updated"}
        </SuccessNotice>
      )}

      <dl className="divide-y text-sm">
        {[
          ["Order number", tx.orderNumber],
          ["Payment method", tx.kind],
          ["Channel", tx.channel],
          ["Customer amount", tx.amountCustomer],
          ["Phone", tx.request.phone ?? "—"],
          ["Created · UTC", tx.createdAt],
          ["Provider reference", tx.providerReference || "—"],
          ["Callback URL", tx.request.callbackUrl],
        ].map(([label, value]) => (
          <div key={label} className="grid gap-1 py-3 sm:grid-cols-[130px_1fr]">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="break-all">{value}</dd>
          </div>
        ))}
      </dl>

      {tx.kind === "card" && tx.status === 2 && (
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <a
              href={`/checkout/${tx.orderNumber}`}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          Open hosted checkout
        </Button>
      )}

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map(([status, label]) => (
            <Button
              key={status}
              disabled={action.isPending}
              variant={status === 0 ? "default" : "outline"}
              onClick={() => action.mutate(status)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      <Separator />

      <CallbackDeliveries
        transaction={tx}
        pending={action.isPending}
        replay={() => action.mutate("callback")}
      />
    </div>
  );
}
