import { Outlines } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { type FC, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { type BufferGeometry } from "three";
import { useGlobalContext } from "../../../contexts/GlobalContext";
import { getFurthestIntersectedObject } from "../../../helpers/threeDHelpers";
import type { RootState } from "../../../layout-manager/layoutManagerFactory";
import type { Workspace } from "../../../models";
import { ViewerType } from "../../../models";
import { OUTLINE_COLOR, OUTLINE_THICKNESS } from "../../../settings/threeDSettings";
import { useTexture } from "@react-three/drei";

interface Props {
  stl: BufferGeometry;
  id: string;
  color: string;
  opacity: number;
  renderOrder: number;
  isWireframe: boolean;
  clickable?: boolean;
}

const STLMesh: FC<Props> = ({ id, color, opacity, renderOrder, isWireframe, stl, clickable }) => {
  const { workspaces } = useGlobalContext();
  const workspaceId = useSelector((state: RootState) => state.workspaceId);
  const workspace: Workspace = workspaces[workspaceId];
  const texture = useTexture("texture.png");

  const isSelected = useMemo(() => {
    const selectedNeurons = workspace.getSelection(ViewerType.ThreeD);
    return selectedNeurons.includes(id);
  }, [workspace.getSelection(ViewerType.ThreeD)]);

  const onClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (!clickable) {
        return;
      }
      const clicked = getFurthestIntersectedObject(event);
      if (!clicked) {
        return;
      }
      const { id } = clicked.userData;
      let wspace = workspace;
      if (clicked) {
        if (isSelected) {
          wspace = wspace.removeSelection(id, ViewerType.ThreeD);
          // Is there a neuron in the selection that comes from the same class. If not, we can remove the class from the selection
          const removeClass = !workspace
            .getSelection(ViewerType.ThreeD)
            .some((e) => workspace.getNeuronClass(e) !== e && workspace.getNeuronClass(e) === workspace.getNeuronClass(id));
          if (removeClass) {
            wspace = wspace.removeSelection(workspace.getNeuronClass(id), ViewerType.ThreeD);
          }
        } else {
          wspace = wspace.addSelection(id, ViewerType.ThreeD);
        }
      }
    },
    [workspace],
  );

  return (
    <mesh userData={{ id }} onClick={onClick} renderOrder={renderOrder}>
      <primitive attach="geometry" object={stl} />
      {isWireframe ? (
        <meshBasicMaterial color={color} opacity={opacity} wireframe={isWireframe} transparent />
      ) : (
        <meshMatcapMaterial color={color} opacity={opacity} transparent matcap={texture} />
      )}
      {clickable && isSelected && <Outlines thickness={OUTLINE_THICKNESS} color={OUTLINE_COLOR} />}
    </mesh>
  );
};

export default STLMesh;
