import {useState, useEffect, useRef, useMemo} from "react";
import cytoscape, {type Core, type EventHandler} from "cytoscape";
import fcose from "cytoscape-fcose";
import dagre from "cytoscape-dagre";
import {useSelectedWorkspace} from "../../../hooks/useSelectedWorkspace";
import {type Connection, ConnectivityService} from "../../../rest";
import {GRAPH_STYLES} from "../../../theme/twoDStyles";
import {
    applyLayout, getHiddenNeuronsIn2D, getVisibleActiveNeuronsIn2D,
    refreshLayout,
    updateWorkspaceNeurons2DViewerData
} from "../../../helpers/twoD/twoDHelpers";
import {
    CHEMICAL_THRESHOLD,
    ELECTRICAL_THRESHOLD,
    GRAPH_LAYOUTS,
    type LegendType,
    INCLUDE_ANNOTATIONS,
    INCLUDE_NEIGHBORING_CELLS,
    INCLUDE_LABELS,
    INCLUDE_POST_EMBRYONIC, SELECTED_CLASS, HOVER_CLASS, FOCUS_CLASS,
} from "../../../settings/twoDSettings";
import TwoDMenu from "./TwoDMenu";
import TwoDLegend from "./TwoDLegend";
import {Box} from "@mui/material";
import {ColoringOptions, getColor} from "../../../helpers/twoD/coloringHelper";
import ContextMenu from "./ContextMenu";
import {computeGraphDifferences, updateHighlighted, updateParentNodes} from "../../../helpers/twoD/graphRendering.ts";
import {areSetsEqual} from "../../../helpers/utils.ts";
import {ViewerType} from "../../../models";
import {Visibility} from "../../../models/models.ts";

cytoscape.use(fcose);
cytoscape.use(dagre);

