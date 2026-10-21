import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { Activity, Plus, Trash2 } from "lucide-react";

import { useWorkspace, useWorkspaceActions } from "@/app/workspace-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingPanel, RequestError } from "@/components/shared/feedback";
import { useTransactions } from "@/lib/queries";
import type { Transaction } from "@/lib/api";

import { transactionColumns } from "./transaction-columns";
import { TransactionToolbar } from "./transaction-toolbar";
import { TablePagination } from "./table-pagination";

const empty: Transaction[] = [];

export function TransactionsTable() {
  const query = useTransactions();
  const search = useWorkspace((state) => state.search);
  const status = useWorkspace((state) => state.status);
  const live = useWorkspace((state) => state.live);
  const update = useWorkspaceActions();

  const columns = useMemo(
    () => transactionColumns((id) => update({ selectedId: id })),
    [update],
  );

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created", desc: true },
  ]);

  const columnFilters = useMemo(
    () => [{ id: "status", value: status }],
    [status],
  );

  const table = useReactTable({
    data: query.data ?? empty,
    columns,
    state: {
      sorting,
      globalFilter: search,
      columnFilters,
    },
    onSortingChange: setSorting,
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: (column) => column.id === "reference",
    getRowId: (tx) => tx.orderNumber,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Payment activity</CardTitle>

        <CardDescription>
          Inspect requests, payment outcomes, and callback deliveries.
        </CardDescription>

        <CardAction>
          <Badge variant="outline">
            <span
              className={`size-1.5 rounded-full ${live ? "bg-emerald-500" : "bg-muted-foreground"}`}
            />
            {live ? "Live · 2s" : "Paused"}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid min-w-0 gap-5">
        <TransactionToolbar />

        <RequestError error={query.error} retry={() => void query.refetch()} />

        {query.isPending ? (
          <LoadingPanel />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((group) => (
                  <TableRow key={group.id}>
                    {group.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        aria-sort={
                          header.column.getIsSorted() === "asc"
                            ? "ascending"
                            : header.column.getIsSorted() === "desc"
                              ? "descending"
                              : undefined
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell className="py-4" key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {!table.getFilteredRowModel().rows.length && (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <div className="grid justify-items-center gap-3 py-14 text-center">
                        <Activity className="size-7 text-muted-foreground" />

                        <p className="font-medium">
                          {query.data?.length
                            ? "No matching payments"
                            : "Your payment activity starts here"}
                        </p>

                        <p className="max-w-sm text-sm text-muted-foreground">
                          {query.data?.length
                            ? "Try another reference or clear your filters."
                            : "Send a request from your app, or create a payment in the gateway simulator."}
                        </p>

                        {query.data?.length ? (
                          <Button
                            variant="outline"
                            onClick={() =>
                              update({ search: "", status: "all" })
                            }
                          >
                            Clear filters
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            nativeButton={false}
                            render={<Link to="/gateway" />}
                          >
                            <Plus />
                            Create test payment
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <TablePagination table={table} />
      </CardContent>

      <CardFooter className="justify-between gap-3 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Stored locally in SQLite
        </p>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => update({ resetOpen: true })}
        >
          <Trash2 />
          Reset transactions
        </Button>
      </CardFooter>
    </Card>
  );
}
