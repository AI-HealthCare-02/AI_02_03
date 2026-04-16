import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Challenges } from "./pages/Challenges";
import { Education } from "./pages/Education";
import { Progress } from "./pages/Progress";
import { Schedule } from "./pages/Schedule";
import { MyPage } from "./pages/MyPage";
import { AccountManagement } from "./pages/AccountManagement";
import { MyInfo } from "./pages/MyInfo";
import { ChangeNickname } from "./pages/ChangeNickname";
import { ChangePassword } from "./pages/ChangePassword";
import { DeleteAccount } from "./pages/DeleteAccount";
import { HealthDataManagement } from "./pages/HealthDataManagement";
import { ActivityHistory } from "./pages/ActivityHistory";
import { NotificationSettings } from "./pages/NotificationSettings";
import { Signup } from "./pages/Signup";
import { Login } from "./pages/Login";
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
    children: [
      { index: true, Component: Home },
      { path: "challenges", Component: Challenges },
      { path: "education", Component: Education },
      { path: "progress", Component: Progress },
      { path: "schedule", Component: Schedule },
      { path: "mypage", Component: MyPage },
      { path: "mypage/account", Component: AccountManagement },
      { path: "mypage/account/info", Component: MyInfo },
      { path: "mypage/account/nickname", Component: ChangeNickname },
      { path: "mypage/account/password", Component: ChangePassword },
      { path: "mypage/account/delete", Component: DeleteAccount },
      { path: "mypage/survey", Component: HealthDataManagement },
      { path: "mypage/history", Component: ActivityHistory },
      { path: "mypage/notifications", Component: NotificationSettings },
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