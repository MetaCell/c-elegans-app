import {widgetIds} from "./widgets.ts";
import LeftComponent from "../components/LeftComponent.tsx";
import RightComponent from "../components/RightComponent.tsx";

const componentMap = {
    [widgetIds.leftComponent]: LeftComponent,
    [widgetIds.rightComponent]: RightComponent,
};

export default componentMap