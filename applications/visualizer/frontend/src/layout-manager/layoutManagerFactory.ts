import { configureStore, type Reducer, combineReducers, type Action } from "@reduxjs/toolkit";
import { callbacksMiddleware } from "@metacell/geppetto-meta-client/common/middleware/geppettoMiddleware";
import { initLayoutManager } from "@metacell/geppetto-meta-client/common/layout/LayoutManager";
import geppettoClientReducer, { clientInitialState, type ClientState } from "@metacell/geppetto-meta-client/common/reducer/geppettoClient";
import { layoutInitialState, layout, widgets, type LayoutState } from "@metacell/geppetto-meta-client/common/reducer/geppettoLayout";
import { reducerDecorator } from "@metacell/geppetto-meta-client/common/reducer/reducerDecorator";
import type { WidgetMap } from "@metacell/geppetto-meta-client/common/layout/model";

import componentMap from "./componentMap.ts";
import baseLayout from "./layout.ts";

export interface RootState {
  client: ClientState;
  layout: LayoutState;
  widgets: WidgetMap;
  workspaceId: string;
}

const workspaceReducer = (state = "", action) => {
  switch (action.type) {
    case "SET_WORKSPACE_ID":
      return action.payload;
    default:
      return state;
  }
};

const initialState = {
  client: clientInitialState,
  layout: layoutInitialState,
  widgets: {},
  workspaceId: "",
};

const rootReducer: Reducer<RootState> = reducerDecorator(
  combineReducers<RootState>({
    client: geppettoClientReducer,
    layout,
    widgets,
    // @ts-expect-error Type '(state: string, action: any) => any' is not assignable to type 'string'.
    workspaceId: workspaceReducer,
  }),
);

const getLayoutManagerAndStore = (workspaceId: string) => {
  const layoutManager = initLayoutManager(baseLayout, componentMap, undefined, false);
  const middlewareEnhancer = (getDefaultMiddleware) => getDefaultMiddleware().concat(callbacksMiddleware, layoutManager.middleware);

  const storeOptions: {
    preloadedState: Partial<RootState>;
    reducer: (state: RootState | undefined, action: Action) => RootState;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    middleware: (getDefaultMiddleware: ReturnType<ReturnType<any>>) => any;
  } = {
    reducer: rootReducer,
    middleware: middlewareEnhancer,
    preloadedState: { ...initialState, workspaceId: workspaceId } as Partial<RootState>,
  };

  const store = configureStore(storeOptions);

  return {
    layoutManager,
    store,
  };
};

export default getLayoutManagerAndStore;
