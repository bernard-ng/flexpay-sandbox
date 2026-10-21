import { Check, Clock3, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { statusNames } from "@/lib/api";

export function StatusBadge({ value }: { value: number }) {
  const Icon = value === 0 ? Check : value === 1 || value === 5 ? X : Clock3;

  return (
    <Badge
      variant={
        value === 1 || value === 5
          ? "destructive"
          : value === 0
            ? "default"
            : "secondary"
      }
    >
      <Icon />
      {statusNames[value] ?? "Unknown"}
    </Badge>
  );
}
