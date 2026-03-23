import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProfileProvider, useActiveProfile } from './contexts/ProfileContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import QuickEntry from './pages/QuickEntry';
import History from './pages/History';
import CategoriesPage from './pages/Categories';
import GoalsPage from './pages/Goals';
import CardsPage from './pages/Cards';
import SettingsPage from './pages/Settings';
import ReportsPage from './pages/Reports';
import ProfilePicker from './pages/ProfilePicker';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { activeProfile, loading: profileLoading } = useActiveProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-nubank-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  if (!activeProfile) {
    return <ProfilePicker />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="novo" element={<QuickEntry />} />
        <Route path="editar/:id" element={<QuickEntry />} />
        <Route path="historico" element={<History />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="faturas" element={<CardsPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
        <Route path="metas" element={<GoalsPage />} />
        <Route path="config" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <AppContent />
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
