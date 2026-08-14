import { useEffect } from "react";

import { useNavigate } from "react-router";

import { useAuth } from "@/features/auth/providers/AuthProvider";

const RedirectIfAuthenticated = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/app");
    }
  }, [session, navigate]);

  if (session) {
    return null;
  }

  return children;
};

export default RedirectIfAuthenticated;
