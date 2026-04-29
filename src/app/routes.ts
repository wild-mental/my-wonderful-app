import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { CompareResults } from "./components/CompareResults";
import { ProductDetail } from "./components/ProductDetail";
import { ShareLanding } from "./components/ShareLanding";
import { Signup } from "./components/Signup";
import { AdminLogin } from "./components/AdminLogin";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminRegistrationRequests } from "./components/AdminRegistrationRequests";
import { AdminErrorReports } from "./components/AdminErrorReports";
import { AdminLayout } from "./components/AdminLayout";
import { LandingPage } from "./components/LandingPage";

export const router = createBrowserRouter([
  /* ── 랜딩페이지 (전면 진입점) ── */
  { path: "/", Component: LandingPage },

  /* ── 서비스 앱 (CTA 통해 진입) ── */
  {
    path: "/app",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "compare/:searchTerm", Component: CompareResults },
      { path: "product/:productId", Component: ProductDetail },
      { path: "share/:shareId", Component: ShareLanding },
    ],
  },
  { path: "/signup", Component: Signup },
  { path: "/admin/login", Component: AdminLogin },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { path: "dashboard", Component: AdminDashboard },
      { path: "registration-requests", Component: AdminRegistrationRequests },
      { path: "error-reports", Component: AdminErrorReports },
    ],
  },
]);
