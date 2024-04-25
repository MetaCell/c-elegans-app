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
    const stlObjects = useLoader<STLLoader, BufferGeometry[]>(STLLoader, instances.map(i => i.url));

    return (
        <Center>
            <group rotation={[-Math.PI / 2, 0, 0]}>
                {stlObjects.map((stl, idx) => (
                    <STLMesh
                        key={idx}
                        stl={stl}
                        id={instances[idx].id}
                        opacity={instances[idx].opacity}
                        color={instances[idx].color}
                    />
                ))}
            </group>
        </Center>
    );
};

export default STLViewer;
