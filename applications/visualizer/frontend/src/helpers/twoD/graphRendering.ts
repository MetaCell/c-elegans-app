import type { CollectionReturnValue, Core, ElementDefinition } from "cytoscape";
import type { NeuronGroup, Workspace } from "../../models";
import { ViewerType } from "../../models";
import type { Connection } from "../../rest";
import { FADED_CLASS, LegendType } from "../../settings/twoDSettings.tsx";
import {
  calculateMeanPosition,
  createEdge,
  createNode,
  extractNeuronAttributes,
  getEdgeId,
  getNclassSet,
  getVisibleActiveNeuronsIn2D,
  isNeuronCell,
  isNeuronClass,
} from "./twoDHelpers";

export const computeGraphDifferences = (
  cy: Core,
  connections: Connection[],
  workspace: Workspace,
  splitJoinState: { split: Set<string>; join: Set<string> },
  hiddenNodes: Set<string>,
  openGroups: Set<string>,
  includeNeighboringCellsAsIndividualCells: boolean,
  includeAnnotations: boolean,
  includePostEmbryonic: boolean,
) => {
  const visibleActiveNeurons = getVisibleActiveNeuronsIn2D(workspace);
  const selectedNeurons = workspace.getViewerSelecedNeurons(ViewerType.Graph);

  // Current nodes and edges in the Cytoscape instance
  const currentNodes = new Set(cy.nodes().map((node) => node.id()));
  const currentEdges = new Set(cy.edges().map((edge) => edge.id()));

  // Expected nodes and edges
  let expectedNodes = new Set<string>();
  let expectedEdges = new Set<string>();

  const nodesToAdd: ElementDefinition[] = [];
  const nodesToRemove: CollectionReturnValue = cy.collection();
  const edgesToAdd: ElementDefinition[] = [];
  const edgesToRemove: CollectionReturnValue = cy.collection();

  // Create a map of connections by edgeId
  const connectionMap = new Map<string, Connection>();
  for (const conn of connections) {
    const edgeId = getEdgeId(conn, includeAnnotations);
    connectionMap.set(edgeId, conn);
  }

  // Compute expected nodes based on visibleActiveNeurons and connections
  const filteredActiveNeurons = Array.from(visibleActiveNeurons).filter((neuronId: string) => {
    const neuron = workspace.availableNeurons[neuronId];
    if (!neuron || hiddenNodes.has(neuronId)) {
      return false;
    }
    if (!includePostEmbryonic && !neuron.embryonic) {
      return false;
    }
    const nclass = neuron.nclass;
    if (neuronId === nclass) {
      return true;
    }
    return !(visibleActiveNeurons.has(neuronId) && visibleActiveNeurons.has(nclass));
  });

  // Add active neurons to expected nodes
  for (const neuronId of filteredActiveNeurons) {
    expectedNodes.add(neuronId);
  }

  // Add nodes from connections to expected nodes
  for (const conn of connections) {
    const preNeuron = workspace.availableNeurons[conn.pre];
    const postNeuron = workspace.availableNeurons[conn.post];

    if (!hiddenNodes.has(conn.pre) && !hiddenNodes.has(conn.post) && (includePostEmbryonic || (preNeuron?.embryonic && postNeuron?.embryonic))) {
      expectedNodes.add(conn.post);
      expectedNodes.add(conn.pre);

      const edgeId = getEdgeId(conn, includeAnnotations);
      expectedEdges.add(edgeId);
    }
  }

  // Apply split and join rules to expected nodes and edges
  expectedNodes = applySplitJoinRulesToNodes(
    expectedNodes,
    splitJoinState.split,
    splitJoinState.join,
    includeNeighboringCellsAsIndividualCells,
    workspace,
    visibleActiveNeurons,
  );
  expectedEdges = applySplitJoinRulesToEdges(expectedEdges, expectedNodes, connectionMap);

  // Replace individual neurons and edges with groups if necessary
  expectedNodes = applyGroupingRulesToNodes(expectedNodes, workspace.neuronGroups, hiddenNodes, openGroups);
  expectedEdges = applyGroupingRulesToEdges(expectedEdges, workspace.neuronGroups, connectionMap, includeAnnotations, openGroups);

  // Determine nodes to add and remove
  for (const nodeId of expectedNodes) {
    if (!currentNodes.has(nodeId)) {
      const group = workspace.neuronGroups[nodeId];
      if (group) {
        // If the node is a group, extract attributes from all neurons in the group
        const attributes = new Set<string>();
        const groupNeurons = Array.from(group.neurons);

        for (const neuronId of groupNeurons) {
          const neuron = workspace.availableNeurons[neuronId];
          for (const attr of extractNeuronAttributes(neuron)) {
            attributes.add(attr);
          }
        }
        const groupPosition = calculateMeanPosition(groupNeurons, workspace);
        nodesToAdd.push(
          createNode(nodeId, selectedNeurons.includes(nodeId), Array.from(attributes), groupPosition, true, undefined, workspace.activeNeurons.has(nodeId)),
        );
      } else {
        let parent = undefined;

        // Check if the neuron belongs to an open group
        for (const groupId of openGroups) {
          if (workspace.neuronGroups[groupId]?.neurons.has(nodeId)) {
            parent = groupId;
            break;
          }
        }
        const neuron = workspace.availableNeurons[nodeId];
        const attributes = extractNeuronAttributes(neuron);
        const neuronVisibility = workspace.visibilities[nodeId];
        const position = neuronVisibility?.[ViewerType.Graph]?.defaultPosition ?? null;
        nodesToAdd.push(createNode(nodeId, selectedNeurons.includes(nodeId), attributes, position, false, parent, workspace.activeNeurons.has(nodeId)));
        if (!(nodeId in workspace.visibilities)) {
          workspace.showNeuron(nodeId);
        }
      }
    }
  }

  for (const nodeId of currentNodes) {
    if (!expectedNodes.has(nodeId)) {
      nodesToRemove.merge(cy.getElementById(nodeId));
    }
  }

  // Determine edges to add and remove
  for (const edgeId of expectedEdges) {
    if (!currentEdges.has(edgeId)) {
      const conn = connectionMap.get(edgeId);
      const syns = Object.values(conn.synapses).reduce((acc, num) => acc + num, 0);
      const meanSyn = syns / Object.values(conn.synapses).length;
      let width;
      if (conn.type === "chemical") {
        width = Math.max(1, 2 * Math.pow(meanSyn, 1 / 4) - 2);
      } else {
        width = Math.min(4, meanSyn * 0.8);
      }
      if (!hiddenNodes.has(conn?.pre) && !hiddenNodes.has(conn?.post)) {
        edgesToAdd.push(createEdge(edgeId, conn, workspace, includeAnnotations, width));
      }
    }
  }

  for (const edgeId of currentEdges) {
    if (!expectedEdges.has(edgeId)) {
      edgesToRemove.merge(cy.getElementById(edgeId));
    }
  }

  // Return the differences to be applied to the Cytoscape instance
  return { nodesToAdd, nodesToRemove, edgesToAdd, edgesToRemove };
};

