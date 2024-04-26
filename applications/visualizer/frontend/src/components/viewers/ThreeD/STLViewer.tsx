import React, {FC} from "react";
import {Center, Select} from "@react-three/drei";
import {useLoader, useThree} from "@react-three/fiber";
import {STLLoader} from "three/examples/jsm/loaders/STLLoader";
import {BufferGeometry} from 'three';
import {Instance} from "./ThreeDViewer.tsx";
import STLMesh from "./STLMesh.tsx";

interface Props {
    instances: Instance[];
}

const STLViewer: FC<Props> = ({instances}) => {
    // Todo: Fix typescript warning
    // Check if useLoader caches or do we need to do it ourselves
    const stlObjects = useLoader<STLLoader, BufferGeometry[]>(STLLoader, instances.map(i => i.url));
    const {scene} = useThree();
    window.myScene = scene;

    return (
        <Center>
            <group frustumCulled={false}>
                {stlObjects.map((stl, idx) => (
                    <STLMesh
                        key={idx}
                        stl={stl}
                        id={instances[idx].id}
                        opacity={instances[idx].opacity}
                        color={instances[idx].color}
                        renderOrder={idx}
                    />
                ))}
            </group>
        </Center>
    );
};

export default STLViewer;
