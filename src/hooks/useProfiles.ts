import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  tipo: 'PF' | 'PJ';
  cor: string;
  criado_em: string;
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProfiles = async () => {
    if (!user) return;
    if (profiles.length === 0) setLoading(true); // Só mostra carregamento na primeira vez
    const { data, error } = await supabase
      .from('perfis_conta')
      .select('*')
      .order('criado_em', { ascending: true });

    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const createProfile = async (nome: string, tipo: 'PF' | 'PJ', cor: string = '#820AD1') => {
    if (!user) return;
    const { data, error } = await supabase
      .from('perfis_conta')
      .insert({ user_id: user.id, nome, tipo, cor })
      .select()
      .single();
    
    if (!error && data) {
      setProfiles(prev => [...prev, data]);
      return data;
    }
    return { error };
  };

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  return { profiles, loading, fetchProfiles, createProfile };
};