// Replace individual neurons with group nodes
const applyGroupingRulesToNodes = (
  expectedNodes: Set<string>,
  neuronGroups: Record<string, NeuronGroup>,
  hiddenNodes: Set<string>,
  openGroups: Set<string>,
) => {
  const nodesToAdd = new Set<string>();
  const nodesToRemove = new Set<string>();

  for (const nodeId of expectedNodes) {
    for (const groupId in neuronGroups) {
      const group = neuronGroups[groupId];

      if (group.neurons.has(nodeId)) {
        if (!hiddenNodes.has(groupId)) {
          nodesToAdd.add(groupId);
        }
        if (!openGroups.has(groupId)) {
          nodesToRemove.add(nodeId);
        }
      }
    }
  }

  // Remove individual nodes if they are replaced by a closed group node
  for (const nodeId of nodesToRemove) {
    expectedNodes.delete(nodeId);
  }
  // Add group nodes
  for (const nodeId of nodesToAdd) {
    expectedNodes.add(nodeId);
  }

  return expectedNodes;
};

// Replace edges involving individual neurons with edges involving group nodes
const applyGroupingRulesToEdges = (
  expectedEdges: Set<string>,
  neuronGroups: Record<string, NeuronGroup>,
  connectionMap: Map<string, Connection>,
  includeAnnotations: boolean,
  openGroups: Set<string>,
) => {
  const edgesToAdd = new Set<string>();
  const edgesToRemove = new Set<string>();
  const groupedConnections: Map<string, Connection> = new Map();

  for (const edgeId of expectedEdges) {
    const conn = connectionMap.get(edgeId);
    if (!conn) return;

    let newPre = conn.pre;
    let newPost = conn.post;

    // Skip grouping if either pre or post neuron is in an open group
    const preInOpenGroup = Array.from(openGroups).some((groupId) => neuronGroups[groupId]?.neurons.has(conn.pre));
    const postInOpenGroup = Array.from(openGroups).some((groupId) => neuronGroups[groupId]?.neurons.has(conn.post));

    if (!preInOpenGroup) {
      for (const groupId in neuronGroups) {
        const group = neuronGroups[groupId];
        if (group.neurons.has(conn.pre)) {
          newPre = groupId;
          break;
        }
      }
    }

    if (!postInOpenGroup) {
      for (const groupId in neuronGroups) {
        const group = neuronGroups[groupId];
        if (group.neurons.has(conn.post)) {
          newPost = groupId;
          break;
        }
      }
    }

    const newEdgeId = getSimpleEdgeId(newPre, newPost, conn.type);
    let newConn = groupedConnections.get(newEdgeId);

    if (!newConn) {
      newConn = { pre: newPre, post: newPost, type: conn.type, synapses: {}, annotations: [] };
      groupedConnections.set(newEdgeId, newConn);
    }

    // Sum synapses
    for (const key in conn.synapses) {
      newConn.synapses[key] = (newConn.synapses[key] || 0) + conn.synapses[key];
    }

    // Append annotations
    newConn.annotations = Array.from(new Set([...(newConn.annotations || []), ...(conn.annotations || [])]));

    const fullNewEdgeId = getEdgeId(newConn, includeAnnotations);
    if (fullNewEdgeId !== edgeId) {
      edgesToRemove.add(edgeId);
    }
  }

  for (const conn of groupedConnections.values()) {
    const fullNewEdgeId = getEdgeId(conn, includeAnnotations);
    edgesToAdd.add(fullNewEdgeId);
    connectionMap.set(fullNewEdgeId, conn);
  }

  for (const edgeId of edgesToRemove) {
    expectedEdges.delete(edgeId);
  }
  for (const edgeId of edgesToAdd) {
    expectedEdges.add(edgeId);
  }

  return expectedEdges;
};

