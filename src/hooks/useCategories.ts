import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useActiveProfile } from '../contexts/ProfileContext';

export interface Category {
  id: string;
  user_id: string;
  tipo: 'entrada' | 'saida' | 'reserva';
  nome: string;
  cor: string;
  icone: string;
  subcategorias?: Subcategory[];
  criado_em: string;
}

export interface Subcategory {
  id: string;
  categoria_id: string;
  nome: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { activeProfile } = useActiveProfile();

  const fetchCategories = async () => {
    if (!user || !activeProfile) return;
    if (categories.length === 0) setLoading(true); // Evita flicker se já tivermos dados
    const { data, error } = await supabase
      .from('categorias')
      .select('*, subcategorias(*)')
      .eq('perfil_id', activeProfile.id)
      .order('nome', { ascending: true });
 
    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const addCategory = async (nome: string, tipo: 'entrada' | 'saida' | 'reserva', cor: string, icone: string) => {
    if (!user || !activeProfile) {
       console.error("Missing user or activeProfile for category creation");
       return { error: "Usuário ou perfil não selecionado" };
    }
    const { data, error } = await supabase
      .from('categorias')
      .insert({ user_id: user.id, perfil_id: activeProfile.id, nome, tipo, cor, icone })
      .select()
      .single();
    
    if (error) {
       console.error("Error creating category:", error);
       return { error };
    }

    if (data) {
      setCategories(prev => [...prev, data]);
    }
    return { data, error: null };
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id);
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id));
    } else {
       console.error("Error deleting category:", error);
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categorias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (!error && data) {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      return { data, error: null };
    }
    if (error) console.error("Error updating category:", error);
    return { error };
  };

  const addSubcategory = async (categoria_id: string, nome: string) => {
    const { data, error } = await supabase
      .from('subcategorias')
      .insert({ categoria_id, nome })
      .select()
      .single();
    
    if (error) console.error("Error creating subcategory:", error);
    return { data, error };
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  return { categories, loading, fetchCategories, addCategory, deleteCategory, updateCategory, addSubcategory };
};
