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
  } catch {
    // 토큰 만료 등 → api.ts 인터셉터가 처리
  }
  return null;
}

import { Challenges } from "./pages/Challenges";
import { Education } from "./pages/Education";
import { Schedule } from "./pages/Schedule";
import { AccountManagement } from "./pages/AccountManagement";
import { MyInfo } from "./pages/MyInfo";
import { ChangeNickname } from "./pages/ChangeNickname";
import { ChangePassword } from "./pages/ChangePassword";
import { DeleteAccount } from "./pages/DeleteAccount";
import { NotificationSettings } from "./pages/NotificationSettings";
import { HealthDataManagement } from "./pages/HealthDataManagement";
import { HealthRecord } from "./pages/HealthRecord";
import { Profile } from "./pages/Profile";
import { Diet } from "./pages/Diet";
import { Settings } from "./pages/Settings";
import { Signup } from "./pages/Signup";
import { Login } from "./pages/Login";
import { SocialCallback } from "./pages/SocialCallback";
import { OnboardingStep0 } from "./pages/OnboardingStep0";
import { OnboardingStep05 } from "./pages/OnboardingStep05";
import { OnboardingStep1 } from "./pages/OnboardingStep1";
import { OnboardingStep2 } from "./pages/OnboardingStep2";
import { OnboardingStep3 } from "./pages/OnboardingStep3";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    loader: requireAuth,
    children: [
      { index: true, Component: Home },
      { path: "challenges", Component: Challenges },
      { path: "education", Component: Education },
      { path: "schedule", Component: Schedule },
      { path: "diet", Component: Diet },
      { path: "health-record", Component: HealthRecord },
      { path: "settings", Component: Settings },
      { path: "mypage/account", Component: AccountManagement },
      { path: "mypage/account/info", Component: MyInfo },
      { path: "mypage/account/nickname", Component: ChangeNickname },
      { path: "mypage/account/password", Component: ChangePassword },
      { path: "mypage/account/delete", Component: DeleteAccount },
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
