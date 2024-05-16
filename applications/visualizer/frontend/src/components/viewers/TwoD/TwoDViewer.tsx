import {useEffect, useRef, useState} from 'react';
import cytoscape from 'cytoscape';
import {useSelectedWorkspace} from "../../../hooks/useSelectedWorkspace.ts";
import {ConnectivityService} from "../../../rest";

const LAYOUT = 'cose'
const TwoDViewer = () => {
    const workspace = useSelectedWorkspace()
    const cyContainer = useRef(null);
    const cyRef = useRef(null);
    const [connections, setConnections] = useState([]);

    const updateGraphElements = (cy, connections) => {
        const nodes = new Set();
        const edges = [];

        connections.forEach(conn => {
            nodes.add(conn.pre);
            nodes.add(conn.post);
            edges.push({
                group: 'edges',
                data: {
                    id: `${conn.pre}-${conn.post}`,
                    source: conn.pre,
                    target: conn.post,
                    label: conn.type
                },
                classes: conn.type
            });
        });

        const elements = Array.from(nodes).map(node => ({
            group: 'nodes',
            data: {id: node, label: node}
        })).concat(edges);

        cy.elements().remove(); // Remove all existing elements
        cy.add(elements);       // Add new elements
        cy.layout({
            name: LAYOUT,
        }).run();
    };

    // Fetch and process connections data
    useEffect(() => {
        if (!workspace) return;

        // Convert activeNeurons and activeDatasets to comma-separated strings
        const cells = Object.values(workspace.activeNeurons).map(neuron => neuron.name).join(',');
        const datasetIds = Object.values(workspace.activeDatasets).map(dataset => dataset.id).join(',');
        const datasetType = Object.values(workspace.activeDatasets).map(dataset => dataset.type).join(',');

        ConnectivityService.getConnections({
            cells,
            datasetIds,
            datasetType,
            thresholdChemical: 1,
            thresholdElectrical: 1,
            includeNeighboringCells: true,
            includeAnnotations: false,
        }).then(connections => {
            setConnections(connections);
        }).catch(error => {
            console.error("Failed to fetch connections:", error);
        });
    }, [workspace]);

    // Update graph when connections change
    useEffect(() => {
        if (cyRef.current) {
            updateGraphElements(cyRef.current, connections);
        }
    }, [connections]);


    // Initialize and update Cytoscape
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
                        'color': '#fff',
                        'text-outline-color': '#000',
                        'text-outline-width': 2,
                        'text-valign': 'center',
                        'text-halign': 'center',
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
                },
                {
                    selector: '.chemical',
                    style: {'line-color': 'blue'}
                },
                {
                    selector: '.electrical',
                    style: {'line-color': 'red'}
                }
            ],
            layout: {
                name: LAYOUT,
            }
        });
        cyRef.current = cy;

        return () => {
            cy.destroy();
        };
    }, []);

    return <div ref={cyContainer} style={{width: '100%', height: '100%'}}/>;
};

export default TwoDViewer;