const TwoDViewer = () => {
    const workspace = useSelectedWorkspace();
    const cyContainer = useRef(null);
    const cyRef = useRef<Core | null>(null);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [layout, setLayout] = useState<string>(GRAPH_LAYOUTS.Concentric);
    const [coloringOption, setColoringOption] = useState<ColoringOptions>(ColoringOptions.CELL_TYPE);
    const [thresholdChemical, setThresholdChemical] = useState<number>(CHEMICAL_THRESHOLD);
    const [thresholdElectrical, setThresholdElectrical] = useState<number>(ELECTRICAL_THRESHOLD);
    const [includeNeighboringCells, setIncludeNeighboringCells] = useState<boolean>(INCLUDE_NEIGHBORING_CELLS);
    const [includeNeighboringCellsAsIndividualCells, setIncludeNeighboringCellsAsIndividualCells] = useState<boolean>(false);
    const [splitJoinState, setSplitJoinState] = useState<{ split: Set<string>; join: Set<string> }>({
        split: new Set(),
        join: new Set(),
    });
    const [includeAnnotations, setIncludeAnnotations] = useState<boolean>(INCLUDE_ANNOTATIONS);
    const [includeLabels, setIncludeLabels] = useState<boolean>(INCLUDE_LABELS);
    const [includePostEmbryonic, setIncludePostEmbryonic] = useState<boolean>(INCLUDE_POST_EMBRYONIC);
    const [mousePosition, setMousePosition] = useState<{ mouseX: number; mouseY: number } | null>(null);
    const [legendHighlights, setLegendHighlights] = useState<Map<LegendType, string>>(new Map());
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

    const {visibleActiveNeurons, hiddenNeurons} = useMemo(() => {
        const visibleActiveNeurons = getVisibleActiveNeuronsIn2D(workspace);
        const hiddenNeurons = getHiddenNeuronsIn2D(workspace);

        return {visibleActiveNeurons, hiddenNeurons};
    }, [
        // Create a string of visibility values for all available neurons to track changes
        Object.keys(workspace.availableNeurons)
            .map(neuronId => workspace.availableNeurons[neuronId]?.viewerData[ViewerType.Graph]?.visibility || '')
            .join(','),
        workspace.activeNeurons
    ]);


    const handleContextMenuClose = () => {
        setMousePosition(null);
    };

    // Initialize and update Cytoscape
    useEffect(() => {
        if (!cyContainer.current) return;

        const cy = cytoscape({
            container: cyContainer.current,
            style: GRAPH_STYLES,
            layout: {
                name: layout,
            },
        });
        cyRef.current = cy;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === cyContainer.current) {
                    refreshLayout(cy);
                }
            }
        });
        resizeObserver.observe(cyContainer.current);

        cyContainer.current.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });

        return () => {
            resizeObserver.disconnect();
            cy.destroy();
        };
    }, []);

    // Fetch and process connections data
    useEffect(() => {
        if (!workspace) return;

        // Convert visibleActiveNeurons and activeDatasets to comma-separated strings
        const cells = Array.from(visibleActiveNeurons || []).join(",");
        const datasetIds = Object.values(workspace.activeDatasets)
            .map((dataset) => dataset.id)
            .join(",");
        const datasetType = Object.values(workspace.activeDatasets)
            .map((dataset) => dataset.type)
            .join(",");

        ConnectivityService.getConnections({
            cells,
            datasetIds,
            datasetType,
            thresholdChemical: thresholdChemical,
            thresholdElectrical: thresholdElectrical,
            includeNeighboringCells: includeNeighboringCells,
            includeAnnotations: includeAnnotations,
        })
            .then((connections) => {
                setConnections(connections);
            })
            .catch((error) => {
                console.error("Failed to fetch connections:", error);
            });
    }, [
        workspace.activeDatasets,
        visibleActiveNeurons,
        includeNeighboringCells,
        includeNeighboringCellsAsIndividualCells,
        includeAnnotations,
        thresholdElectrical,
        thresholdChemical,
    ]);

    // Update graph when connections change
    useEffect(() => {
        if (cyRef.current) {
            updateGraphElements(cyRef.current, connections);
        }
    }, [connections, hiddenNeurons, workspace.neuronGroups, includePostEmbryonic, splitJoinState, openGroups]);


    useEffect(() => {
        if (cyRef.current) {
            updateNodeColors();
        }
    }, [coloringOption]);

    useEffect(() => {
        if (cyRef.current) {
            updateHighlighted(cyRef.current, Array.from(visibleActiveNeurons), Array.from(workspace.selectedNeurons), legendHighlights, workspace.neuronGroups);
        }
    }, [legendHighlights, workspace.selectedNeurons, workspace.neuronGroups]);

    // Update layout when layout setting changes
    useEffect(() => {
        updateLayout();
    }, [layout, connections]);

    // Add event listener for node clicks to toggle neuron selection and right-click context menu
    useEffect(() => {
        if (!cyRef.current) return;

        const cy = cyRef.current;

        const handleNodeClick = (event) => {
            const neuronId = event.target.id();
            const isSelected = workspace.selectedNeurons.has(neuronId);
            workspace.toggleSelectedNeuron(neuronId);

            if (isSelected) {
                event.target.removeClass(SELECTED_CLASS);
            } else {
                event.target.addClass(SELECTED_CLASS);
            }
        };

        const handleBackgroundClick = (event) => {
            if (event.target === cy) {
                workspace.clearSelectedNeurons();
                cy.nodes(`.${SELECTED_CLASS}`).removeClass(SELECTED_CLASS);

                setLegendHighlights(new Map()); // Reset legend highlights
            }
        };

        const handleContextMenu: EventHandler = (event) => {
            event.preventDefault();

            const cyEvent = event as any; // Cast to any to access originalEvent
            const originalEvent = cyEvent.originalEvent as MouseEvent;

            if (workspace.selectedNeurons.size > 0) {
                setMousePosition({
                    mouseX: originalEvent.clientX,
                    mouseY: originalEvent.clientY,
                });
            } else {
                setMousePosition(null);
            }
        };

        const handleEdgeMouseOver = (event) => {
            event.target.addClass(HOVER_CLASS);
        };

        const handleEdgeMouseOut = (event) => {
            event.target.removeClass(HOVER_CLASS);
            event.target.removeClass(FOCUS_CLASS);
        };

        const handleEdgeFocus = (event) => {
            event.target.addClass(FOCUS_CLASS);
        };

        cy.on("tap", "node", handleNodeClick);
        cy.on("tap", handleBackgroundClick);
        cy.on("cxttap", handleContextMenu);
        cy.on("mouseover", "edge", handleEdgeMouseOver);
        cy.on("mouseout", "edge", handleEdgeMouseOut);
        cy.on("tapstart", "edge", handleEdgeFocus);

        return () => {
            cy.off("tap", "node", handleNodeClick);
            cy.off("tap", handleBackgroundClick);
            cy.off("cxttap", handleContextMenu);
            cy.off("mouseover", "edge", handleEdgeMouseOver);
            cy.off("mouseout", "edge", handleEdgeMouseOut);
            cy.off("tapstart", "edge", handleEdgeFocus);
        };
    }, [workspace, connections]);

    // Update active neurons when split or join state changes
    useEffect(() => {
        const nextActiveNeurons = new Set(workspace.activeNeurons);

        splitJoinState.split.forEach((neuronId) => {
            if (workspace.activeNeurons.has(neuronId)) {
                nextActiveNeurons.delete(neuronId);
                Object.values(workspace.availableNeurons).forEach((neuron) => {
                    if (neuron.nclass === neuronId && neuron.name !== neuron.nclass) {
                        nextActiveNeurons.add(neuron.name);
                    }
                });
            }
        });

        splitJoinState.join.forEach((neuronId) => {
            const neuronClass = workspace.availableNeurons[neuronId].nclass;
            if (workspace.activeNeurons.has(neuronId)) {
                nextActiveNeurons.delete(neuronId);
                Object.values(workspace.availableNeurons).forEach((neuron) => {
                    if (neuron.nclass === neuronClass) {
                        nextActiveNeurons.delete(neuron.name);
                    }
                });
                nextActiveNeurons.add(neuronClass);
            }
        });

        if (!areSetsEqual(nextActiveNeurons, workspace.activeNeurons)) {
            workspace.setActiveNeurons(nextActiveNeurons);
        }
    }, [splitJoinState, workspace.id]);

    // Effect to handle includeLabels state
    useEffect(() => {
        if (!cyRef.current) return;

        cyRef.current.batch(() => {
            cyRef.current.edges().forEach((edge) => {
                if (includeLabels) {
                    edge.addClass("showEdgeLabel");
                } else {
                    edge.removeClass("showEdgeLabel");
                }
            });
        });
    }, [includeLabels]);

    const updateGraphElements = (cy: Core, connections: Connection[]) => {
        const {nodesToAdd, nodesToRemove, edgesToAdd, edgesToRemove} = computeGraphDifferences(
            cy,
            connections,
            workspace,
            splitJoinState,
            hiddenNeurons,
            openGroups,
            includeNeighboringCellsAsIndividualCells,
            includeAnnotations,
            includePostEmbryonic,
        );

        cy.batch(() => {
            cy.add(nodesToAdd);
            cy.add(edgesToAdd);
            updateParentNodes(cy, workspace, openGroups)
            cy.remove(nodesToRemove);
            cy.remove(edgesToRemove);
        });

        updateNodeColors();
        updateHighlighted(cy, Array.from(visibleActiveNeurons), Array.from(workspace.selectedNeurons),
            legendHighlights, workspace.neuronGroups);
    };

    const updateLayout = () => {
        if (cyRef.current) {
            const cy = cyRef.current;
            applyLayout(cy, layout);
            updateWorkspaceNeurons2DViewerData(workspace, cy);
        }
    };

    const updateNodeColors = () => {
        if (!cyRef.current) {
            return;
        }
        cyRef.current.nodes().forEach((node) => {
            const nodeId = node.id();
            const group = workspace.neuronGroups[nodeId];

            let colors = [];

            if (group) {
                // If the node is a group, collect colors from all neurons in the group
                group.neurons.forEach((neuronId) => {
                    const neuron = workspace.availableNeurons[neuronId];
                    if (neuron) {
                        colors = colors.concat(getColor(neuron, coloringOption));
                    }
                });

                // Ensure unique colors are used
                const uniqueColors = [...new Set(colors)];
                colors = uniqueColors;
            } else {
                const neuron = workspace.availableNeurons[nodeId];
                if (neuron == null) {
                    console.error(`Neuron ${nodeId} not found in the active datasets`);
                    return;
                }
                colors = getColor(neuron, coloringOption);
            }

            colors.forEach((color, index) => {
                node.style(`pie-${index + 1}-background-color`, color);
                node.style(`pie-${index + 1}-background-size`, 100 / colors.length); // Equal size for each slice
            });
            node.style("pie-background-opacity", 1);
        });
    };

    return (
        <Box sx={{position: "relative", display: "flex", width: "100%", height: "100%"}}>
            <TwoDMenu
                cy={cyRef.current}
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
                includeLabels={includeLabels}
                setIncludeLabels={setIncludeLabels}
                includePostEmbryonic={includePostEmbryonic}
                setIncludePostEmbryonic={setIncludePostEmbryonic}
            />
            <Box sx={{position: "absolute", top: 0, right: 0, zIndex: 1000}}>
                <TwoDLegend
                    coloringOption={coloringOption}
                    legendHighlights={legendHighlights}
                    setLegendHighlights={setLegendHighlights}
                    includeAnnotations={includeAnnotations}
                />
            </Box>
            <div ref={cyContainer} style={{width: "100%", height: "100%"}}/>
            <ContextMenu
                open={Boolean(mousePosition)}
                onClose={handleContextMenuClose}
                position={mousePosition}
                setSplitJoinState={setSplitJoinState}
                openGroups={openGroups}
                setOpenGroups={setOpenGroups}
                cy={cyRef.current}
            />
        </Box>
    );
};

export default TwoDViewer;
