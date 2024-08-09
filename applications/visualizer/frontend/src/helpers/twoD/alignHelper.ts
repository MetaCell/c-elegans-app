import {Workspace, ViewerType, Alignment} from "../../models";
import {Core} from "cytoscape";

export const alignNeurons = (alignment: Alignment, selectedNeurons: string[], cy: Core) => {

    // Get Cytoscape elements for selected neurons
    const cyNodes = selectedNeurons.map(neuronId => cy.getElementById(neuronId));

    if (cyNodes.some(node => !node || !node.position())) {
        console.error("Some selected neurons do not have positions set in Cytoscape.");
        return;
    }

    const xPositions = cyNodes.map(node => node.position('x'));
    const yPositions = cyNodes.map(node => node.position('y'));

    let targetX: number | undefined;
    let targetY: number | undefined;

    switch (alignment) {
        case Alignment.Left:
            targetX = Math.min(...xPositions);
            break;
        case Alignment.Right:
            targetX = Math.max(...xPositions);
            break;
        case Alignment.Top:
            targetY = Math.min(...yPositions);
            break;
        case Alignment.Bottom:
            targetY = Math.max(...yPositions);
            break;
    }

    // Align nodes in Cytoscape
    cy.batch(() => {
        cyNodes.forEach(node => {
            const currentPos = node.position();
            if (alignment === Alignment.Left || alignment === Alignment.Right) {
                node.position({ x: targetX!, y: currentPos.y });
            } else {
                node.position({ x: currentPos.x, y: targetY! });
            }
        });
    });
};