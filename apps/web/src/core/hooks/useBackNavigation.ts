import { useNavigate, useLocation } from "react-router-dom";

export const useBackNavigation = (fallbackPath = "../") => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallbackPath, { relative: "path" });
    }
  };

  return goBack;
};
