import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useWorkspace, useWorkspaceActions } from "@/app/workspace-store";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { RequestError } from "@/components/shared/feedback";
import { api } from "@/lib/api";
import { simulatorKeys } from "@/lib/queries";

export function ResetTransactionsDialog() {
  const open = useWorkspace((state) => state.resetOpen);
  const update = useWorkspaceActions();
  const client = useQueryClient();

  const reset = useMutation({
    mutationFn: () => api("/api/simulator/reset", { method: "POST" }),

    onSuccess: async () => {
      update({ resetOpen: false, selectedId: null });
      await client.invalidateQueries({ queryKey: simulatorKeys.all });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!reset.isPending) {
          update({ resetOpen: value });
          reset.reset();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all transactions?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes payment history and callback logs. Your test
            configuration stays saved.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RequestError error={reset.error} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={reset.isPending}>
            Keep transactions
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={reset.isPending}
            onClick={(event) => {
              event.preventDefault();
              reset.mutate();
            }}
          >
            {reset.isPending ? "Resetting…" : "Reset transactions"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
