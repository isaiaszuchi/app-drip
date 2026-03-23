import React, { useState, useEffect } from 'react';
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

  const [showTimeoutError, setShowTimeoutError] = useState(false);

  useEffect(() => {
    if (authLoading || profileLoading) {
      const timer = setTimeout(() => {
        setShowTimeoutError(true);
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    } else {
      setShowTimeoutError(false);
    }
  }, [authLoading, profileLoading]);

  if (showTimeoutError) {
    const url = import.meta.env.VITE_SUPABASE_URL || 'NÃO DEFINIDA';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'NÃO DEFINIDA';

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Erro de Conexão</h2>
        <p className="text-gray-600 mb-4">O sistema está demorando muito para responder.</p>
        
        <div className="bg-gray-50 p-4 rounded-xl mb-6 text-xs font-mono text-gray-400 break-all max-w-sm">
          <p className="mb-1">URL: {url.substring(0, 15)}...</p>
          <p>KEY: {key.substring(0, 15)}...</p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="bg-nubank-purple text-white px-6 py-2 rounded-full font-medium hover:bg-opacity-90 transition-all mb-4"
        >
          Tentar Novamente
        </button>
        <p className="text-xs text-gray-400">Verifique as chaves na Vercel</p>
      </div>
    );
  }

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
