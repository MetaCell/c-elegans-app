import { widgetIds } from "./widgets.ts";
import ThreeDViewer from "../components/viewers/ThreeD/ThreeDViewer.tsx";
import TwoDViewer from "../components/viewers/TwoD/TwoDViewer.tsx";

const componentMap = {
  [widgetIds.threeDViewer]: ThreeDViewer,
  [widgetIds.twoDViewer]: TwoDViewer,
};

export default componentMap;
