import { useEffect } from "react";

import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth/providers/AuthProvider";

const ProtectedAuth = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate("/auth/login");
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  return children;
};

export default ProtectedAuth;
