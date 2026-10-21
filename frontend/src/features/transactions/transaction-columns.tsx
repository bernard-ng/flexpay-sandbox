import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CreditCard, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { statusNames, type Transaction } from "@/lib/api";

function dateValue(value: string) {
  const [date, time] = value.split(" ");
  const [day, month, year] = date.split("-");

  return `${year}-${month}-${day}T${time}`;
}

export function transactionColumns(
  select: (id: string) => void,
): ColumnDef<Transaction>[] {
  return [
    {
      id: "reference",
      accessorFn: (tx) =>
        `${tx.request.reference} ${tx.orderNumber} ${tx.request.phone ?? ""}`,
      header: "Transaction",
      cell: ({ row: { original: tx } }) => (
        <div>
          <Button
            variant="link"
            className="h-auto p-0 font-medium"
            onClick={() => select(tx.orderNumber)}
          >
            {tx.request.reference}
          </Button>

          <p className="mt-1 max-w-48 truncate font-mono text-xs text-muted-foreground">
            {tx.orderNumber}
          </p>
        </div>
      ),
    },
    {
      id: "amount",
      accessorFn: (tx) => Number(tx.amount),
      header: ({ column }) => (
        <Button
          size="sm"
          variant="ghost"
          className="-ml-3"
          onClick={column.getToggleSortingHandler()}
        >
          Amount
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row: { original: tx } }) => (
        <div className="tabular-nums">
          <p className="font-medium">
            {tx.request.currency} {tx.amount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Customer: {tx.amountCustomer}
          </p>
        </div>
      ),
    },
    {
      id: "method",
      accessorFn: (tx) => tx.channel,
      header: "Method",
      cell: ({ row: { original: tx } }) => (
        <div>
          <p className="flex items-center gap-2 capitalize">
            {tx.kind === "card" ? (
              <CreditCard className="size-4 text-muted-foreground" />
            ) : (
              <Smartphone className="size-4 text-muted-foreground" />
            )}
            {tx.kind === "payout" ? "Payout · " : ""}
            {tx.channel}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {tx.request.phone ?? "Hosted checkout"}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      filterFn: (row, id, value) =>
        value === "all" || String(row.getValue(id)) === value,
      header: "Status",
      cell: ({ getValue }) => <StatusBadge value={getValue<number>()} />,
      sortingFn: (a, b) =>
        statusNames[a.original.status].localeCompare(
          statusNames[b.original.status],
        ),
    },
    {
      id: "created",
      accessorFn: (tx) => dateValue(tx.createdAt),
      header: ({ column }) => (
        <Button
          size="sm"
          variant="ghost"
          className="-ml-3"
          onClick={column.getToggleSortingHandler()}
        >
          Created · UTC
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {row.original.createdAt}
        </span>
      ),
    },
  ];
}
