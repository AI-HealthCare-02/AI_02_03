import { createBrowserRouter, redirect } from "react-router";
import { Home } from "./pages/Home";

async function requireAuth() {
  const token = localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token");
  if (!token) {
    return redirect("/login");
  }
  try {
    const { authService: api } = await import("../services/auth");
    const user = await api.me();
    if (!user.is_onboarded) {
      return redirect("/onboarding/step0");
    }
    const apiClient = (await import("../lib/api")).default;
    const predictions = await apiClient.get("/api/v1/predictions/me");
    if (!predictions.data || predictions.data.length === 0) {
      return redirect("/onboarding/step0");
    }
  } catch {
    // 토큰 만료 등 → api.ts 인터셉터가 처리
  }
  return null;
}
import { Challenges } from "./pages/Challenges";
import { Diet } from "./pages/Diet";
import { Education } from "./pages/Education";
import { Progress } from "./pages/Progress";
import { Schedule } from "./pages/Schedule";
import { MyPage } from "./pages/MyPage";
import { AccountManagement } from "./pages/AccountManagement";
import { MyInfo } from "./pages/MyInfo";
import { ChangeNickname } from "./pages/ChangeNickname";
import { ChangePassword } from "./pages/ChangePassword";
import { DeleteAccount } from "./pages/DeleteAccount";
import { ActivityHistory } from "./pages/ActivityHistory";
import { NotificationSettings } from "./pages/NotificationSettings";
import { Settings } from "./pages/Settings";
import { HealthDataManagement } from "./pages/HealthDataManagement";
import { Profile } from "./pages/Profile";
import { Signup } from "./pages/Signup";
import { Login } from "./pages/Login";
import { SocialCallback } from "./pages/SocialCallback";
import { OnboardingStep0 } from "./pages/OnboardingStep0";
import { OnboardingStep05 } from "./pages/OnboardingStep05";
import { OnboardingStep1 } from "./pages/OnboardingStep1";
import { OnboardingStep2 } from "./pages/OnboardingStep2";
import { OnboardingStep3 } from "./pages/OnboardingStep3";
import { Layout } from "./components/Layout";
import { Terms } from "./pages/Terms";
import { Privacy } from "./pages/Privacy";
import { ResetPassword } from "./pages/ResetPassword";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    loader: requireAuth,
    children: [
      { index: true, Component: Home },
      { path: "challenges", Component: Challenges },
      { path: "diet", Component: Diet },
      { path: "education", Component: Education },
      { path: "progress", Component: Progress },
      { path: "schedule", Component: Schedule },
      { path: "mypage", Component: MyPage },
      { path: "mypage/account", Component: AccountManagement },
      { path: "mypage/account/info", Component: MyInfo },
      { path: "mypage/account/nickname", Component: ChangeNickname },
      { path: "mypage/account/password", Component: ChangePassword },
      { path: "mypage/account/delete", Component: DeleteAccount },
      { path: "mypage/history", Component: ActivityHistory },
      { path: "mypage/settings", Component: Settings },
      { path: "mypage/notifications", Component: NotificationSettings },
      { path: "mypage/survey", Component: HealthDataManagement },
      { path: "mypage/profile", Component: Profile },
    ],
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/reset-password",
    Component: ResetPassword,
  },
  {
  path: "/privacy",
  Component: Privacy,
  },
  {
  path: "/terms",
  Component: Terms,
  },
  {
    path: "/auth/social/callback",
    Component: SocialCallback,
  },
  {
    path: "/onboarding/step0",
    Component: OnboardingStep0,
  },
  {
    path: "/onboarding/step0-5",
    Component: OnboardingStep05,
  },
  {
    path: "/onboarding/step1",
    Component: OnboardingStep1,
  },
  {
    path: "/onboarding/step2",
    Component: OnboardingStep2,
  },
  {
    path: "/onboarding/step3",
    Component: OnboardingStep3,
  },
]);