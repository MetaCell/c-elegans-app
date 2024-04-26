import React, {FC} from "react";
import {Outlines} from '@react-three/drei';
import {useGlobalContext} from "../../../contexts/GlobalContext.tsx";
import {useSelector} from "react-redux";
import {Workspace} from "../../../models/workspace.ts";
import {RootState} from "../../../layout-manager/layoutManagerFactory.ts";
import {DoubleSide, NormalBlending} from "three";
import {getClosestIntersectedObject, getFurthestIntersectedObject} from "../../../helpers/threeDHelpers.ts";
import {OUTLINE_COLOR, OUTLINE_THICKNESS} from "../../../../settings/threeDSettings.ts";

interface Props {
    stl: any;
    id: string;
    color: string;
    opacity: number;
    renderOrder: number;
}

const STLMesh: FC<Props> = ({id, color, opacity, renderOrder, stl}) => {
    const {workspaces} = useGlobalContext();
    const workspaceId = useSelector((state: RootState) => state.workspaceId);
    const workspace: Workspace = workspaces[workspaceId];
    const onClick = (event) => {
        const clicked = getFurthestIntersectedObject(event)
        if (clicked) {
            workspace.highlightNeuron(clicked.userData.id)
        }
    }

    const isSelected = id == workspace.highlightedNeuron
    // TODO: Add outlines for selected
    // TODO: Test wireframe
    return (

        <mesh userData={{id}} onClick={onClick} frustumCulled={false} renderOrder={renderOrder}>
            <primitive attach="geometry" object={stl}/>
            <meshStandardMaterial color={color}
                                  opacity={opacity}
                                  side={DoubleSide}
                                  depthWrite={false}
                                  depthTest={false}
                                  blending={NormalBlending}
                                  transparent/>
            {isSelected && <Outlines thickness={OUTLINE_THICKNESS} color={OUTLINE_COLOR}/>}
        </mesh>
    );
};


export default STLMesh;
