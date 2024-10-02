import * as htmlToImage from "html-to-image";
import { formatDate } from "../../../helpers/utils.ts";

function getOptions(htmlElement, targetResolution, quality, pixelRatio, filter) {
  const resolution = getResolutionFixedRatio(htmlElement, targetResolution);
  return {
    quality: quality,
    canvasWidth: resolution.width,
    canvasHeight: resolution.height,
    pixelRatio: pixelRatio,
    filter: filter,
  };
}

export function downloadScreenshot(
  htmlElement,
  quality = 0.95,
  targetResolution = { width: 3840, height: 2160 },
  pixelRatio = 1,
  filter = () => true,
  filename = `Canvas_${formatDate(new Date())}.png`,
) {
  const options = getOptions(htmlElement, targetResolution, quality, pixelRatio, filter);

  htmlToImage.toBlob(htmlElement, options).then((blob) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    link.click();
  });
}

function getResolutionFixedRatio(htmlElement, target) {
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
