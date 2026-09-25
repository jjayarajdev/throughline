import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '@/App';
import RootLayout from '@/layouts/RootLayout';
import AuthLayout from '@/layouts/AuthLayout';
import RecruiterLayout from '@/layouts/RecruiterLayout';
import CompanyLayout from '@/layouts/CompanyLayout';
import AdminLayout from '@/layouts/AdminLayout';
import { GuestGuard, FeatureGate } from '@/components/guards';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterRecruiterPage from '@/pages/RegisterRecruiterPage';
import RegisterCompanyPage from '@/pages/RegisterCompanyPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import ForbiddenPage from '@/pages/ForbiddenPage';
import NotFoundPage from '@/pages/NotFoundPage';
import RecruiterDashboard from '@/pages/recruiter/RecruiterDashboard';
import RecruiterProfile from '@/pages/recruiter/RecruiterProfile';
import BrowseRoles from '@/pages/recruiter/BrowseRoles';
import RoleDetailPublic from '@/pages/recruiter/RoleDetailPublic';
import SubmitCandidate from '@/pages/recruiter/SubmitCandidate';
import MySubmissions from '@/pages/recruiter/MySubmissions';
import SubmissionDetail from '@/pages/recruiter/SubmissionDetail';
import RecruiterWallet from '@/pages/recruiter/RecruiterWallet';
import RecruiterEarnings from '@/pages/recruiter/RecruiterEarnings';
import RecruiterPayouts from '@/pages/recruiter/RecruiterPayouts';
import CompanyDashboard from '@/pages/company/CompanyDashboard';
import CompanyProfile from '@/pages/company/CompanyProfile';
import RolesList from '@/pages/company/RolesList';
import RoleCreate from '@/pages/company/RoleCreate';
import RoleDetail from '@/pages/company/RoleDetail';
import RoleEdit from '@/pages/company/RoleEdit';
import CompanyWallet from '@/pages/company/CompanyWallet';
import CompanyFund from '@/pages/company/CompanyFund';
import CompanyTransactions from '@/pages/company/CompanyTransactions';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminRoles from '@/pages/admin/AdminRoles';
import AdminEarnings from '@/pages/admin/AdminEarnings';
import AdminPayouts from '@/pages/admin/AdminPayouts';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminRoleReview from '@/pages/admin/AdminRoleReview';
import AdminRoleDetail from '@/pages/admin/AdminRoleDetail';
import AdminUserDetail from '@/pages/admin/AdminUserDetail';
import AdminCountryConfig from '@/pages/admin/AdminCountryConfig';
import CompanySavings from '@/pages/company/CompanySavings';
import CompanyAnalytics from '@/pages/company/CompanyAnalytics';
import RecruiterPerformance from '@/pages/recruiter/RecruiterPerformance';
import AdminIntelligence from '@/pages/admin/AdminIntelligence';
import AdminAiDashboard from '@/pages/admin/AdminAiDashboard';
import Notifications from '@/pages/shared/Notifications';

/**
 * Top-level route tree.
 *
 * Wave 5 introduces nested layouts:
 *   - Public routes (home, 403, 404) render inside RootLayout.
 *   - Auth / email flows render inside AuthLayout (slim centered card).
 *   - Role workspaces live under /r (recruiter), /c (company), /a (admin)
 *     and each layout composes AuthGuard + RoleGuard + AppShell.
 *
 * `<App />` is the theme-sync wrapper that sits above every layout.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // ---- Public chrome ----
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: '403', element: <ForbiddenPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      // ---- Auth / email flows (guest only) ----
      {
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: (
              <GuestGuard>
                <LoginPage />
              </GuestGuard>
            ),
          },
          {
            path: 'register',
            element: <Navigate to="/register/recruiter" replace />,
          },
          {
            path: 'register/recruiter',
            element: (
              <GuestGuard>
                <RegisterRecruiterPage />
              </GuestGuard>
            ),
          },
          {
            path: 'register/company',
            element: (
              <GuestGuard>
                <RegisterCompanyPage />
              </GuestGuard>
            ),
          },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
          { path: 'verify-email', element: <VerifyEmailPage /> },
        ],
      },
      // ---- Recruiter workspace (blue, guarded by layout) ----
      {
        path: 'r',
        element: <RecruiterLayout />,
        children: [
          { index: true, element: <Navigate to="/r/dashboard" replace /> },
          { path: 'dashboard', element: <RecruiterDashboard /> },
          { path: 'profile', element: <RecruiterProfile /> },
          { path: 'roles', element: <BrowseRoles /> },
          { path: 'roles/:roleId/submit', element: <SubmitCandidate /> },
          { path: 'roles/:id', element: <RoleDetailPublic /> },
          { path: 'submissions', element: <MySubmissions /> },
          { path: 'submissions/:id', element: <SubmissionDetail /> },
          { path: 'wallet', element: <RecruiterWallet /> },
          { path: 'earnings', element: <RecruiterEarnings /> },
          { path: 'payouts', element: <RecruiterPayouts /> },
          { path: 'performance', element: <FeatureGate flag="analytics_dashboards" fallback="/r/dashboard"><RecruiterPerformance /></FeatureGate> },
          { path: 'notifications', element: <Notifications /> },
        ],
      },
      // ---- Company workspace (green) ----
      {
        path: 'c',
        element: <CompanyLayout />,
        children: [
          { index: true, element: <Navigate to="/c/dashboard" replace /> },
          { path: 'dashboard', element: <CompanyDashboard /> },
          { path: 'profile', element: <CompanyProfile /> },
          { path: 'roles', element: <RolesList /> },
          { path: 'roles/new', element: <RoleCreate /> },
          { path: 'roles/:id', element: <RoleDetail /> },
          { path: 'roles/:id/edit', element: <RoleEdit /> },
          { path: 'wallet', element: <CompanyWallet /> },
          { path: 'wallet/fund', element: <CompanyFund /> },
          { path: 'transactions', element: <CompanyTransactions /> },
          { path: 'savings', element: <CompanySavings /> },
          { path: 'analytics', element: <FeatureGate flag="analytics_dashboards" fallback="/c/dashboard"><CompanyAnalytics /></FeatureGate> },
          { path: 'notifications', element: <Notifications /> },
        ],
      },
      // ---- Admin workspace (purple) ----
      {
        path: 'a',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/a/dashboard" replace /> },
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'users/:id', element: <AdminUserDetail /> },
          { path: 'roles', element: <AdminRoles /> },
          { path: 'roles/:id', element: <AdminRoleDetail /> },
          { path: 'review', element: <AdminRoleReview /> },
          { path: 'countries', element: <AdminCountryConfig /> },
          { path: 'earnings', element: <AdminEarnings /> },
          { path: 'payouts', element: <AdminPayouts /> },
          { path: 'intelligence', element: <FeatureGate flag="analytics_dashboards" fallback="/a/dashboard"><AdminIntelligence /></FeatureGate> },
          { path: 'ai', element: <FeatureGate flag="analytics_ai" fallback="/a/dashboard"><AdminAiDashboard /></FeatureGate> },
          { path: 'settings', element: <AdminSettings /> },
          { path: 'notifications', element: <Notifications /> },
        ],
      },
    ],
  },
]);
