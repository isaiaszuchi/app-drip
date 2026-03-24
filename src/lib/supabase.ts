import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export type Database = {
  public: {
    Tables: {
      transacoes: {
        Row: {
          id: string;
          user_id: string;
          data: string;
          tipo: 'entrada' | 'saida' | 'reserva';
          categoria: string | null;
          subcategoria: string | null;
          descricao: string | null;
          valor: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          data?: string;
          tipo: 'entrada' | 'saida' | 'reserva';
          categoria?: string | null;
          subcategoria?: string | null;
          descricao?: string | null;
          valor: number;
          criado_em?: string;
        };
      };
      categorias: {
        Row: {
          id: string;
          user_id: string;
          tipo: 'entrada' | 'saida' | 'reserva';
          nome: string;
          cor: string;
          criado_em: string;
        };
      };
      subcategorias: {
        Row: {
          id: string;
          categoria_id: string;
          nome: string;
        };
      };
      metas: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          valor_total: number;
          prazo: string | null;
          criado_em: string;
        };
      };
    };
  };
};
