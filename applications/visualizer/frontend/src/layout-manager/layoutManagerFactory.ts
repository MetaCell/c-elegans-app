import {
    configureStore,
    Reducer,
    combineReducers,
    Action,
} from "@reduxjs/toolkit";
import { callbacksMiddleware } from '@metacell/geppetto-meta-client/common/middleware/geppettoMiddleware';
import { initLayoutManager } from "@metacell/geppetto-meta-client/common/layout/LayoutManager";
import geppettoClientReducer, {
    clientInitialState,
    ClientState
} from '@metacell/geppetto-meta-client/common/reducer/geppettoClient';
import {
    layoutInitialState,
    layout,
    widgets,
    LayoutState
} from '@metacell/geppetto-meta-client/common/reducer/geppettoLayout';
import { reducerDecorator } from '@metacell/geppetto-meta-client/common/reducer/reducerDecorator';
import { WidgetMap } from '@metacell/geppetto-meta-client/common/layout/model';

import componentMap from "./componentMap.ts";
import baseLayout from "./layout.ts";

export interface RootState {
    client: ClientState;
    layout: LayoutState;
    widgets: WidgetMap;
    workspaceId: string;
}

const workspaceReducer = (state: string = '', action) => {
    switch (action.type) {
        case 'SET_WORKSPACE_ID':
            return action.payload;
        default:
            return state;
    }
};

const initialState = {
    client: clientInitialState,
    layout: layoutInitialState,
    widgets: {},
    workspaceId: ""
};


const rootReducer: Reducer<RootState> = reducerDecorator(combineReducers<RootState>({
    client: geppettoClientReducer,
    layout,
    widgets,
    workspaceId: workspaceReducer
}));

const getLayoutManagerAndStore = (workspaceId: string) => {
    const layoutManager = initLayoutManager(baseLayout, componentMap, undefined, false);
    const middlewareEnhancer = getDefaultMiddleware =>
        getDefaultMiddleware().concat(callbacksMiddleware, layoutManager.middleware);

    const storeOptions: {
        preloadedState: Partial<RootState>;
        reducer: (state: (RootState | undefined), action: Action) => RootState;
        middleware: (getDefaultMiddleware: typeof getDefaultMiddleware) => ReturnType<typeof middlewareEnhancer>;
    } = {
        reducer: rootReducer,
        middleware: middlewareEnhancer,
        preloadedState: { ...initialState, workspaceId: workspaceId } as Partial<RootState>,
    };

    const store = configureStore(storeOptions);

    return {
        layoutManager,
        store
    };
};

export default getLayoutManagerAndStore;
