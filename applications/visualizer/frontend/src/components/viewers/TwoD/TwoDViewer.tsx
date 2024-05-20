import {useEffect, useRef, useState} from 'react';
import cytoscape from 'cytoscape';
import {useSelectedWorkspace} from "../../../hooks/useSelectedWorkspace.ts";
import {Connection, ConnectivityService} from "../../../rest";
import {GRAPH_STYLES} from "../../../theme/twoDStyles.ts";
import {createEdge, createNode} from "../../../helpers/twoDHelpers.ts";
import {
    CHEMICAL_THRESHOLD,
    ELECTRICAL_THRESHOLD,
    INCLUDE_ANNOTATIONS,
    INCLUDE_NEIGHBORING_CELLS
} from "../../../settings/twoDSettings.ts";

const LAYOUT = 'cose'
const TwoDViewer = () => {
    const workspace = useSelectedWorkspace()
    const cyContainer = useRef(null);
    const cyRef = useRef(null);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [thresholdChemical, setThresholdChemical] = useState<number>(CHEMICAL_THRESHOLD);
    const [thresholdElectrical, setThresholdElectrical] = useState<number>(ELECTRICAL_THRESHOLD);
    const [includeNeighboringCells, setIncludeNeighboringCells] = useState<boolean>(INCLUDE_NEIGHBORING_CELLS);
    const [includeAnnotations, setIncludeAnnotations] = useState<boolean>(INCLUDE_ANNOTATIONS);

    // Initialize and update Cytoscape
    useEffect(() => {
        if (!cyContainer.current) return;

        const cy = cytoscape({
            container: cyContainer.current,
            style: GRAPH_STYLES,
            layout: {
                name: LAYOUT,
            }
        });
        cyRef.current = cy;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === cyContainer.current) {
                    updateLayout();
                }
            }
        });
        resizeObserver.observe(cyContainer.current);


        return () => {
            resizeObserver.disconnect();
            cy.destroy();
        };
    }, []);

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
            thresholdChemical: thresholdChemical,
            thresholdElectrical: thresholdElectrical,
            includeNeighboringCells: includeNeighboringCells,
            includeAnnotations: includeAnnotations,
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

    const updateGraphElements = (cy, connections) => {
        const nodes = new Set<string>();
        const edges = [];

        connections.forEach(conn => {
            nodes.add(conn.pre);
            nodes.add(conn.post);
            edges.push(createEdge(conn));
        });

        const elements = Array.from(nodes).map((nodeId: string) => createNode(nodeId)).concat(edges);

        cy.elements().remove(); // Remove all existing elements
        cy.add(elements);       // Add new elements
        updateLayout()
    };

    const updateLayout = () => {
        if (cyRef.current) {
            cyRef.current.layout({
                name: LAYOUT,
                fit: true,
                animate: false,
            }).run();
        }
    };

    return <div ref={cyContainer} style={{width: '100%', height: '100%'}}/>;
};

export default TwoDViewer;