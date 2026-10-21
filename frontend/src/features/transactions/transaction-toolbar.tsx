import { Search, RefreshCw, Pause, Radio } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useWorkspace, useWorkspaceActions } from "@/app/workspace-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { simulatorKeys, useTransactions } from "@/lib/queries";

export function TransactionToolbar() {
  const search = useWorkspace((state) => state.search);
  const status = useWorkspace((state) => state.status);
  const live = useWorkspace((state) => state.live);
  const update = useWorkspaceActions();
  const { isFetching } = useTransactions();
  const client = useQueryClient();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Tabs
        value={status}
        onValueChange={(value) => update({ status: String(value) })}
      >
        <TabsList className="max-w-full">
          {[
            ["all", "All"],
            ["0", "Succeeded"],
            ["2", "Pending"],
            ["1", "Failed"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex w-full items-center gap-2 lg:w-auto">
        <div className="relative min-w-0 flex-1 lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />

          <Input
            className="pl-9"
            aria-label="Search transactions"
            placeholder="Search reference, phone, ID…"
            value={search}
            onChange={(event) => update({ search: event.target.value })}
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          aria-label={live ? "Pause live updates" : "Resume live updates"}
          title={live ? "Pause live updates" : "Resume live updates"}
          onClick={() => update({ live: !live })}
        >
          {live ? <Pause /> : <Radio />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          aria-label="Refresh transactions"
          disabled={isFetching}
          onClick={() =>
            void client.invalidateQueries({
              queryKey: simulatorKeys.transactions,
            })
          }
        >
          <RefreshCw className={isFetching ? "animate-spin" : ""} />
        </Button>
      </div>
    </div>
  );
}
