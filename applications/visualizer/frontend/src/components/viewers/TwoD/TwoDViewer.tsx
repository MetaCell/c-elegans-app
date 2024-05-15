import {useEffect, useRef} from 'react';
import cytoscape from 'cytoscape';
import {useSelectedWorkspace} from "../../../hooks/useSelectedWorkspace.ts";
import {Neuron} from "../../../rest";

const TwoDViewer = () => {
    const workspace = useSelectedWorkspace()
    const cyContainer = useRef(null);
    const cyRef = useRef(null);

    const updateGraphElements = (cy, workspace) => {
        if (!workspace) return;

        // Generate nodes and edges based on workspace.activeNeurons
        const nodes = Object.values(workspace.activeNeurons).map((neuron: Neuron) => ({
            group: 'nodes',
            data: {id: neuron.name, label: neuron.name}
        }));

        // TODO: Mocked edges, replace with real data later
        const edges = [];
        if (nodes.length > 1) {
            for (let i = 0; i < nodes.length - 1; i++) {
                edges.push({
                    group: 'edges',
                    data: {
                        id: `e${nodes[i].data.id}-${nodes[i + 1].data.id}`,
                        source: nodes[i].data.id,
                        target: nodes[i + 1].data.id
                    }
                });
            }
        }

        const elements = [...nodes, ...edges];
        cy.elements().remove(); // Remove all existing elements
        cy.add(elements);       // Add new elements
        cy.layout({             // Re-run layout
            name: 'grid',
            rows: 1
        }).run();
    };

    // Initialize Cytoscape only once
    useEffect(() => {
        if (!cyContainer.current) return;

        const cy = cytoscape({
            container: cyContainer.current,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#666',
                        'label': 'data(label)',
                        'color': '#000',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'width': '45px',
                        'height': '45px',
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
                    }
                }
            ],
            layout: {
                name: 'grid',
                rows: 1
            }
        });
        cyRef.current = cy;
        updateGraphElements(cy, workspace); // Initialize with existing workspace data

        return () => {
            cy.destroy();
        };
    }, []);

    // Update graph when workspace changes
    useEffect(() => {
        if (!cyRef.current || !workspace) return;
        updateGraphElements(cyRef.current, workspace);
    }, [workspace]);

    return <div ref={cyContainer} style={{width: '100%', height: '100%'}}/>;
};

export default TwoDViewer;