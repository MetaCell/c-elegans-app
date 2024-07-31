import type {Core, ElementDefinition, CollectionReturnValue} from 'cytoscape';
import {
    createEdge,
    createNode,
    extractNeuronAttributes, getEdgeId,
    getNclassSet,
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
    hiddenNodes: Set<string>,
    includeNeighboringCellsAsIndividualCells: boolean,
    includeAnnotations: boolean,
    includePostEmbryonic: boolean
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


    // Create a map of connections by edgeId
    const connectionMap = new Map<string, Connection>();
    connections.forEach(conn => {
        const edgeId = getEdgeId(conn, includeAnnotations);
        connectionMap.set(edgeId, conn);
    });

    // Compute expected nodes based on workspace.activeNeurons and connections
    const filteredActiveNeurons = Array.from(workspace.activeNeurons).filter((neuronId: string) => {
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
        return !(workspace.activeNeurons.has(neuronId) && workspace.activeNeurons.has(nclass));
    });

    // Add active neurons to expected nodes
    for (const neuronId of filteredActiveNeurons) {
        expectedNodes.add(neuronId);
    }

    // Add nodes from connections to expected nodes
    for (const conn of connections) {
        const preNeuron = workspace.availableNeurons[conn.pre];
        const postNeuron = workspace.availableNeurons[conn.post];


        if (!hiddenNodes.has(conn.pre) && !hiddenNodes.has(conn.post) &&
            (includePostEmbryonic || (preNeuron?.embryonic && postNeuron?.embryonic))) {
            expectedNodes.add(conn.post);
            expectedNodes.add(conn.pre);

            const edgeId = getEdgeId(conn, includeAnnotations);
            expectedEdges.add(edgeId);
        }
    }

    // Apply split and join rules to expected nodes and edges
    expectedNodes = applySplitJoinRulesToNodes(expectedNodes, splitJoinState.split, splitJoinState.join, includeNeighboringCellsAsIndividualCells, workspace);
    expectedEdges = applySplitJoinRulesToEdges(expectedEdges, splitJoinState.split, splitJoinState.join, includeNeighboringCellsAsIndividualCells, workspace, expectedNodes, connectionMap);

    // Replace individual neurons and edges with groups if necessary
    replaceNodesWithGroups(expectedNodes, workspace.neuronGroups);
    replaceEdgesWithGroups(expectedEdges, workspace.neuronGroups, connectionMap, includeAnnotations);


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
            const conn = connectionMap.get(edgeId);
            if (conn) {
                edgesToAdd.push(createEdge(edgeId, conn, workspace, includeAnnotations));
            }
        }
    }

    for (const edgeId of currentEdges) {
        if (!expectedEdges.has(edgeId)) {
            edgesToRemove.merge(cy.getElementById(edgeId));
        }
    }

    // Return the differences to be applied to the Cytoscape instance
    return {nodesToAdd, nodesToRemove, edgesToAdd, edgesToRemove};
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
const replaceEdgesWithGroups = (
    expectedEdges: Set<string>,
    neuronGroups: Record<string, NeuronGroup>,
    connectionMap: Map<string, Connection>,
    includeAnnotations: boolean
) => {
    const edgesToAdd = new Set<string>();
    const edgesToRemove = new Set<string>();
    const groupedConnections: Map<string, Connection> = new Map();

    expectedEdges.forEach(edgeId => {
        const conn = connectionMap.get(edgeId);
        if (!conn) return;

        let newPre = conn.pre;
        let newPost = conn.post;

        for (const groupId in neuronGroups) {
            const group = neuronGroups[groupId];
            if (group.neurons.has(conn.pre)) {
                newPre = groupId;
            }
            if (group.neurons.has(conn.post)) {
                newPost = groupId;
            }
        }

        const newEdgeId = getSimpleEdgeId(newPre, newPost, conn.type);
        let newConn = groupedConnections.get(newEdgeId);

        if (!newConn) {
            newConn = {pre: newPre, post: newPost, type: conn.type, synapses: {}, annotations: []};
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
    });

    groupedConnections.forEach((conn, newEdgeId) => {
        const fullNewEdgeId = getEdgeId(conn, includeAnnotations);
        edgesToAdd.add(fullNewEdgeId);
        connectionMap.set(fullNewEdgeId, conn);
    });

    edgesToRemove.forEach(edgeId => expectedEdges.delete(edgeId));
    edgesToAdd.forEach(edgeId => expectedEdges.add(edgeId));
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
    expectedNodes: Set<string>,
    connectionMap: Map<string, Connection>
) => {
    const edgesToRemove = new Set<string>();

    expectedEdges.forEach(edgeId => {
        const conn = connectionMap.get(edgeId);

        if (conn) {
            const pre = conn.pre;
            const post = conn.post;

            if (shouldRemoveEdge(pre, post, expectedNodes)) {
                edgesToRemove.add(edgeId);
            }
        }
    });

    edgesToRemove.forEach(edgeId => expectedEdges.delete(edgeId));

    return expectedEdges;
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
