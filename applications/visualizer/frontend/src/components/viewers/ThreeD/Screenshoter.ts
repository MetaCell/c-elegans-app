import * as THREE from "three";

function getResolutionFixedRatio(htmlElement: HTMLElement, target: { width: number; height: number }) {
  const current = {
    height: htmlElement.clientHeight,
    width: htmlElement.clientWidth,
  };

  if ((Math.abs(target.width - current.width) * 9) / 16 > Math.abs(target.height - current.height)) {
    return {
      height: target.height,
      width: Math.round((current.width * target.height) / current.height),
    };
  }
  return {
    height: Math.round((current.height * target.width) / current.width),
    width: target.width,
  };
}

function getOptions(htmlElement: HTMLCanvasElement, targetResolution: { width: number; height: number }, pixelRatio: number) {
  const resolution = getResolutionFixedRatio(htmlElement, targetResolution);
  return {
    canvasWidth: resolution.width,
    canvasHeight: resolution.height,
    pixelRatio: pixelRatio,
  };
}

export function downloadScreenshot(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  sceneRef: React.RefObject<THREE.Scene>,
  cameraRef: React.RefObject<THREE.PerspectiveCamera>,
) {
  if (!sceneRef.current || !cameraRef.current || !canvasRef.current) return;

  const options = getOptions(canvasRef.current, { width: 3840, height: 2160 }, 1);

  try {
    const tempRenderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    tempRenderer.setSize(options.canvasWidth, options.canvasHeight);
    tempRenderer.setPixelRatio(options.pixelRatio); // Set the resolution scaling

    cameraRef.current.aspect = options.canvasWidth / options.canvasHeight;
    cameraRef.current.updateProjectionMatrix();

    tempRenderer.render(sceneRef.current, cameraRef.current);

    tempRenderer.domElement.toBlob((blob) => {
      if (blob) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "screenshot.png";
        link.click();
        URL.revokeObjectURL(link.href);
      }
    }, "image/png");

    tempRenderer.dispose();
  } catch (e) {
    console.error("Error saving image:", e);
  }
}