const getSimpleEdgeId = (pre: string, post: string, type: string): string => {
  return `${pre}-${post}-${type}`;
};

// Apply split/join rules to nodes
const applySplitJoinRulesToNodes = (
  expectedNodes: Set<string>,
  toSplit: Set<string>,
  toJoin: Set<string>,
  includeNeighboringCellsAsIndividualCells: boolean,
  workspace: Workspace,
  visibleActiveNeurons: Set<string>,
) => {
  const nodesToRemove = new Set<string>();

  for (const nodeId of expectedNodes) {
    if (
      !visibleActiveNeurons.has(nodeId) &&
      shouldRemoveNode(nodeId, toSplit, toJoin, includeNeighboringCellsAsIndividualCells, workspace, visibleActiveNeurons)
    ) {
      nodesToRemove.add(nodeId);
    }
  }

  for (const nodeId of nodesToRemove) {
    expectedNodes.delete(nodeId);
  }

  return expectedNodes;
};

// Apply split/join rules to edges
const applySplitJoinRulesToEdges = (expectedEdges: Set<string>, expectedNodes: Set<string>, connectionMap: Map<string, Connection>) => {
  const edgesToRemove = new Set<string>();

  for (const edgeId of expectedEdges) {
    const conn = connectionMap.get(edgeId);

    if (conn) {
      const pre = conn.pre;
      const post = conn.post;

      if (shouldRemoveEdge(pre, post, expectedNodes)) {
        edgesToRemove.add(edgeId);
      }
    }
  }

  for (const edgeId of edgesToRemove) {
    expectedEdges.delete(edgeId);
  }

  return expectedEdges;
};

const shouldRemoveNode = (
  nodeId: string,
  toSplit: Set<string>,
  toJoin: Set<string>,
  includeNeighboringCellsAsIndividualCells: boolean,
  workspace: Workspace,
  visibleActiveNeurons: Set<string>,
): boolean => {
  const isActive = visibleActiveNeurons.has(nodeId);
  const isClass = isNeuronClass(nodeId, workspace);
  const isCell = isNeuronCell(nodeId, workspace);
  const neuron = workspace.availableNeurons[nodeId];

  const joinNclassSet = getNclassSet(toJoin, workspace);

  // 1. Remove nodes explicitly marked for removal
  if (toSplit.has(nodeId) || toJoin.has(nodeId)) {
    return true;
  }

  // 2. Remove class nodes if showing individual cells and the node is not active and it's not a join exception
  if (includeNeighboringCellsAsIndividualCells && isClass && !isActive && !joinNclassSet.has(nodeId)) {
    return true;
  }

  // 3. Remove individual cells if showing class nodes and the node is not active, it's not a split exception, and there's no active neuron in the same class
  const isAnyNeuronInClassActive =
    !includeNeighboringCellsAsIndividualCells && isCell && workspace.getNeuronCellsByClass(neuron.nclass).some((cellId) => visibleActiveNeurons.has(cellId));

  if (!includeNeighboringCellsAsIndividualCells && isCell && !isActive && !toSplit.has(neuron.nclass) && !isAnyNeuronInClassActive) {
    return true;
  }

  // 4. Remove class nodes if showing individual cells and there's an active cell in the same class
  const hasActiveCellInClass =
    !includeNeighboringCellsAsIndividualCells && isClass && workspace.getNeuronCellsByClass(nodeId).some((cellId) => visibleActiveNeurons.has(cellId));

  if (!includeNeighboringCellsAsIndividualCells && isClass && hasActiveCellInClass) {
    return true;
  }

  return false;
};

