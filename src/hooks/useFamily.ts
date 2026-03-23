import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useActiveProfile } from '../contexts/ProfileContext';

export interface FamilyMember {
  id: string;
  perfil_id: string;
  nome: string;
  criado_em: string;
}

export function useFamily() {
  const { activeProfile } = useActiveProfile();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    if (!activeProfile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('integrantes_familia')
      .select('*')
      .eq('perfil_id', activeProfile.id)
      .order('nome', { ascending: true });

    if (!error && data) {
      setMembers(data);
    }
    setLoading(false);
  };

  const addMember = async (nome: string) => {
    if (!activeProfile || !nome) return;
    const { data, error } = await supabase
      .from('integrantes_familia')
      .insert({ perfil_id: activeProfile.id, nome })
      .select()
      .single();

    if (!error && data) {
      setMembers(prev => [...prev, data]);
      return data;
    }
    return null;
  };

  const deleteMember = async (id: string) => {
    const { error } = await supabase
      .from('integrantes_familia')
      .delete()
      .eq('id', id);

    if (!error) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeProfile?.id]);

  return { members, addMember, deleteMember, loading, refresh: fetchMembers };
}
