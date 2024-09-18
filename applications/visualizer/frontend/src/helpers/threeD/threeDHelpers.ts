import { ViewerType, Visibility, type Workspace } from "../../models";

export function getVisibleNeuronsInThreeD(workspace: Workspace): string[] {
  return Array.from(workspace.activeNeurons).filter((neuronId) => workspace.visibilities[neuronId]?.[ViewerType.ThreeD]?.visibility === Visibility.Visible);
}
