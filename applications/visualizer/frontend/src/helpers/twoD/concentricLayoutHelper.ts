import type { Core } from "cytoscape";

export function getConcentricLayoutPositions(cy: Core) {
  const center = {
    x: cy.width() / 2,
    y: cy.height() / 2,
  };

  const innerNodes = cy.nodes(".searchedfor");
  const innerNodeIds = innerNodes.map((n) => n.id()).sort();

  const outerNodes = cy.nodes().not(".searchedfor");
  const edgeTypes: Record<string, number> = {};

  outerNodes.forEach((node) => {
    const edges = node.edgesWith(innerNodes);
    const edgesElectrical = edges.filter('[type="electrical"]');
    const edgesChemical = edges.filter('[type="chemical"]');
    const hasElectrical = edgesElectrical.length > 0;
    const isTarget = edgesChemical.sources().contains(innerNodes);
    const isSource = edgesChemical.targets().contains(innerNodes);
    let idx = 0;

    if (hasElectrical) {
      idx = 3 - (isTarget ? 1 : 0) + (isSource ? 1 : 0);
    } else {
      idx = (isTarget ? 1 : 0) + (isSource ? 5 : 0);
    }

    edgeTypes[node.id()] = idx;
  });

  const outerNodeIds = outerNodes
    .map((n) => n.id())
    .sort((a, b) => {
      if (edgeTypes[a] === edgeTypes[b]) {
        return a.localeCompare(b);
      }
      return edgeTypes[a] - edgeTypes[b];
    });

  const innerPositions = createCircle(innerNodeIds, center, outerNodes.length > 0);
  const outerPositions = createCircle(outerNodeIds, center);

  return Object.assign({}, innerPositions, outerPositions);
}

function createCircle(nodes: string[], center: { x: number; y: number }, smallCircle = false) {
  const positions: Record<string, { x: number; y: number }> = {};
  const count = nodes.length;
  const dTheta = (2 * Math.PI - (2 * Math.PI) / count) / Math.max(1, count - 1);
  let r = Math.ceil(Math.min(center.x * 2, center.y * 2) / 2.5);

  if (smallCircle) {
    r /= count < 4 ? 3 : 2;
  }

  if (smallCircle && count === 1) {
    positions[nodes[0]] = { x: center.x, y: center.y };
  } else {
    for (let i = 0; i < count; i++) {
      const theta = -i * dTheta;
      positions[nodes[i]] = {
        x: center.x - r * Math.sin(theta),
        y: center.y - r * Math.cos(theta),
      };
    }
  }

  return positions;
}
