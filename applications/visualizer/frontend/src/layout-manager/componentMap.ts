import EMViewer from "../components/viewers/EM/EMStackTilesViewer.tsx";
import ThreeDViewer from "../components/viewers/ThreeD/ThreeDViewer.tsx";
import TwoDViewer from "../components/viewers/TwoD/TwoDViewer.tsx";
import { widgetIds } from "./widgets.ts";

const componentMap = {
  [widgetIds.threeDViewer]: ThreeDViewer,
  [widgetIds.twoDViewer]: TwoDViewer,
  [widgetIds.emDataViewer]: EMViewer,
};

export default componentMap;
