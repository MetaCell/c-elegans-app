import { Outlines } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { FC } from "react";
import { useSelector } from "react-redux";
import { type BufferGeometry, DoubleSide, NormalBlending } from "three";
import { useGlobalContext } from "../../../contexts/GlobalContext";
import { getFurthestIntersectedObject } from "../../../helpers/threeDHelpers";
import type { RootState } from "../../../layout-manager/layoutManagerFactory";
import type { Workspace } from "../../../models";
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
    const clicked = getFurthestIntersectedObject(event);
    if (clicked) {
      workspace.toggleSelectedNeuron(clicked.userData.id);
    }
  };

  const isSelected = id in workspace.selectedNeurons;
  return (
    <mesh userData={{ id }} onClick={onClick} frustumCulled={false} renderOrder={renderOrder}>
      <primitive attach="geometry" object={stl} />
      <meshStandardMaterial
        color={color}
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
