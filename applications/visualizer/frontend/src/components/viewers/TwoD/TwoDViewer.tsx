import cytoscape, {Core} from 'cytoscape';
import fcose from 'cytoscape-fcose';
import dagre from 'cytoscape-dagre';
import {useEffect, useRef, useState} from 'react';
import {useSelectedWorkspace} from "../../../hooks/useSelectedWorkspace.ts";
import {Connection, ConnectivityService} from "../../../rest";
import {GRAPH_STYLES} from "../../../theme/twoDStyles.ts";
import {applyLayout, createEdge, createNode, filterConnections} from "../../../helpers/twoD/twoDHelpers.ts";
import {
    CHEMICAL_THRESHOLD,
    ELECTRICAL_THRESHOLD,
    GRAPH_LAYOUTS,
    INCLUDE_ANNOTATIONS,
    INCLUDE_NEIGHBORING_CELLS
} from "../../../settings/twoDSettings.tsx";
import TwoDMenu from "./TwoDMenu.tsx";
import TwoDLegend from "./TwoDLegend.tsx";
import {Box} from "@mui/material";
import {ColoringOptions, getColoringStrategy} from "../../../helpers/twoD/coloringStrategy/ColoringStrategy.ts";

cytoscape.use(fcose);
cytoscape.use(dagre);


const TwoDViewer = () => {
    const workspace = useSelectedWorkspace()
    const cyContainer = useRef(null);
    const cyRef = useRef<Core | null>(null);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [layout, setLayout] = useState<string>(GRAPH_LAYOUTS.Concentric)
    const [coloringOption, setColoringOption] = useState<ColoringOptions>(ColoringOptions.CELL_TYPE)
    let coloringStrategy = getColoringStrategy(coloringOption)
    const [thresholdChemical, setThresholdChemical] = useState<number>(CHEMICAL_THRESHOLD);
    const [thresholdElectrical, setThresholdElectrical] = useState<number>(ELECTRICAL_THRESHOLD);
    const [includeNeighboringCells, setIncludeNeighboringCells] = useState<boolean>(INCLUDE_NEIGHBORING_CELLS);
    const [includeNeighboringCellsAsIndividualCells, setIncludeNeighboringCellsAsIndividualCells] = useState<boolean>(false);
    const [includeAnnotations, setIncludeAnnotations] = useState<boolean>(INCLUDE_ANNOTATIONS);


    // Initialize and update Cytoscape
    useEffect(() => {
        if (!cyContainer.current) return;

        const cy = cytoscape({
            container: cyContainer.current,
            style: GRAPH_STYLES,
            layout: {
                name: layout,
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
        const cells = Array.from(workspace.activeNeurons).join(',');
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
            const filteredConnections = filterConnections(connections, workspace, includeNeighboringCells, includeNeighboringCellsAsIndividualCells)
            setConnections(filteredConnections);
        }).catch(error => {
            console.error("Failed to fetch connections:", error);
        });
    }, [workspace, includeNeighboringCells, includeNeighboringCellsAsIndividualCells, includeAnnotations, thresholdElectrical, thresholdChemical]);

    // Update graph when connections change
    useEffect(() => {
        if (cyRef.current) {
            updateGraphElements(cyRef.current, connections);
        }
    }, [connections]);

    useEffect(() => {
        if (cyRef.current) {
            updateNodeColors();
        }
    }, [coloringOption]);

    // Update layout when layout setting changes
    useEffect(() => {
        updateLayout();
    }, [layout]);


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
        updateNodeColors()
    };

    const updateLayout = () => {
        if (cyRef.current) {
            applyLayout(cyRef, layout);
        }
    };

    const updateNodeColors = () => {
        if (cyRef.current) {
            cyRef.current.nodes().forEach(node => {
                const neuronId = node.id();
                const neuron = workspace.availableNeurons[neuronId]
                if (neuron == null) {
                    console.error(`neuron ${neuronId} not found in the active datasets`)
                    return
                }
                const colors = coloringStrategy.getColors(neuron);
                colors.forEach((color, index) => {
                    node.style(`pie-${index + 1}-background-color`, color);
                    node.style(`pie-${index + 1}-background-size`, 100 / colors.length); // Equal size for each slice
                });
                node.style('pie-background-opacity', 1);
            });
        }

    };

    return <Box sx={{position: 'relative', display: 'flex', width: '100%', height: '100%'}}>
        <TwoDMenu
            cyRef={cyRef}
            layout={layout}
            onLayoutChange={setLayout}
            coloringOption={coloringOption}
            onColoringOptionChange={setColoringOption}
            includeNeighboringCells={includeNeighboringCells}
            setIncludeNeighboringCells={setIncludeNeighboringCells}
            includeNeighboringCellsAsIndividualCells={includeNeighboringCellsAsIndividualCells}
            setIncludeNeighboringCellsAsIndividualCells={setIncludeNeighboringCellsAsIndividualCells}
            includeAnnotations={includeAnnotations}
            setIncludeAnnotations={setIncludeAnnotations}
            thresholdChemical={thresholdChemical}
            setThresholdChemical={setThresholdChemical}
            thresholdElectrical={thresholdElectrical}
            setThresholdElectrical={setThresholdElectrical}

        />
        <Box sx={{position: 'absolute', top: 0, right: 0, zIndex: 1000}}>
            <TwoDLegend
                coloringStrategy={coloringStrategy}
                onClick={(type, name) => console.log(`${type} clicked: ${name}`)}
            />
        </Box>

        <div ref={cyContainer} style={{width: '100%', height: '100%'}}/>
    </Box>
};

export default TwoDViewer;