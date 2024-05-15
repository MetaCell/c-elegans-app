import {widgetIds} from "./widgets.ts";
import LeftComponent from "../components/placeholder/LeftComponent.tsx";
import RightComponent from "../components/placeholder/RightComponent.tsx";
import ThreeDViewer from "../components/viewers/ThreeD/ThreeDViewer.tsx";
import TwoDViewer from "../components/viewers/TwoD/TwoDViewer.tsx";

const componentMap = {
    [widgetIds.leftComponent]: LeftComponent,
    [widgetIds.rightComponent]: RightComponent,
    [widgetIds.threeDViewer]: ThreeDViewer,
    [widgetIds.twoDViewer]: TwoDViewer,
};

export default componentMap