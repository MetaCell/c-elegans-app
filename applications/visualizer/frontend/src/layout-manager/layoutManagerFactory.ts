import {applyMiddleware, combineReducers, compose, createStore} from "@reduxjs/toolkit";
import {callbacksMiddleware} from '@metacell/geppetto-meta-client/common/middleware/geppettoMiddleware';
import {initLayoutManager} from "@metacell/geppetto-meta-client/common/layout/LayoutManager";
import geppettoClientReducer, {clientInitialState} from '@metacell/geppetto-meta-client/common/reducer/geppettoClient';
import {
    layoutInitialState,
    layout,
    widgets
} from '@metacell/geppetto-meta-client/common/reducer/geppettoLayout';
import {reducerDecorator} from '@metacell/geppetto-meta-client/common/reducer/reducerDecorator';

import componentMap from "./componentMap.ts";
import baseLayout from "./layout.ts";

const storeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const workspaceReducer = (state = '', action) => {
    switch (action.type) {
        case 'SET_WORKSPACE_ID':
            return action.payload;
        default:
            return state;
    }
}

const initialState = {
    client: clientInitialState,
    layout: layoutInitialState,
    widgets: {}
};

const staticReducers = {
    client: geppettoClientReducer,
    layout,
    widgets,
    workspaceId: workspaceReducer
}

const getLayoutManagerAndStore = (workspaceId: string) => {
    const layoutManager = initLayoutManager(baseLayout, componentMap, undefined, false);
    const allMiddlewares = [callbacksMiddleware, layoutManager.middleware];

    const store = createStore(
        reducerDecorator(combineReducers({...staticReducers})),
        {...initialState, workspaceId: workspaceId},
        storeEnhancers(applyMiddleware(...allMiddlewares))
    );
    return {
        layoutManager,
        store
    }

}

export default getLayoutManagerAndStore;
