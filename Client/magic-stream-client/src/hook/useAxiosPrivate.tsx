import axios from "axios";
import useAuth from "./useAuth";
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// 用于创建一个带有认证信息的axios实例，方便在需要认证的请求中使用
const useAxiosPrivate = () => {
  const axiosAuth = axios.create({
    baseURL: apiUrl,
  });

  const { auth } = useAuth();

  axiosAuth.interceptors.request.use((config) => {
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
  });
  return axiosAuth;
};

export default useAxiosPrivate;
