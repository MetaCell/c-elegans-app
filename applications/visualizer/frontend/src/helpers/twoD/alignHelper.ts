import { Alignment } from "../../models";
import type { Core } from "cytoscape";

export const alignNeurons = (alignment: Alignment, selectedNeurons: string[], cy: Core) => {
  // Get Cytoscape elements for selected neurons
  const cyNodes = selectedNeurons.map((neuronId) => cy.getElementById(neuronId));

  if (cyNodes.some((node) => !node || !node.position())) {
    console.error("Some selected neurons do not have positions set in Cytoscape.");
    return;
  }

  const xPositions = cyNodes.map((node) => node.position("x"));
  const yPositions = cyNodes.map((node) => node.position("y"));

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
    cyNodes.forEach((node) => {
      const currentPos = node.position();
      if (alignment === Alignment.Left || alignment === Alignment.Right) {
        node.position({ x: targetX!, y: currentPos.y });
      } else {
        node.position({ x: currentPos.x, y: targetY! });
      }
    });
  });
};

export const distributeNeurons = (alignment: Alignment, selectedNeurons: string[], cy: Core) => {
  if (selectedNeurons.length <= 1) {
    return;
  }
  // Get Cytoscape elements for selected neurons
  const cyNodes = selectedNeurons.map((neuronId) => cy.getElementById(neuronId));

  if (cyNodes.some((node) => !node || !node.position())) {
    console.error("Some selected neurons do not have positions set in Cytoscape.");
    return;
  }

  // Sort nodes by their current position along the axis to distribute
  cyNodes.sort((a, b) => {
    if (alignment === Alignment.Horizontal) {
      return a.position("x") - b.position("x");
    } else {
      return a.position("y") - b.position("y");
    }
  });

  // Get the range of positions along the distribution axis
  const minPos = alignment === Alignment.Horizontal ? cyNodes[0].position("x") : cyNodes[0].position("y");
  const maxPos = alignment === Alignment.Horizontal ? cyNodes[cyNodes.length - 1].position("x") : cyNodes[cyNodes.length - 1].position("y");

  // Calculate the spacing
  const spacing = (maxPos - minPos) / (cyNodes.length - 1);

  // Distribute nodes
  cy.batch(() => {
    cyNodes.forEach((node, index) => {
      const currentPos = node.position();
      if (alignment === Alignment.Horizontal) {
        node.position({ x: minPos + index * spacing, y: currentPos.y });
      } else {
        node.position({ x: currentPos.x, y: minPos + index * spacing });
      }
    });
  });
};
