import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Goal {
  id: string;
  user_id: string;
  nome: string;
  valor_total: number;
  prazo: string | null;
  criado_em: string;
}

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .order('criado_em', { ascending: false });

    if (!error && data) {
      setGoals(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  return { goals, loading, fetchGoals };
};
