import type {Core, ElementDefinition, CollectionReturnValue} from 'cytoscape';
import {
    CONNECTION_SEPARATOR,
    createEdge,
    createNode,
    extractNeuronAttributes,
    getEdgeId, getNclassSet,
    isNeuronCell,
    isNeuronClass
} from './twoDHelpers';
import {NeuronGroup, Workspace} from "../../models";
import {Connection} from "../../rest";


export const computeGraphDifferences = (
    cy: Core,
    connections: Connection[],
    workspace: Workspace,
    splitJoinState: { split: Set<string>; join: Set<string> },
    includeNeighboringCellsAsIndividualCells: boolean,
    hiddenNodes: Set<string>
) => {
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

    // Compute expected nodes based on workspace.activeNeurons and connections
    const filteredActiveNeurons = Array.from(workspace.activeNeurons).filter((neuronId: string) => {
        const neuron = workspace.availableNeurons[neuronId];
        if (!neuron || hiddenNodes.has(neuronId)) {
            return false;
        }
        const nclass = neuron.nclass;
        if (neuronId === nclass) {
            return true;
        }
        return !(workspace.activeNeurons.has(neuronId) && workspace.activeNeurons.has(nclass));
    });

    // Add active neurons to expected nodes
    for (const neuronId of filteredActiveNeurons) {
        expectedNodes.add(neuronId);
    }

    // Add nodes from connections to expected nodes
    for (const conn of connections) {
        if (!hiddenNodes.has(conn.pre)) {
            expectedNodes.add(conn.pre);
        }
        if (!hiddenNodes.has(conn.post)) {
            expectedNodes.add(conn.post);
        }

        if (!hiddenNodes.has(conn.pre) && !hiddenNodes.has(conn.post)) {
            const edgeId = getEdgeId(conn.pre, conn.post, conn.type);
            expectedEdges.add(edgeId);
        }
    }

    // Apply split and join rules to expected nodes and edges
    expectedNodes = applySplitJoinRulesToNodes(expectedNodes, splitJoinState.split, splitJoinState.join, includeNeighboringCellsAsIndividualCells, workspace);
    expectedEdges = applySplitJoinRulesToEdges(expectedEdges, splitJoinState.split, splitJoinState.join, includeNeighboringCellsAsIndividualCells, workspace, expectedNodes);

    // Replace individual neurons and edges with groups if necessary
    replaceNodesWithGroups(expectedNodes, workspace.neuronGroups);
    replaceEdgesWithGroups(expectedEdges, workspace.neuronGroups);

    // Determine nodes to add and remove
 // Determine nodes to add and remove
    for (const nodeId of expectedNodes) {
        if (!currentNodes.has(nodeId)) {
            const group = workspace.neuronGroups[nodeId];
            if (group) {
                // If the node is a group, extract attributes from all neurons in the group
                const attributes = new Set<string>();
                group.neurons.forEach((neuronId) => {
                    const neuron = workspace.availableNeurons[neuronId];
                    extractNeuronAttributes(neuron).forEach(attr => attributes.add(attr));
                });
                nodesToAdd.push(createNode(nodeId, workspace.selectedNeurons.has(nodeId), Array.from(attributes)));
            } else {
                const neuron = workspace.availableNeurons[nodeId];
                const attributes = extractNeuronAttributes(neuron);
                nodesToAdd.push(createNode(nodeId, workspace.selectedNeurons.has(nodeId), attributes));
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
            const [pre, post, type] = edgeId.split(CONNECTION_SEPARATOR);
            edgesToAdd.push(createEdge({ pre, post, type }));
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
const replaceNodesWithGroups = (expectedNodes: Set<string>, neuronGroups: Record<string, NeuronGroup>) => {
    const nodesToAdd = new Set<string>();
    const nodesToRemove = new Set<string>();

    expectedNodes.forEach(nodeId => {
        for (const groupId in neuronGroups) {
            const group = neuronGroups[groupId];
            if (group.neurons.has(nodeId)) {
                nodesToAdd.add(groupId);
                nodesToRemove.add(nodeId);
            }
        }
    });

    nodesToRemove.forEach(nodeId => expectedNodes.delete(nodeId));
    nodesToAdd.forEach(nodeId => expectedNodes.add(nodeId));
};

// Replace edges involving individual neurons with edges involving group nodes
const replaceEdgesWithGroups = (expectedEdges: Set<string>, neuronGroups: Record<string, NeuronGroup>) => {
    const edgesToAdd = new Set<string>();
    const edgesToRemove = new Set<string>();

    expectedEdges.forEach(edgeId => {
        const [pre, post, type] = edgeId.split(CONNECTION_SEPARATOR);

        let newPre = pre;
        let newPost = post;

        for (const groupId in neuronGroups) {
            const group = neuronGroups[groupId];
            if (group.neurons.has(pre)) {
                newPre = groupId;
            }
            if (group.neurons.has(post)) {
                newPost = groupId;
            }
        }

        const newEdgeId = getEdgeId(newPre, newPost, type);
        if (newEdgeId !== edgeId) {
            edgesToAdd.add(newEdgeId);
            edgesToRemove.add(edgeId);
        }
    });

    edgesToRemove.forEach(edgeId => expectedEdges.delete(edgeId));
    edgesToAdd.forEach(edgeId => expectedEdges.add(edgeId));
};

// Apply split/join rules to nodes
const applySplitJoinRulesToNodes = (
  expectedNodes: Set<string>,
  toSplit: Set<string>,
  toJoin: Set<string>,
  includeNeighboringCellsAsIndividualCells: boolean,
  workspace: Workspace
) => {
  const nodesToRemove = new Set<string>();

  expectedNodes.forEach(nodeId => {
    if (!workspace.activeNeurons.has(nodeId) && shouldRemoveNode(nodeId, toSplit, toJoin, includeNeighboringCellsAsIndividualCells, workspace)) {
      nodesToRemove.add(nodeId);
    }
  });

  nodesToRemove.forEach(nodeId => expectedNodes.delete(nodeId));

  return expectedNodes
};


// Apply split/join rules to edges
const applySplitJoinRulesToEdges = (
  expectedEdges: Set<string>,
  toSplit: Set<string>,
  toJoin: Set<string>,
  includeNeighboringCellsAsIndividualCells: boolean,
  workspace: Workspace,
  expectedNodes: Set<string>
) => {
  const edgesToRemove = new Set<string>();

  expectedEdges.forEach(edgeId => {
    const [pre, post, type] = edgeId.split(CONNECTION_SEPARATOR);

    if (shouldRemoveEdge(pre, post, expectedNodes)) {
      edgesToRemove.add(edgeId);
    }
  });

  edgesToRemove.forEach(edgeId => expectedEdges.delete(edgeId));

  return expectedEdges
};


const shouldRemoveNode = (
  nodeId: string,
  toSplit: Set<string>,
  toJoin: Set<string>,
  includeNeighboringCellsAsIndividualCells: boolean,
  workspace: Workspace
): boolean => {
  const isActive = workspace.activeNeurons.has(nodeId);
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

  // 3. Remove individual cells if showing class nodes and the node is not active and it's not a split exception
  if (!includeNeighboringCellsAsIndividualCells && isCell && !isActive && !toSplit.has(neuron.nclass)) {
    return true;
  }

  return false;
};


const shouldRemoveEdge = (
  pre: string,
  post: string,
  expectedNodes: Set<string>
): boolean => {
  // This approach assumes that expectedNodes has already been processed to reflect all the necessary rules
    // (splitting, joining, and active neuron considerations).
  return !expectedNodes.has(pre) || !expectedNodes.has(post);
};
