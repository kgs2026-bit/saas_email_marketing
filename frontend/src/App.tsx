import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth-store';
import Layout from './components/layout/Layout';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CampaignsPage from './pages/Campaigns/CampaignsPage';
import CampaignDetailPage from './pages/Campaigns/CampaignDetailPage';
import ContactsPage from './pages/Contacts/ContactsPage';
import InboxesPage from './pages/Inboxes/InboxesPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import TeamPage from './pages/Team/TeamPage';
import BillingPage from './pages/Billing/BillingPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import OAuthCallback from './pages/Auth/OAuthCallback';

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={<LandingPage />}
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />
        }
      />
      <Route
        path="/auth/callback"
        element={<OAuthCallback />}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <ProtectedRoute>
            <Layout>
              <CampaignsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns/:campaignId"
        element={
          <ProtectedRoute>
            <Layout>
              <CampaignDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <Layout>
              <ContactsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inboxes"
        element={
          <ProtectedRoute>
            <Layout>
              <InboxesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <AnalyticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <Layout>
              <TeamPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <Layout>
              <BillingPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Workspace specific routes (dynamic) */}
      <Route
        path="/workspace/:workspaceSlug/dashboard"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="/workspace/:workspaceSlug/campaigns"
        element={<Navigate to="/campaigns" replace />}
      />
      <Route
        path="/workspace/:workspaceSlug/campaigns/:campaignId"
        element={<Navigate to={`../campaigns/$2`} replace />}
      />
      <Route
        path="/workspace/:workspaceSlug/contacts"
        element={<Navigate to="/contacts" replace />}
      />
      <Route
        path="/workspace/:workspaceSlug/inboxes"
        element={<Navigate to="/inboxes" replace />}
      />
      <Route
        path="/workspace/:workspaceSlug/analytics"
        element={<Navigate to="/analytics" replace />}
      />
      <Route
        path="/workspace/:workspaceSlug/team"
        element={<Navigate to="/team" replace />}
      />
      <Route
        path="/workspace/:workspaceSlug/billing"
        element={<Navigate to="/billing" replace />}
      />
      <Route
        path="/workspace/:workspaceSlug/settings"
        element={<Navigate to="/settings" replace />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
