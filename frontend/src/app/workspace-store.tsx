import {
  createStoreContext,
  Store,
  useCreateStore,
  useSelector,
} from "@tanstack/react-store";
import { useCallback, type ReactNode } from "react";

interface WorkspaceState {
  search: string;
  status: string;
  selectedId: string | null;
  resetOpen: boolean;
  live: boolean;
}

const { StoreProvider, useStoreContext } = createStoreContext<{
  workspace: Store<WorkspaceState>;
}>();

export function WorkspaceStoreProvider({ children }: { children: ReactNode }) {
  const workspace = useCreateStore<WorkspaceState>({
    search: "",
    status: "all",
    selectedId: null,
    resetOpen: false,
    live: true,
  });

  return <StoreProvider value={{ workspace }}>{children}</StoreProvider>;
}

export function useWorkspace<T>(select: (state: WorkspaceState) => T) {
  const { workspace } = useStoreContext();

  return useSelector(workspace, select);
}

export function useWorkspaceActions() {
  const { workspace } = useStoreContext();

  return useCallback(
    (patch: Partial<WorkspaceState>) =>
      workspace.setState((state) => ({ ...state, ...patch })),
    [workspace],
  );
}
