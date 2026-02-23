import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export default function RequireAuth({ children, role }) {
  const { isAuthenticated, role: currentRole } = useApp();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && currentRole !== role) return <Navigate to="/student" replace />;

  return children;
}