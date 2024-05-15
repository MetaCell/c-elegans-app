import React from 'react'
import ReactDOM from 'react-dom/client'
import {enableMapSet} from "immer"
import App from './App.tsx'
import './index.css'
import {GlobalContextProvider} from "./contexts/GlobalContext.tsx";

enableMapSet()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <GlobalContextProvider>
        <App/>
    </GlobalContextProvider>
    ,
)
