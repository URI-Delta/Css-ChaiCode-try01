import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useUIStore } from '../store/uiStore.js';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import ToastHost from '../components/common/ToastHost.jsx';
import ErrorBoundary from '../components/common/ErrorBoundary.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import FloatingTutor from '../features/ai-tutor/FloatingTutor.jsx';
import { Spinner, EmptyState } from '../components/common/ui.jsx';
import { Gauge } from 'lucide-react';

/* lazy pages — public */
const Landing = lazy(() => import('../features/static/Landing.jsx'));
const About = lazy(() => import('../features/static/About.jsx'));
const Privacy = lazy(() => import('../features/static/Privacy.jsx'));
const Terms = lazy(() => import('../features/static/Terms.jsx'));
const Pricing = lazy(() => import('../features/billing/Pricing.jsx'));
const Login = lazy(() => import('../features/auth/Login.jsx'));
const Register = lazy(() => import('../features/auth/Register.jsx'));
const ForgotPassword = lazy(() => import('../features/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('../features/auth/ResetPassword.jsx'));
const VerifyEmail = lazy(() => import('../features/auth/VerifyEmail.jsx'));
const NotFound = lazy(() => import('../features/static/NotFound.jsx'));

/* we split heavier authenticated clusters */
const Dashboard = lazy(() => import('../features/dashboard/Dashboard.jsx'));
const Learn = lazy(() => import('../features/learning/Learn.jsx'));
const TrackDetail = lazy(() => import('../features/learning/TrackDetail.jsx'));
const Lesson = lazy(() => import('../features/learning/Lesson.jsx'));
const Challenges = lazy(() => import('../features/challenges/Challenges.jsx'));
const ChallengeDetail = lazy(() => import('../features/challenges/ChallengeDetail.jsx'));
const Projects = lazy(() => import('../features/projects/Projects.jsx'));
const ProjectWorkspace = lazy(() => import('../features/projects/ProjectWorkspace.jsx'));
const MyProjects = lazy(() => import('../features/projects/MyProjects.jsx'));
const Playground = lazy(() => import('../features/playground/Playground.jsx'));
const SharedPlayground = lazy(() => import('../features/playground/SharedPlayground.jsx'));
const Progress = lazy(() => import('../features/progress/Progress.jsx'));
const Achievements = lazy(() => import('../features/progress/Achievements.jsx'));
const Bookmarks = lazy(() => import('../features/progress/Bookmarks.jsx'));
const Leaderboard = lazy(() => import('../features/progress/Leaderboard.jsx'));
const Notifications = lazy(() => import('../features/notifications/Notifications.jsx'));
const ProfileSettings = lazy(() => import('../features/settings/ProfileSettings.jsx'));
const SecuritySettings = lazy(() => import('../features/settings/SecuritySettings.jsx'));
const PreferencesSettings = lazy(() => import('../features/settings/PreferencesSettings.jsx'));
const Billing = lazy(() => import('../features/billing/Billing.jsx'));

/* admin */
const AdminLayout = lazy(() => import('../features/admin/AdminLayout.jsx'));
const AdminOverview = lazy(() => import('../features/admin/AdminOverview.jsx'));
const AdminUsers = lazy(() => import('../features/admin/AdminUsers.jsx'));
const AdminCourses = lazy(() => import('../features/admin/AdminCourses.jsx'));
const AdminChallenges = lazy(() => import('../features/admin/AdminChallenges.jsx'));
const AdminProjects = lazy(() => import('../features/admin/AdminProjects.jsx'));
const AdminSubscriptions = lazy(() => import('../features/admin/AdminSubscriptions.jsx'));
const AdminAiSettings = lazy(() => import('../features/admin/AdminAiSettings.jsx'));
const AdminAnalytics = lazy(() => import('../features/admin/AdminAnalytics.jsx'));
const AdminSettings = lazy(() => import('../features/admin/AdminSettings.jsx'));
const AdminAuditLogs = lazy(() => import('../features/admin/AdminAuditLogs.jsx'));

function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

function Shell({ footer }) {
  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <a href="#main" className="sr-only">Skip to content</a>
      <Navbar />
      <div id="main" className="flex-1">
        <Outlet />
      </div>
      {footer && <Footer />}
    </main>
  );
}

function PublicShell({ children, minimal }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <div className="flex-1">{children}</div>
      {!minimal && <Footer />}
    </div>
  );
}

function RequireAuth() {
  const { user, status } = useAuthStore();
  if (status === 'loading') return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function RequireAdmin({ children }) {
  const { user, status } = useAuthStore();
  if (status === 'loading') return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <AppShell>
        <div className="p-6">
          <EmptyState icon="🔒" title="Admin access required" description="Your account doesn't have permission to view this area. This check is enforced on the server too." />
        </div>
      </AppShell>
    );
  }
  return children;
}

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const scrollToTop = location.pathname;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [scrollToTop]);

  if (status === 'loading') return <Loading />;

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* public */}
            <Route element={<Shell footer />}>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Route>

            <Route path="/playground" element={<PublicShell children={<Playground />} />} />

            {/* auth pages (own narrow shell) */}
            <Route path="/login" element={<PublicShell minimal children={<Login />} />} />
            <Route path="/register" element={<PublicShell minimal children={<Register />} />} />
            <Route path="/forgot-password" element={<PublicShell minimal children={<ForgotPassword />} />} />
            <Route path="/reset-password/:token" element={<PublicShell minimal children={<ResetPassword />} />} />
            <Route path="/verify-email" element={<PublicShell minimal children={<VerifyEmail />} />} />
            <Route path="/playground/shared/:slug" element={<PublicShell minimal children={<SharedPlayground />} />} />

            {/* authenticated */}
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/:trackSlug" element={<TrackDetail />} />
              <Route path="/lesson/:lessonSlug" element={<Lesson />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/challenges/:challengeSlug" element={<ChallengeDetail />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectSlug" element={<ProjectWorkspace />} />
              <Route path="/my-projects" element={<MyProjects />} />
              <Route path="/my-projects/:id" element={<MyProjects />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings/profile" element={<ProfileSettings />} />
              <Route path="/settings/security" element={<SecuritySettings />} />
              <Route path="/settings/preferences" element={<PreferencesSettings />} />
              <Route path="/billing" element={<Billing />} />
            </Route>

            {/* admin */}
            <Route
              path="/admin/*"
              element={
                <RequireAdmin>
                  <AppShell>
                    <AdminLayout>
                      <Routes>
                        <Route index element={<AdminOverview />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="courses" element={<AdminCourses />} />
                        <Route path="challenges" element={<AdminChallenges />} />
                        <Route path="projects" element={<AdminProjects />} />
                        <Route path="subscriptions" element={<AdminSubscriptions />} />
                        <Route path="ai-settings" element={<AdminAiSettings />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="audit-logs" element={<AdminAuditLogs />} />
                      </Routes>
                    </AdminLayout>
                  </AppShell>
                </RequireAdmin>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <FloatingTutor />
      <ToastHost />
    </>
  );
}
