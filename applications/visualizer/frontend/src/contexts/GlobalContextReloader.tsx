import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalContext } from "./GlobalContext";

const GlobalContextReloader = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { restoreGlobalContextFromBase64, datasets } = useGlobalContext();

  // biome-ignore lint/correctness/useExhaustiveDependencies: navigate and restoreGlobalContextFromBase64 are function from global context
  useEffect(() => {
    if (code && datasets && Object.keys(datasets).length > 0) {
      restoreGlobalContextFromBase64(code);
      navigate("/");
    }
  }, [datasets, code]);

  return <div>Loading datasets</div>;
};

export default GlobalContextReloader;
