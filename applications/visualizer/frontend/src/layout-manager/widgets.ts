import { WidgetStatus } from "@metacell/geppetto-meta-client/common/layout/model";

export const widgetIds = {
  threeDViewer: "threeDViewer",
  twoDViewer: "twoDViewer",
  emDataViewer: "emDataViewer",
};

export const threeDViewerWidget = () => ({
  id: widgetIds.threeDViewer,
  name: "3D Viewer",
  component: widgetIds.threeDViewer,
  panelName: "rightPanel",
  enableClose: false,
  status: WidgetStatus.ACTIVE,
});

export const twoDViewerWidget = () => ({
  id: widgetIds.twoDViewer,
  name: "Connectivity Graph",
  component: widgetIds.twoDViewer,
  panelName: "leftPanel",
  enableClose: false,
  status: WidgetStatus.ACTIVE,
});

export const emDataViewerWidget = () => ({
  id: widgetIds.emDataViewer,
  name: "EM Data",
  component: widgetIds.emDataViewer,
  panelName: "bottomPanel",
  enableClose: false,
  status: WidgetStatus.ACTIVE,
});
