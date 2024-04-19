import {createLayoutAndStore} from '@metacell/geppetto-meta-client/common';
import componentMap from "./componentMap.ts";
import baseLayout from "./layout.ts";


function initLayoutManager() {
    return createLayoutAndStore(
        {},
        {},
        [],
        {baseLayout, componentMap}
    )
}


export default initLayoutManager;
