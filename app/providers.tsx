'use client';

import React from 'react';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ProfileProvider } from '../src/contexts/ProfileContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        {children}
      </ProfileProvider>
    </AuthProvider>
  );
}
