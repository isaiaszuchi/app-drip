'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { useActiveProfile } from '../src/contexts/ProfileContext';
import Auth from '../src/pages/Auth';
import ProfilePicker from '../src/pages/ProfilePicker';
import Dashboard from '../src/pages/Dashboard';
import MainLayout from './MainLayout';

export default function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { activeProfile, loading: profileLoading } = useActiveProfile();
  const [showTimeoutError, setShowTimeoutError] = useState(false);

  useEffect(() => {
    if (authLoading || profileLoading) {
      const timer = setTimeout(() => {
        setShowTimeoutError(true);
      }, 15000); // 15 seconds to be safe on first load
      return () => clearTimeout(timer);
    } else {
      setShowTimeoutError(false);
    }
  }, [authLoading, profileLoading]);

  if (showTimeoutError) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NÃO DEFINIDA';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NÃO DEFINIDA';

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Erro de Conexão (Next.js)</h2>
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
        <p className="text-xs text-gray-400">Verifique as chaves na Vercel (Padrão NEXT_PUBLIC_)</p>
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
    return <Auth />;
  }

  if (!activeProfile) {
    return <ProfilePicker />;
  }

  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
}
