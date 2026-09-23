import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const {
    session,
    isAdmin,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="state-message">
        Provera administratorskog pristupa...
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  return children;
}

export default AdminRoute;