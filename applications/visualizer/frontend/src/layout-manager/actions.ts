import { SET_WORKSPACE_ID } from "./actionsTypes.ts";

export const setWorkspaceId = (workspaceId) => ({
  type: SET_WORKSPACE_ID,
  payload: workspaceId,
});
