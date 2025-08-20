import { type FC, useMemo, useState } from "react";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { useGlobalContext } from "../../../contexts/GlobalContext.tsx";
import { GlobalError } from "../../../models/Error.ts";
import STLMesh from "./STLMesh.tsx";
import type { NeuronInstance } from "./ThreeDViewer.tsx";

interface Props {
  instances: NeuronInstance[];
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
              (geometry) => resolve(geometry),
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
        handleErrors(new GlobalError(`Couldn't fetch/find any 3D representation for ${errorFiles.map((e) => e.id)} from the selected datasets`));
      }
    };

    loadSTLFiles();
  }, [instances]);

  return (
    <>
      {stlObjects.map((stl, idx) => (
        <STLMesh
          key={instances[idx]?.id}
          id={instances[idx]?.id}
          stl={stl}
          opacity={instances[idx]?.opacity}
          color={instances[idx]?.color}
          renderOrder={instances[idx]?.renderOrder || 0}
          isWireframe={isWireframe}
          clickable={instances[idx]?.clickable}
        />
      ))}
    </>
  );
};

export default STLViewer;
