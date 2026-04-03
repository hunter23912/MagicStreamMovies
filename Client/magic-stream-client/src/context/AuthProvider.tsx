import {
  createContext,
  useEffect,
  useState,
  useMemo,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

// 用户认证需要的状态信息
type AuthUser = {
  first_name: string;
  // token: string;
  role: string;
  user_id: string;
};

// AuthProvider组件位于外层，内部是节点树
type AuthProviderProps = {
  children: ReactNode;
};

// auth的上下文类型
export type AuthContextType = {
  auth: AuthUser | null;
  setAuth: Dispatch<SetStateAction<AuthUser | null>>;
  loading: boolean;
};

// auth上下文实例
const AuthContext = createContext<AuthContextType | null>(null);
export default AuthContext;

// 携带auth状态的上层组件，子组件通过useAuth获取当前登录信息
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        setAuth(parsedUser);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth) {
      localStorage.setItem("user", JSON.stringify(auth)); // 统一管理localStorage
    } else {
      localStorage.removeItem("user");
    }
  }, [auth]);

  const value = useMemo(
    () => ({ auth, setAuth, loading }),
    [auth, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
