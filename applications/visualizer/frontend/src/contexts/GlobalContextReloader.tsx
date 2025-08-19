import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalContext } from "./GlobalContext";

const GlobalContextReloader = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { restoreGlobalContextFromBase64, datasets } = useGlobalContext();

  // biome-ignore lint/correctness/useExhaustiveDependencies: restoreGlobalContextFromBase64 is function from global context
  useEffect(() => {
    if (code && datasets && Object.keys(datasets).length > 0) {
      restoreGlobalContextFromBase64(code, datasets).then(() => navigate("/"));
    }
  }, [datasets, code]);

  return <div>Restoring datasets and workspaces</div>;
};

export default GlobalContextReloader;
