import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Hackathon from "../components/Hackathon";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyEmail from "../pages/VerifyEmail";
import ForgotPassword from "../pages/ForgotPassword";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import SearchPage from "../pages/SearchPage";

import { getStoredToken, getStoredUser } from "../utils/auth";
import { logoutUser } from "../utils/logout";

const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const OrganizerDashboard = lazy(() => import("../pages/OrganizerDashboard"));
const CoordinatorDashboard = lazy(() => import("../pages/CoordinatorDashboard"));
const StudentDashboard = lazy(() => import("../pages/StudentDashboard"));
const MyCertificates = lazy(() => import("../pages/MyCertificates"));

function ProtectedRoute({ children, requiredRole }) {
  const user = getStoredUser();
  const token = getStoredToken();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = Array.isArray(requiredRole)
    ? requiredRole
    : requiredRole
      ? [requiredRole]
      : null;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-white dark:from-gray-900 dark:via-purple-900/20 dark:to-black transition-colors duration-500">
      <Header variant="public" />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const hideTopNav = location.pathname.startsWith("/student-dashboard");

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {!hideTopNav && (
        <Header
          activePage={null}
          setActivePage={() => {}}
          user={user}
          onLogout={handleLogout}
        />
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/hackathon" element={<Hackathon />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Navigate to="/register" replace />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<DashboardLayout />}>
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="MAIN_ADMIN">
                <Suspense fallback={<div className="p-8 text-center">Loading Dashboard...</div>}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer-dashboard"
            element={
              <ProtectedRoute requiredRole="ORGANIZER">
                <Suspense fallback={<div className="p-8 text-center">Loading Dashboard...</div>}>
                  <OrganizerDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/coordinator-dashboard"
            element={
              <ProtectedRoute requiredRole="STUDENT_COORDINATOR">
                <Suspense fallback={<div className="p-8 text-center">Loading Dashboard...</div>}>
                  <CoordinatorDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <Suspense fallback={<div className="p-8 text-center">Loading Dashboard...</div>}>
                  <StudentDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-dashboard/my-certificates"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <Suspense fallback={<div className="p-8 text-center">Loading Certificates...</div>}>
                  <MyCertificates />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
