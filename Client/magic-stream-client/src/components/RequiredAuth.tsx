import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../hook/useAuth";
import { Spinner } from "react-bootstrap";

const RequireAuth = () => {
  const { auth, loading } = useAuth();
  const location = useLocation(); // 记录用户试图访问的页面地址

  if (loading) {
    return <Spinner />;
  }

  return auth ? (
    <Outlet /> // 如果有认证信息，渲染子组件（被RequireAuth包裹的组件）
  ) : (
    <Navigate to="/login" state={{ from: location }} replace /> // 没有认证信息，重定向到登录页，并传递原访问地址
  );
};

export default RequireAuth;
