import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { ProductsPage } from './pages/ProductsPage';
import { RecipesPage } from './pages/RecipesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ModeracaoPage } from './pages/ModeracaoPage';
import { TrocarSenhaPage } from './pages/TrocarSenhaPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AbbreviationsPage } from './pages/AbbreviationsPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { SystemConfigPage } from './pages/SystemConfigPage';
import { LogsPage } from './pages/LogsPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/trocar-senha"
        element={
          <ProtectedRoute>
            <TrocarSenhaPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes */}
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
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <UsersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <UserDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes"
        element={
          <ProtectedRoute>
            <Layout>
              <RecipesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
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

      {/* Redirect to dashboard or login */}
      <Route
        path="/moderacao"
        element={
          <ProtectedRoute>
            <Layout>
              <ModeracaoPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <Layout>
              <AuditLogsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/data-management"
        element={
          <ProtectedRoute>
            <Layout>
              <DataManagementPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/compras"
        element={
          <ProtectedRoute>
            <Layout>
              <PurchasesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/knowledge-base"
        element={
          <ProtectedRoute>
            <Layout>
              <KnowledgeBasePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/abbreviations"
        element={
          <ProtectedRoute>
            <Layout>
              <AbbreviationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ingredients"
        element={
          <ProtectedRoute>
            <Layout>
              <IngredientsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/system-config"
        element={
          <ProtectedRoute>
            <Layout>
              <SystemConfigPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <Layout>
              <LogsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <Toaster
            position="bottom-right"
            expand={true}
            richColors
            closeButton
            theme="light"
            className="dark:bg-gray-900 dark:text-white"
          />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
