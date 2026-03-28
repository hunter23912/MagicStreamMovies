import { useContext } from "react";
import AuthContext from "../context/AuthProvider";
import type { AuthContextType } from "../context/AuthProvider";

// 从AuthContext读取当前登录信息，维护全局auth状态，子组件调用useAuth获取当前登录信息
const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context as AuthContextType;
};

export default useAuth;
