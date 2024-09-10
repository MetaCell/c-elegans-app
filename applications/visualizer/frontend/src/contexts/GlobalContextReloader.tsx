import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGlobalContext } from "./GlobalContext";

const GlobalContextReloader = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { restoreGlobalContextFromBase64 } = useGlobalContext();

  useEffect(() => {
    if (code) {
      console.log("Processing base 64 code:", code);

      restoreGlobalContextFromBase64(code);

      navigate("/");
      //   setTimeout(() => {
      //     navigate("/"); // Navigate back to the main app
      //   }, 2000); // Adjust timing as necessary
    }
  }, [code, navigate, restoreGlobalContextFromBase64]);

  return <div>Processing share code: {code}</div>;
};

export default GlobalContextReloader;
