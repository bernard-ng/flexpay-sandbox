import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Choice } from "@/components/form-controls";
import type { Transaction } from "@/lib/api";

export function TablePagination({ table }: { table: Table<Transaction> }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const count = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>
        {count === 0
          ? "0"
          : `${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, count)}`}{" "}
        of {count} payments
      </span>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline">Rows per page</span>

        <Choice
          label="Rows per page"
          value={String(pageSize)}
          options={[
            ["10", "10"],
            ["25", "25"],
            ["50", "50"],
          ]}
          onChange={(value) => table.setPageSize(Number(value))}
        />

        <span className="whitespace-nowrap">
          Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
        </span>

        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          <ChevronLeft />
        </Button>

        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
