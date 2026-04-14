import { RouterProvider } from "react-router";
import { router } from "./routes";

const PUBLIC_PATHS = ["/login", "/signup", "/onboarding"];

export default function App() {
  const isPublic = PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p));
  const hasToken = !!localStorage.getItem("access_token");

  if (!hasToken && !isPublic) {
    window.location.replace("/login");
    return null;
  }

  return <RouterProvider router={router} />;
}