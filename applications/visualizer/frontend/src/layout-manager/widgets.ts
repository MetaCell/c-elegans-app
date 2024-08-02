import { WidgetStatus } from "@metacell/geppetto-meta-client/common/layout/model";

export const widgetIds = {
  threeDViewer: "threeDViewer",
  twoDViewer: "twoDViewer",
};
export const threeDViewerWidget = (status = WidgetStatus.ACTIVE) => ({
  id: widgetIds.threeDViewer,
  name: "3D Viewer",
  component: widgetIds.threeDViewer,
  panelName: "rightPanel",
  enableClose: false,
  status,
});

export const twoDViewerWidget = (status = WidgetStatus.ACTIVE) => ({
  id: widgetIds.twoDViewer,
  name: "Connectivity Graph",
  component: widgetIds.twoDViewer,
  panelName: "leftPanel",
  enableClose: false,
  status,
});
