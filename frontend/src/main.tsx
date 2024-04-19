import React from 'react'
import ReactDOM from 'react-dom/client'
import {Provider} from 'react-redux';
import App2 from './App2.tsx'
import './index.css'
import initLayoutManager from "./layout-manager/store.ts";
import App from "./App.tsx";
import {SharedDataProvider} from "./contexts/SharedDataContext.tsx";

const layoutAndStore1 = initLayoutManager();
const layoutAndStore2 = initLayoutManager();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <SharedDataProvider>
        <Provider store={layoutAndStore1.store}>
            <App layoutManager={layoutAndStore1.layoutManager}/>
        </Provider>
        <Provider store={layoutAndStore2.store}>
            <App2 layoutManager={layoutAndStore2.layoutManager}/>
        </Provider>
    </SharedDataProvider>
)
