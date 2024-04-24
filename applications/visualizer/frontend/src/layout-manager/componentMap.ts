import {widgetIds} from "./widgets.ts";
import LeftComponent from "../components/placeholder/LeftComponent.tsx";
import RightComponent from "../components/placeholder/RightComponent.tsx";
import ThreeDViewer from "../components/viewers/ThreeDViewer.tsx";

const componentMap = {
    [widgetIds.leftComponent]: LeftComponent,
    [widgetIds.rightComponent]: RightComponent,
    [widgetIds.threeDViewer]: ThreeDViewer,
};

export default componentMap