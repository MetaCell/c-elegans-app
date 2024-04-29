import {
    configureStore,
    Reducer,
    PreloadedState,
    combineReducers,
    AnyAction,
} from "@reduxjs/toolkit";
import {callbacksMiddleware} from '@metacell/geppetto-meta-client/common/middleware/geppettoMiddleware';
import {initLayoutManager} from "@metacell/geppetto-meta-client/common/layout/LayoutManager";
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
import {reducerDecorator} from '@metacell/geppetto-meta-client/common/reducer/reducerDecorator';
import {WidgetMap} from '@metacell/geppetto-meta-client/common/layout/model';

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
    const middlewareEnhancer = (getDefaultMiddleware: ReturnType<typeof getDefaultMiddleware>) =>
        getDefaultMiddleware<RootState>().concat(callbacksMiddleware, layoutManager.middleware);

    const storeOptions: {
        preloadedState: PreloadedState<RootState>;
        reducer: (state: (RootState | undefined), action: AnyAction) => RootState;
        middleware: (getDefaultMiddleware: ReturnType<ReturnType<any>>) => any
    } = {
        reducer: rootReducer,
        middleware: middlewareEnhancer,
        preloadedState: {...initialState, workspaceId: workspaceId} as PreloadedState<RootState>,
    };

    const store = configureStore(storeOptions);

    return {
        layoutManager,
        store
    };
};

export default getLayoutManagerAndStore;
