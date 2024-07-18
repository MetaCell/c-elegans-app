import type { Workspace } from "../models";
import { useSelector } from "react-redux";
import { useGlobalContext } from "../contexts/GlobalContext.tsx";
import type { RootState } from "../layout-manager/layoutManagerFactory.ts";

export function useSelectedWorkspace(): Workspace | undefined {
  const { workspaces } = useGlobalContext();
  const workspaceId = useSelector((state: RootState) => state.workspaceId);

  return workspaces[workspaceId] as Workspace;
}
