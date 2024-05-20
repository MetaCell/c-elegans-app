import type {Connection} from "../rest";

export const createEdge = (conn: Connection) => {
    return {
        group: 'edges',
        data: {
            id: `${conn.pre}-${conn.post}`,
            source: conn.pre,
            target: conn.post,
            label: conn.type
        },
        classes: conn.type
    }
}

export const createNode = (nodeId: string) => {
    return {
        group: 'nodes',
        data: {id: nodeId, label: nodeId}
    }
}