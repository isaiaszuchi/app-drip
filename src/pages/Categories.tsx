import React, { useState, useMemo } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  ChevronRight, 
  ChevronDown, 
  Tag as TagIcon,
  Search,
  Box,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CategoriesPage: React.FC = () => {
  const { categories, loading: loadingCats } = useCategories();
  const { transactions, loading: loadingTrans } = useTransactions();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  // Filtro de Período
  const filteredTransactions = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return transactions.filter(t => {
      const date = parseISO(t.data);
      return isWithinInterval(date, { start, end });
    });
  }, [transactions, selectedDate]);

  // Agrupamento principal por Categoria
  const statsByCat = useMemo(() => {
    const stats: Record<string, { total: number; subcats: Record<string, { total: number; transactions: any[] }> }> = {};
    
    filteredTransactions.forEach(t => {
      const catId = t.categoria_id || 'unassigned';
      const subId = t.subcategory_id || 'unassigned';
      
      if (!stats[catId]) stats[catId] = { total: 0, subcats: {} };
      if (!stats[catId].subcats[subId]) stats[catId].subcats[subId] = { total: 0, transactions: [] };
      
      const val = Number(t.valor);
      stats[catId].total += val;
      stats[catId].subcats[subId].total += val;
      stats[catId].subcats[subId].transactions.push(t);
    });
    
    return stats;
  }, [filteredTransactions]);

  if (loadingCats || loadingTrans) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-purple rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Minhas Categorias</h1>
          <p className="text-sm text-gray-400 font-bold">Análise detalhada de destinos do dinheiro</p>
        </div>
        
        <div className="flex items-center bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          <select 
            value={format(selectedDate, 'yyyy-MM')}
            onChange={(e) => setSelectedDate(parseISO(e.target.value + '-01'))}
            className="bg-transparent text-xs font-black text-gray-800 outline-none cursor-pointer px-4 py-2 uppercase tracking-widest"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => {
              const date = new Date();
              date.setMonth(date.getMonth() - m);
              const val = format(date, 'yyyy-MM');
              const label = format(date, 'MMMM yyyy', { locale: ptBR });
              return <option key={val} value={val}>{label}</option>
            })}
          </select>
        </div>
      </div>

      {/* Busca */}
      <div className="nb-card bg-white p-4 border border-gray-100 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input 
            type="text" 
            placeholder="Pesquisar categoria ou transação..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-nubank-purple/20 transition-all font-sans"
          />
        </div>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 gap-4">
        {categories.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || statsByCat[c.id]).map(cat => {
          const stats = statsByCat[cat.id];
          return (
            <CategoryDetailItem 
              key={cat.id} 
              category={cat} 
              stats={stats} 
            />
          );
        })}
      </div>
    </div>
  );
};

const CategoryDetailItem: React.FC<{ category: any; stats: any }> = ({ category, stats }) => {
  const [isOpen, setIsOpen] = useState(false);
  const totalGasto = stats?.total || 0;

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all"
      >
        <div className="flex items-center gap-5">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: category.cor || '#F0F1F5' }}
          >
            <TagIcon size={28} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 tracking-tighter">{category.nome}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{category.tipo === 'entrada' ? 'RECEITA' : 'DESPESA'}</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
             <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total {isOpen ? 'do período' : ''}</p>
             <p className={clsx("text-lg font-black", totalGasto > 0 ? "text-gray-900" : "text-gray-200")}>
               {formatCurrency(totalGasto)}
             </p>
          </div>
          <ChevronDown size={20} className={clsx('text-gray-300 transition-transform duration-500', isOpen && 'rotate-180')} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-50 bg-[#FBFBFF] p-6 pt-2"
          >
            <div className="space-y-6">
              {category.subcategorias?.length > 0 ? (
                category.subcategorias.map((sub: any) => {
                  const subStats = stats?.subcats[sub.id];
                  return (
                    <SubcategorySection 
                      key={sub.id} 
                      subcategory={sub} 
                      stats={subStats} 
                      color={category.cor}
                    />
                  );
                })
              ) : (
                <div className="py-10 text-center">
                  <LayoutGrid size={32} className="mx-auto text-gray-100 mb-2" />
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhuma subcategoria vinculada</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SubcategorySection: React.FC<{ subcategory: any; stats: any; color: string }> = ({ subcategory, stats, color }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalSub = stats?.total || 0;

  return (
    <div className="space-y-3">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-gray-200 transition-all hover:scale-[1.01] group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}10` }}>
            <Box size={16} style={{ color }} />
          </div>
          <span className="text-sm font-black text-gray-700 tracking-tight">{subcategory.nome}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-black text-gray-900">{formatCurrency(totalSub)}</span>
          <ChevronRight size={16} className={clsx('text-gray-300 transition-all group-hover:translate-x-1', isExpanded && 'rotate-90')} />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-8 space-y-2 overflow-hidden"
          >
            {stats?.transactions.length > 0 ? (
              stats.transactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-white transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-nubank-purple transition-all" />
                    <div>
                      <p className="text-sm font-bold text-gray-800">{t.descricao || 'Sem descrição'}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatDate(t.data)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900">{formatCurrency(Number(t.valor))}</span>
                    <button className="p-1 px-3 bg-white rounded-lg border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-nubank-purple hover:text-white transition-all">Ver Detalhes</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] py-2 text-center border-t border-gray-100/50">Nenhum lançamento no período</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoriesPage;
