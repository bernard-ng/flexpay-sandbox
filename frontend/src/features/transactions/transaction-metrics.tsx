import { Activity, CircleCheck, Clock3, CircleX } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/lib/queries";

export function TransactionMetrics() {
  const { data, isPending } = useTransactions();

  const stats = [
    {
      label: "Total payments",
      value: data?.length,
      icon: Activity,
      hint: "Across all methods",
    },
    {
      label: "Succeeded",
      value: data?.filter((tx) => tx.status === 0).length,
      icon: CircleCheck,
      hint: "Completed payments",
    },
    {
      label: "Pending",
      value: data?.filter((tx) => tx.status === 2).length,
      icon: Clock3,
      hint: "Awaiting a result",
    },
    {
      label: "Failed",
      value: data?.filter((tx) => tx.status === 1).length,
      icon: CircleX,
      hint: "Simulated declines",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground sm:text-sm">
              <span>{stat.label}</span>
              <stat.icon className="size-4" />
            </div>

            {isPending ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                {stat.value ?? "—"}
              </p>
            )}

            <p className="hidden text-xs text-muted-foreground sm:block">
              {stat.hint}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
