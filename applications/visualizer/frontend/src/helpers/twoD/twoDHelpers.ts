import type { Core } from "cytoscape";
import type { Connection } from "../../rest";
import type { Workspace } from "../../models";

export const createEdge = (conn: Connection) => {
  return {
    group: "edges",
    data: {
      id: `${conn.pre}-${conn.post}`,
      source: conn.pre,
      target: conn.post,
      label: conn.type,
    },
    classes: conn.type,
  };
};

export const createNode = (nodeId: string) => {
  return {
    group: "nodes",
    data: { id: nodeId, label: nodeId },
  };
};

export function applyLayout(cyRef: React.MutableRefObject<Core | null>, layout: string) {
  if (cyRef.current) {
    cyRef.current
      .layout({
        name: layout,
      })
      .run();
  }
}

export function filterConnections(
  connections: Array<Connection>,
  workspace: Workspace,
  includeNeighboringCells: boolean,
  includeNeighboringCellsAsIndividualCells: boolean,
) {
  if (!includeNeighboringCells) {
    return connections;
  }
  const neuronClasses = new Set(Object.values(workspace.availableNeurons).map((neuron) => neuron.nclass));

  return connections.filter((connection) => {
    const preClassIncluded = neuronClasses.has(connection.pre);
    const postClassIncluded = neuronClasses.has(connection.post);

    if (includeNeighboringCellsAsIndividualCells) {
      return !preClassIncluded && !postClassIncluded;
    } else {
      return preClassIncluded || postClassIncluded;
    }
  });
}
