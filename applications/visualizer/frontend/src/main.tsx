import { enableMapSet } from "immer";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { enablePatches, setAutoFreeze } from "immer";
import { GlobalContextProvider } from "./contexts/GlobalContext.tsx";

enableMapSet();
enablePatches();
setAutoFreeze(false);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <GlobalContextProvider>
    <App />
  </GlobalContextProvider>,
);
