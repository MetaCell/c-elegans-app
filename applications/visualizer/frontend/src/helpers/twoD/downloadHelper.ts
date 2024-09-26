import html2canvas from "html2canvas";

export const downloadConnectivityViewer = async (cy, name) => {
  if (!cy) return;

  // Capture Cytoscape graph as an image
  const pngDataUrl = cy.png({
    output: "base64uri",
    bg: "white",
    full: true,
    scale: 2,
  });

  // Create an image element to load the Cytoscape image
  const graphImage = new Image();
  graphImage.src = pngDataUrl;

  await new Promise((resolve) => {
    graphImage.onload = resolve;
  });

  // Get the actual size of the captured image
  const graphWidth = graphImage.width;
  const graphHeight = graphImage.height;

  // Capture the legend as an image
  const legendElement = document.querySelector("#legend-container");
  const legendCanvas = await html2canvas(<HTMLElement>legendElement);

  // Create a new canvas to combine the graph and the legend
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  // Set the canvas size to fit both the graph and the legend side by side
  canvas.width = graphWidth + legendCanvas.width;
  canvas.height = Math.max(graphHeight, legendCanvas.height);

  // Fill the canvas with a white background
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the Cytoscape image onto the canvas
  context.drawImage(graphImage, 0, 0, graphWidth, graphHeight);

  // Draw the legend to the right of the graph
  context.drawImage(legendCanvas, graphWidth, 0);

  // Download the combined image
  const combinedDataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = combinedDataUrl;
  link.download = `${name}.png`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
