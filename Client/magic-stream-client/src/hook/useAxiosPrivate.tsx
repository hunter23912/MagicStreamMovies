import axios from "axios";
import { useEffect, useMemo, useRef } from "react";
import useAuth from "./useAuth";
const apiUrl = import.meta.env.VITE_API_BASE_URL;

type FailedRequest = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

type AxiosRequestWithRetry = {
  url?: string;
  _retry?: boolean;
};

// 用于创建一个带有认证信息的axios实例，方便在需要认证的请求中使用
const useAxiosPrivate = () => {
  const axiosAuth = useMemo(
    () =>
      axios.create({
        baseURL: apiUrl,
        withCredentials: true, // 让浏览器自动携带 HttpOnly cookie
      }),
    [],
  );

  const { auth, setAuth } = useAuth();
  const isRefreshingRef = useRef(false);
  const failedQueueRef = useRef<FailedRequest[]>([]);

  // 刷新结束后，统一处理刷新期间排队的请求。
  const processQueue = (error: unknown, response: unknown = null) => {
    failedQueueRef.current.forEach((prom) => {
      if (error) {
        prom.reject(error); // 刷新失败后，把排队请求全部拒绝
      } else {
        // 刷新成功后，把排队请求全部放行
        prom.resolve(response);
      }
    });
    failedQueueRef.current = [];
  };

  useEffect(() => {
    // 响应拦截器：遇到 401 时尝试用 refresh token 换新 access token。
    const responseInterceptorId = axiosAuth.interceptors.response.use(
      (response) => response, // 正常响应直接返回
      async (error) => {
        // 接收axios Error对象则判断是否是token过期导致的 401 错误
        console.log("⚠ Interceptor caught error:", error);
        const originalRequest = error.config as AxiosRequestWithRetry;

        if (
          originalRequest?.url?.includes("/refresh") &&
          error.response?.status === 401
        ) {
          // 如果刷新请求本身就返回 401，说明 refresh token 也无效了，直接清除认证状态并拒绝所有排队请求。
          console.error("❌ Refresh token has expired or is invalid.");
          return Promise.reject(error);
        }

        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry
        ) {
          // 如果已有刷新请求在进行，就把当前请求挂到队列里等待结果。
          if (isRefreshingRef.current) {
            return new Promise((resolve, reject) => {
              failedQueueRef.current.push({ resolve, reject });
            })
              .then(() => axiosAuth(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          // 标记这次请求已尝试过重放，避免死循环。
          originalRequest._retry = true;
          isRefreshingRef.current = true;

          // 挂起原请求，/refresh后再resolve / reject。
          return new Promise((resolve, reject) => {
            axiosAuth
              .post("/refresh")
              .then(() => {
                processQueue(null);
                axiosAuth(originalRequest).then(resolve).catch(reject);
              })
              .catch((refreshError) => {
                processQueue(refreshError, null);
                setAuth(null); // clear auth state
                reject(refreshError); // fail the original promise chain
              })
              .finally(() => {
                isRefreshingRef.current = false;
              });
          });
        }
        return Promise.reject(error); // 其他错误直接拒绝，不处理。
      },
    );

    // 组件卸载或依赖变化时，移除拦截器，避免重复注册。
    return () => {
      axiosAuth.interceptors.response.eject(responseInterceptorId);
    };
  }, [auth]);

  // axiosAuth.interceptors.request.use((config) => {
  //   if (auth?.token) {
  //     config.headers.Authorization = `Bearer ${auth.token}`;
  //   }
  //   return config;
  // });
  return axiosAuth;
};

export default useAxiosPrivate;