const shouldRemoveEdge = (pre: string, post: string, expectedNodes: Set<string>): boolean => {
  // This approach assumes that expectedNodes has already been processed to reflect all the necessary rules
  // (splitting, joining, and active neuron considerations).
  return !expectedNodes.has(pre) || !expectedNodes.has(post);
};

export const updateHighlighted = (cy, inputIds, selectedIds, legendHighlights) => {
  // Remove all highlights and return if nothing is selected and no legend item activated.
  cy.elements().removeClass("faded");
  if (selectedIds.length === 0 && legendHighlights.size === 0) {
    return;
  }

  // Use selected nodes as source if present, otherwise use input nodes.
  const sourceIds = selectedIds.length ? selectedIds : inputIds;
  let sourceNodes = cy.collection();

  for (const id of sourceIds) {
    const node = cy.getElementById(id);

    if (node.isParent()) {
      sourceNodes = sourceNodes.union(node.children());
    } else {
      sourceNodes = sourceNodes.union(node);
    }
  }

  // Filter network by edges, as set by legend.
  let edgeSel = "edge";
  legendHighlights.forEach((highlight, type) => {
    if (type === LegendType.Connection) {
      edgeSel += `[type="${highlight}"]`;
    } else if (type === LegendType.Annotation) {
      edgeSel += `.${highlight}`;
    }
  });

  let connectedNodes = sourceNodes.neighborhood(edgeSel).connectedNodes();

  // Filter network by nodes, as set by legend.
  legendHighlights.forEach((highlight, type) => {
    if (type === LegendType.Node) {
      connectedNodes = connectedNodes.filter(`[?${highlight}]`);
    }
  });

  // Filter to the neighborhood of the selected nodes.
  if (selectedIds.length > 0) {
    let allowedNodes = cy.collection();

    for (let i = 0; i < sourceNodes.length; i++) {
      const sourceNode = sourceNodes[i];
      const nodes = sourceNode.neighborhood(edgeSel).connectedNodes();

      if (i === 0) {
        allowedNodes = allowedNodes.union(nodes);
      } else {
        allowedNodes = allowedNodes.intersection(nodes);
      }
    }
    connectedNodes = connectedNodes.intersection(allowedNodes);
  }

  // Fade out any nodes and edges that were filtered out.
  let highlightedNodes = sourceNodes.union(connectedNodes);
  highlightedNodes = highlightedNodes.union(highlightedNodes.parents());

  let highlightedEdges = highlightedNodes.edgesWith(highlightedNodes);
  highlightedEdges = highlightedEdges.filter(edgeSel);

  cy.elements().not(highlightedNodes).not(highlightedEdges).addClass(FADED_CLASS);
};

export const updateParentNodes = (cy: Core, workspace: Workspace, openGroups: Set<string>) => {
  // Iterate through each neuron group in the workspace
  for (const [groupId, group] of Object.entries(workspace.neuronGroups)) {
    const groupIsOpen = openGroups.has(groupId);

    for (const neuronId of group.neurons) {
      const cyNode = cy.getElementById(neuronId);

      if (groupIsOpen) {
        // If the group is open, the neuron should have the group as its parent
        const parentId = cyNode.parent().first().id();

        if (parentId !== groupId) {
          cyNode.move({ parent: groupId });
        }
      }
    }
  }
};

export const updateParallelEdges = (cy: Core) => {
  // Remove 'parallel' class from all edges
  cy.edges().removeClass("parallel");

  // Add 'parallel' class to parallel edges
  cy.edges('[type = "electrical"]').parallelEdges().filter('[type = "chemical"]').addClass("parallel");
};
