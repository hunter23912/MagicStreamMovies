import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../hook/userAuth";

const RequireAuth = () => {
  const { auth } = useAuth();
  const location = useLocation(); // 记录用户试图访问的页面地址

  return auth ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default RequireAuth;
