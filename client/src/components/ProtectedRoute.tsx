import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  token: string | null;
  children: React.ReactNode;
};

export default function ProtectedRoute({
  token,
  children,
}: ProtectedRouteProps) {
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}