import React, { useState, useMemo } from 'react';
import type { Transaction } from '../hooks/useTransactions';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useFamily } from '../hooks/useFamily';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Search, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck,
  History as HistoryIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  CreditCard,
  QrCode,
  Wallet,
  Coins,
  User,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const History: React.FC = () => {
  const { transactions, loading, deleteTransaction } = useTransactions();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const { categories } = useCategories();
  const { members } = useFamily();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Estados de Filtro
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterSubCat, setFilterSubCat] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterCard, setFilterCard] = useState<string>('all');
  const [filterPerson, setFilterPerson] = useState<string>('all');
  
  const [showFilters, setShowFilters] = useState(false);

  // Período selecionado
  const filteredTransactionsByDate = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    
    return transactions.filter(t => {
      // Forçar o parse das datas para o horário local (meia-noite) para evitar o erro de fuso horário (-1 dia)
      // O split('T')[0] pega apenas 'YYYY-MM-DD' caso o Supabase mande timestamp completo
      const dateStr = t.data.split('T')[0];
      const date = parseISO(`${dateStr}T00:00:00`);
      return isWithinInterval(date, { start, end });
    });
  }, [transactions, selectedDate]);

  // Filtros Cruzados
  const filteredTransactions = useMemo(() => {
    return filteredTransactionsByDate.filter(t => {
      const matchType = filterType === 'all' || t.tipo === filterType;
      const matchCat = filterCat === 'all' || t.categoria_id === filterCat;
      const matchSubCat = filterSubCat === 'all' || t.subcategory_id === filterSubCat;
      const matchMethod = filterMethod === 'all' || t.forma_pagamento === filterMethod;
      const matchCard = filterCard === 'all' || t.cartao_id === filterCard;
      const matchPerson = filterPerson === 'all' || t.integrante_id === filterPerson;
      
      const matchSearch = searchTerm === '' ||
        t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.categorias?.nome || t.categoria)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.subcategorias?.nome || t.subcategoria)?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchType && matchCat && matchSubCat && matchMethod && matchCard && matchPerson && matchSearch;
    });
  }, [filteredTransactionsByDate, filterType, filterCat, filterSubCat, filterMethod, filterCard, filterPerson, searchTerm]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
      if (!groups[t.data]) groups[t.data] = [];
      groups[t.data].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este lançamento?')) {
      await deleteTransaction(id);
    }
  };

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  const clearFilters = () => {
    setFilterType('all');
    setFilterCat('all');
    setFilterSubCat('all');
    setFilterMethod('all');
    setFilterCard('all');
    setFilterPerson('all');
  };

  const activeFilterCount = [filterType, filterCat, filterSubCat, filterMethod, filterCard, filterPerson].filter(f => f !== 'all').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-nubank-purple rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 px-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Meu Extrato</h1>
          <p className="text-sm text-gray-500 font-medium tracking-tight">Acompanhe cada centavo em detalhe</p>
        </div>
        
        <div className="flex items-center bg-gray-900 text-white rounded-2xl p-1.5 shadow-xl sm:min-w-[220px] justify-between">
          <button onClick={handlePrevMonth} className="p-2.5 hover:bg-white/10 rounded-full transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="px-2 text-[10px] font-bold uppercase tracking-widest text-center">
            {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
          </div>
          <button onClick={handleNextMonth} className="p-2.5 hover:bg-white/10 rounded-full transition-all">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="O que você está procurando?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-none rounded-2xl pl-16 pr-6 py-4.5 text-sm font-semibold shadow-sm focus:ring-4 focus:ring-nubank-purple/5 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "p-4 px-6 rounded-2xl shadow-sm transition-all flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest relative",
              showFilters || activeFilterCount > 0 ? "bg-nubank-purple text-white shadow-purple-200" : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
            )}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] ring-4 ring-gray-50">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Modal de Filtros Avançados */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="nb-card bg-gray-900 text-white p-8 space-y-10 rounded-3xl shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-purple-400">Filtragem Dinâmica</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Refine seus lançamentos</p>
                 </div>
                 <button onClick={clearFilters} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Limpar Tudo</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 {/* Tipo */}
                 <div className="space-y-3 text-left">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Fluxo</label>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-xs font-bold outline-none cursor-pointer focus:border-purple-400 transition-all">
                      <option value="all" className="bg-gray-800">Todos os Tipos</option>
                      <option value="entrada" className="bg-gray-800">Receitas (+)</option>
                      <option value="saida" className="bg-gray-800">Gastos (-)</option>
                      <option value="reserva" className="bg-gray-800">Reservas (R$)</option>
                    </select>
                 </div>

                 {/* Categoria */}
                 <div className="space-y-3 text-left">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Seção / Categoria</label>
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-xs font-bold outline-none cursor-pointer focus:border-purple-400 transition-all">
                      <option value="all" className="bg-gray-800">Qualquer Categoria</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-gray-800">{cat.nome}</option>
                      ))}
                    </select>
                 </div>

                 {/* Pessoa */}
                 <div className="space-y-3 text-left">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Para quem?</label>
                    <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-xs font-bold outline-none cursor-pointer focus:border-purple-400 transition-all text-white">
                      <option value="all" className="bg-gray-800 text-white">Todas as Pessoas</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id} className="bg-gray-800 text-white">{m.nome}</option>
                      ))}
                    </select>
                 </div>
              </div>

              <button 
                onClick={() => setShowFilters(false)}
                className="w-full py-5 bg-white text-gray-900 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-purple-100 transition-all"
              >
                Atualizar Resultados
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista agrupada */}
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {Object.keys(groupedTransactions).length > 0 ? (
            Object.keys(groupedTransactions)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .map((date, idx) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.5) }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4 px-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(date)}</span>
                    <div className="flex-1 h-[1px] bg-gray-100" />
                  </div>

                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                    {groupedTransactions[date].map(t => (
                      <TransactionRow 
                        key={t.id} 
                        transaction={t} 
                        onDelete={() => handleDelete(t.id)} 
                        onEdit={() => navigate(`/editar/${t.id}`)}
                        members={members} 
                      />
                    ))}
                  </div>
                </motion.div>
              ))
          ) : (
             <div className="nb-card bg-white flex flex-col items-center py-32 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
               <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                 <HistoryIcon size={40} className="text-gray-200" strokeWidth={1} />
               </div>
               <h3 className="text-xl font-bold text-gray-900 tracking-tight">Sem Lançamentos</h3>
               <p className="text-sm text-gray-400 mt-2 max-w-[280px] font-medium">Não encontramos nada com esses filtros ou neste período.</p>
               <button onClick={clearFilters} className="mt-8 text-nubank-purple text-[10px] font-bold uppercase tracking-[0.2em] hover:underline">Limpar Filtros</button>
             </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const TransactionRow: React.FC<{ transaction: any; onDelete: () => void, onEdit: () => void, members: any[] }> = ({ transaction: t, onDelete, onEdit, members }) => {
  const configs = {
    entrada: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50/50', sign: '+' },
    saida: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50/50', sign: '-' },
    reserva: { icon: ShieldCheck, color: 'text-nubank-purple', bg: 'bg-purple-50/50', sign: '·' },
  };
  const config = configs[t.tipo as keyof typeof configs];
  
  const MethodIcon = useMemo(() => {
    switch(t.forma_pagamento) {
      case 'pix': return QrCode;
      case 'credito': return CreditCard;
      case 'debito': return Wallet;
      case 'dinheiro': return Coins;
      default: return null;
    }
  }, [t.forma_pagamento]);

  const personName = useMemo(() => {
     if (!t.integrante_id) return null;
     return members.find(m => m.id === t.integrante_id)?.nome;
  }, [t.integrante_id, members]);

  return (
    <div className="group flex items-center justify-between py-6 px-6 hover:bg-gray-50 transition-all duration-300">
      <div className="flex items-center gap-5">
        <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform', config.bg)}>
          <config.icon size={20} className={config.color} strokeWidth={2.5} />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-gray-900 tracking-tight group-hover:text-nubank-purple transition-all">
            {t.descricao || t.categorias?.nome || 'Lançamento DRIP'}
          </p>
          <div className="flex items-center gap-3">
             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.categorias?.nome || 'Geral'}</span>
             {personName && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-900/5 text-gray-500 rounded-md">
                   <User size={10} />
                   <span className="text-[9px] font-bold uppercase tracking-wider">{personName}</span>
                </div>
             )}
             {MethodIcon && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-md text-gray-300">
                   <MethodIcon size={10} />
                </div>
             )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className={clsx('text-base font-bold tracking-tight', config.color)}>
            {config.sign} {formatCurrency(Number(t.valor))}
          </p>
          {t.cartoes && (
            <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-1">{t.cartoes.nome}</p>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-3 text-gray-200 hover:text-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
          >
            <Edit3 size={18} />
          </button>
          
          <button
            onClick={onDelete}
            className="p-3 text-gray-200 hover:text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;
