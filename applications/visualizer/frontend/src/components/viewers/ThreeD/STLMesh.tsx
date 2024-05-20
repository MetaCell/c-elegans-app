import { FC } from "react";
import { Outlines } from '@react-three/drei';
import { useGlobalContext } from "../../../contexts/GlobalContext";
import { useSelector } from "react-redux";
import { Workspace } from "../../../models/workspace";
import { RootState } from "../../../layout-manager/layoutManagerFactory";
import { BufferGeometry, DoubleSide, NormalBlending } from "three";
import { ThreeEvent } from "@react-three/fiber";
import { getFurthestIntersectedObject } from "../../../helpers/threeDHelpers";
import { OUTLINE_COLOR, OUTLINE_THICKNESS } from "../../../settings/threeDSettings";

interface Props {
    stl: BufferGeometry;
    id: string;
    color: string;
    opacity: number;
    renderOrder: number;
    isWireframe: boolean;
}

const STLMesh: FC<Props> = ({ id, color, opacity, renderOrder, isWireframe, stl }) => {
    const { workspaces } = useGlobalContext();
    const workspaceId = useSelector((state: RootState) => state.workspaceId);
    const workspace: Workspace = workspaces[workspaceId];
    const onClick = (event: ThreeEvent<MouseEvent>) => {
        const clicked = getFurthestIntersectedObject(event)
        if (clicked) {
            workspace.highlightNeuron(clicked.userData.id)
        }
    }

    const isSelected = id == workspace.highlightedNeuron
    return (
        <mesh userData={{ id }} onClick={onClick} frustumCulled={false} renderOrder={renderOrder}>
            <primitive attach="geometry" object={stl} />
            <meshStandardMaterial color={color}
                opacity={opacity}
                side={DoubleSide}
                depthWrite={false}
                depthTest={false}
                blending={NormalBlending}
                wireframe={isWireframe}
                transparent
            />
            {isSelected && <Outlines thickness={OUTLINE_THICKNESS} color={OUTLINE_COLOR} />}
        </mesh>
    );
};


export default STLMesh;
