import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useActiveProfile } from '../contexts/ProfileContext';

export interface Card {
  id: string;
  user_id: string;
  nome: string;
  banco: string;
  cor: string;
  dia_fechamento: number;
  dia_vencimento: number;
  tipo: 'credito' | 'debito' | 'outro';
  criado_em: string;
}

export const useCards = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { activeProfile } = useActiveProfile();

  const fetchCards = async () => {
    if (!user || !activeProfile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('cartoes')
      .select('*')
      .eq('perfil_id', activeProfile.id)
      .order('nome', { ascending: true });

    if (!error && data) {
      setCards(data);
    }
    setLoading(false);
  };

  const addCard = async (card: Partial<Card>) => {
    const { data, error } = await supabase
      .from('cartoes')
      .insert({ ...card, user_id: user?.id, perfil_id: activeProfile?.id })
      .select()
      .single();
    
    if (!error && data) {
      setCards(prev => [...prev, data]);
      return data;
    }
    return { error };
  };

  const deleteCard = async (id: string) => {
    const { error } = await supabase
      .from('cartoes')
      .delete()
      .eq('id', id);
    if (!error) {
      setCards(prev => prev.filter(c => c.id !== id));
    }
    return { error };
  };

  useEffect(() => {
    fetchCards();
  }, [user]);

  return { cards, loading, fetchCards, addCard, deleteCard };
};
