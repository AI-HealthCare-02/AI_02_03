import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useAuthStore } from "../store/authStore";

const PUBLIC_PATHS = ["/login", "/signup", "/onboarding"];

export default function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p));
    if (!isPublic && (localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token"))) {
      fetchMe().catch(() => {
        // 401 → api.ts 인터셉터가 토큰 삭제 + /login 리다이렉트 처리
      });
    }
  }, [fetchMe]);

  return <RouterProvider router={router} />;
}