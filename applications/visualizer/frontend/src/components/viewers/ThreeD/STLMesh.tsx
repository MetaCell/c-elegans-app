import React, {FC} from "react";
import {useGlobalContext} from "../../../contexts/GlobalContext.tsx";
import {useSelector} from "react-redux";
import {Workspace} from "../../../models/workspace.ts";
import {RootState} from "../../../layout-manager/layoutManagerFactory.ts";

interface Props {
    stl: any;
    id: string;
    color: string;
    opacity: number;
}

const STLMesh: FC<Props> = ({id, color, opacity, stl}) => {
    const {workspaces} = useGlobalContext();
    const workspaceId = useSelector((state:RootState) => state.workspaceId);
    const workspace: Workspace = workspaces[workspaceId];
    const onClick = (event) => {
        const clicked = getClosestIntersectedObject(event)
        if (clicked) {
            workspace.highlightNeuron(clicked.userData.id)
        }
    }
    return (
        <mesh userData={{id}} onClick={onClick}>
            <primitive attach="geometry" object={stl}/>
            <meshStandardMaterial color={color} opacity={opacity} transparent/>
        </mesh>
    );
};

function getClosestIntersectedObject(event) {
    if (!event.intersections || event.intersections.length === 0) {
        return null;
    }

    // Sort the intersections array by the 'distance' property
    const sortedIntersections = event.intersections.sort((a, b) => a.distance - b.distance);

    // Return the first object in the sorted array
    return sortedIntersections[0].object;
}

export default STLMesh;
