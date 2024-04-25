import React, {FC} from "react";

interface Props {
    stl: any;
    color: string;
    opacity: number;
}

const STLMesh: FC<Props> = ({color, opacity, stl}) => {
    return (
        <mesh castShadow receiveShadow>
            <primitive attach="geometry" object={stl}/>
            <meshStandardMaterial color={color} opacity={opacity} transparent/>
        </mesh>
    );
};

export default STLMesh;
