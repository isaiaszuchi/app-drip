import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useActiveProfile } from '../contexts/ProfileContext';

export interface Transaction {
  id: string;
  user_id: string;
  data: string; // ISO String
  tipo: 'entrada' | 'saida' | 'reserva';
  categoria_id: string | null;
  subcategory_id: string | null;
  descricao: string | null;
  valor: number;
  forma_pagamento: 'pix' | 'debito' | 'credito' | 'dinheiro' | null;
  cartao_id: string | null;
  observacao: string | null;
  is_recorrente: boolean;
  integrante_id: string | null;
  criado_em: string;
  
  // Relacionamentos (Opcionais para evitar 400 se não existirem)
  categorias?: { id: string; nome: string; cor: string } | null;
  subcategorias?: { id: string; nome: string } | null;
  cartoes?: { id: string; nome: string; banco: string; cor: string } | null;
  integrantes_familia?: { id: string; nome: string } | null;

  // Campos legados (existentes no DB atual)
  categoria?: string | null;
  subcategoria?: string | null;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { activeProfile } = useActiveProfile();

  const fetchTransactions = async () => {
    if (!user || !activeProfile) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('perfil_id', activeProfile.id)
      .order('data', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    } else {
       console.error('Erro ao buscar transações:', error);
    }
    setLoading(false);
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transacoes')
      .delete()
      .eq('id', id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
    return { error };
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    if (!activeProfile) return;
    const { data, error } = await supabase
      .from('transacoes')
      .update(transaction)
      .eq('id', id)
      .select()
      .single();
    
    if (!error && data) {
      await fetchTransactions();
      return data;
    }
    return { error };
  };

  const addTransaction = async (transaction: Partial<Transaction>) => {
    if (!activeProfile) return;
    const { data, error } = await supabase
      .from('transacoes')
      .insert({ ...transaction, user_id: user?.id, perfil_id: activeProfile.id })
      .select()
      .single();
    if (!error && data) {
      await fetchTransactions();
      return data;
    }
    return { error };
  };

  useEffect(() => {
    if (!user) return;
    fetchTransactions();

    const channel = supabase
      .channel('transacoes_changes')
      .on(
        'postgres_changes' as any, 
        { event: '*', table: 'transacoes', filter: `user_id=eq.${user.id}` }, 
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { transactions, loading, fetchTransactions, deleteTransaction, addTransaction, updateTransaction };
};
