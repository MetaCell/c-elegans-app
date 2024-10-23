import { Center } from "@react-three/drei";
import { type FC, useMemo, useState } from "react";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { useGlobalContext } from "../../../contexts/GlobalContext.tsx";
import { GlobalError } from "../../../models/Error.ts";
import STLMesh from "./STLMesh.tsx";
import type { Instance } from "./ThreeDViewer.tsx";

interface Props {
  instances: Instance[];
  isWireframe: boolean;
}

const STLViewer: FC<Props> = ({ instances, isWireframe }) => {
  const { handleErrors } = useGlobalContext();
  const [stlObjects, setSTLObjects] = useState([]);

  useMemo(() => {
    const loader = new STLLoader();

    const errorFiles = [];

    // Load all STL files in parallel
    const loadSTLFiles = async () => {
      const loadPromises = instances.map(
        (instance) =>
          new Promise((resolve, _) => {
            loader.load(
              instance.url,
              (geometry) => resolve(geometry.center()),
              undefined,
              (error) => {
                console.error(`Error loading ${instance.url}:`, error);
                errorFiles.push(instance);
                resolve(null);
              },
            );
          }),
      );
      // Wait for all promises to finish
      const results = await Promise.allSettled(loadPromises);

      // We filter now all the promises that didn't finish properly
      // @ts-expect-error
      const successfulModels = results.filter((result) => result.status === "fulfilled" && result.value).map((result) => result.value);

      setSTLObjects(successfulModels);

      // If there is some error, we display a message to inform the user
      if (errorFiles.length > 0) {
        handleErrors(new GlobalError(`Couldn't fetch 3D representation for ${errorFiles.map((e) => e.id)}`));
      }
    };

    loadSTLFiles();
  }, [instances]);

  return (
    <Center>
      <group frustumCulled={false}>
        {stlObjects.map((stl, idx) => (
          <STLMesh
            key={instances[idx].id}
            id={instances[idx].id}
            stl={stl}
            opacity={instances[idx].opacity}
            color={instances[idx].color}
            renderOrder={idx}
            isWireframe={isWireframe}
          />
        ))}
      </group>
    </Center>
  );
};

export default STLViewer;
