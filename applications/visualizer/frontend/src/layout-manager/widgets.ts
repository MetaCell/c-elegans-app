import { WidgetStatus } from "@metacell/geppetto-meta-client/common/layout/model";

export const widgetIds = {
    leftComponent: 'leftComponent',
    rightComponent: 'rightComponent',
}


export const leftComponentWidget = () => ({
    id: widgetIds.leftComponent,
    name: "Left Component Example",
    component: widgetIds.leftComponent,
    panelName: "leftPanel",
    enableClose: false,
    status: WidgetStatus.ACTIVE,
});
export const rightComponentWidget = () => ({
    id: widgetIds.rightComponent,
    name: "Right Component Example",
    component: widgetIds.rightComponent,
    panelName: "rightPanel",
    enableClose: false,
    status: WidgetStatus.ACTIVE,
});