import React, {FC} from "react";
import {Center, Select} from "@react-three/drei";
import {useLoader} from "@react-three/fiber";
import {STLLoader} from "three/examples/jsm/loaders/STLLoader";
import {BufferGeometry} from 'three';
import {Instance} from "./ThreeDViewer.tsx";
import STLMesh from "./STLMesh.tsx";
import {useSelector} from "react-redux";
import {Workspace} from "../../../models/workspace.ts";
import {useGlobalContext} from "../../../contexts/GlobalContext.tsx";

interface Props {
    instances: Instance[];
}

const STLViewer: FC<Props> = ({instances}) => {
    const {workspaces} = useGlobalContext();

    const workspaceId = useSelector(state => state.workspaceId);
    const workspace: Workspace = workspaces[workspaceId];

    const stl = useLoader<STLLoader, BufferGeometry[]>(STLLoader, instances.map(i => i.url));

    const onSelect = (selected) => {
        console.log(selected)
    }

    return (
        <Center>
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <Select onChange={onSelect}>
                    {stl.map((stl, idx) => (
                        <STLMesh
                            key={idx}
                            stl={stl}
                            opacity={instances[idx].opacity}
                            color={instances[idx].color}
                        />
                    ))}
                </Select>
            </group>
        </Center>
    );
};

export default STLViewer;
