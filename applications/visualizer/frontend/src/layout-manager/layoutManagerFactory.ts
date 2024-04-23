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


const initialState = {
    client: clientInitialState,
    layout: layoutInitialState,
    widgets: {}
};

const staticReducers = {
    client: geppettoClientReducer,
    layout,
    widgets
}

const getLayoutManagerAndStore = () => {
    const layoutManager = initLayoutManager(baseLayout, componentMap, undefined, false);
    const allMiddlewares = [callbacksMiddleware, layoutManager.middleware];

    const store = createStore(
        reducerDecorator(combineReducers({...staticReducers})),
        {...initialState},
        storeEnhancers(applyMiddleware(...allMiddlewares))
    );
    return {
        layoutManager,
        store
    }

}

export default getLayoutManagerAndStore;
