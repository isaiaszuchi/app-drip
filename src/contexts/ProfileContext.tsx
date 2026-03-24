'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../hooks/useProfiles';
import { useProfiles } from '../hooks/useProfiles';

interface ProfileContextType {
  activeProfile: UserProfile | null;
  setActiveProfile: (profile: UserProfile | null) => void;
  profiles: UserProfile[];
  loading: boolean;
  createProfile: (nome: string, tipo: 'PF' | 'PJ', cor?: string) => Promise<any>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profiles, loading, createProfile } = useProfiles();
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Se só houver um perfil, seleciona ele automaticamente ou recupera o último do localStorage
    const saved = localStorage.getItem('activeProfileId');
    if (saved) {
      const found = profiles.find(p => p.id === saved);
      if (found) {
        setActiveProfile(found);
        return;
      }
    }
    
    // Fallback: Se não houver seleção e tivermos perfis, deixa para escolher depois
  }, [profiles]);

  const handleSetActive = (profile: UserProfile | null) => {
    setActiveProfile(profile);
    if (profile) {
      localStorage.setItem('activeProfileId', profile.id);
    } else {
      localStorage.removeItem('activeProfileId');
    }
  };

  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfile: handleSetActive, profiles, loading, createProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useActiveProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useActiveProfile must be used within a ProfileProvider');
  }
  return context;
};
