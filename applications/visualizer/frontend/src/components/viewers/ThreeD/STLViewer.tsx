import React, {FC, Suspense} from "react";
import {Center, Loader} from "@react-three/drei";
import {useLoader} from "@react-three/fiber";
import {STLLoader} from "three/examples/jsm/loaders/STLLoader";
import {BufferGeometry} from 'three';
import {Instance} from "./ThreeDViewer.tsx";
import STLMesh from "./STLMesh.tsx";

interface Props {
    instances: Instance[];
}

const STLViewer: FC<Props> = ({instances}) => {
    const stl = useLoader<STLLoader, BufferGeometry[]>(STLLoader, instances.map(i => i.url));

    return (
        <Center>
            <group rotation={[-Math.PI / 2, 0, 0]}>
                {stl.map((stl, idx) => (
                    <STLMesh
                        key={idx}
                        stl={stl}
                        opacity={instances[idx].opacity}
                        color={instances[idx].color}
                    />
                ))}
            </group>
        </Center>
    );
};

export default STLViewer;
