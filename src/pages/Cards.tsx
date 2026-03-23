import React, { useState, useMemo } from 'react';
import { useCards } from '../hooks/useCards';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  CreditCard, 
  ChevronRight, 
  TrendingDown, 
  Calendar, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CardsPage: React.FC = () => {
  const { cards, loading: loadingCards } = useCards();
  const { transactions, loading: loadingTrans } = useTransactions();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const selectedCard = useMemo(() => 
    cards.find(c => c.id === selectedCardId) || cards[0]
  , [cards, selectedCardId]);

  const filteredTransactions = useMemo(() => {
    if (!selectedCard) return [];
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    return transactions.filter(t => {
      const isSameCard = t.cartao_id === selectedCard.id;
      const date = parseISO(t.data);
      return isSameCard && isWithinInterval(date, { start, end });
    });
  }, [transactions, selectedCard, selectedDate]);

  const totalInvoice = useMemo(() => 
    filteredTransactions.reduce((acc, curr) => acc + Number(curr.valor), 0)
  , [filteredTransactions]);

  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, { total: number; count: number; transactions: any[] }> = {};
    filteredTransactions.forEach(t => {
      const catName = t.categorias?.nome || t.categoria || 'Sem categoria';
      if (!grouped[catName]) grouped[catName] = { total: 0, count: 0, transactions: [] };
      grouped[catName].total += Number(t.valor);
      grouped[catName].count += 1;
      grouped[catName].transactions.push(t);
    });
    return grouped;
  }, [filteredTransactions]);

  if (loadingCards || loadingTrans) {
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
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Cartões & Faturas</h1>
          <p className="text-sm text-gray-400 font-bold">Gerencie seus limites e vencimentos</p>
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

      {/* Cards List (Desktop/Tablet) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => setSelectedCardId(card.id)}
            className={clsx(
              'nb-card flex flex-col justify-between h-[180px] p-5 transition-all text-left relative overflow-hidden group',
              selectedCardId === card.id 
                ? 'ring-2 ring-nubank-purple shadow-xl scale-105 z-10' 
                : 'bg-white hover:bg-gray-50'
            )}
          >
            <div className="flex items-center justify-between">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: card.cor }}
              >
                <CreditCard size={24} />
              </div>
              <ChevronRight size={18} className="text-gray-300 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all" />
            </div>
            
            <div className="mt-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{card.banco}</p>
              <h3 className="text-lg font-black text-gray-900 tracking-tighter">{card.nome}</h3>
              <p className="text-xs text-gray-400 mt-1">Vencimento: dia {card.dia_vencimento}</p>
            </div>

            {/* Background Accent */}
            <div 
              className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 transition-transform group-hover:scale-125"
              style={{ backgroundColor: card.cor }}
            />
          </button>
        ))}
      </div>

      {/* Invoice Detail */}
      {selectedCard && (
        <motion.div 
          layoutId="invoice-detail"
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="nb-card bg-white border-l-8" style={{ borderLeftColor: selectedCard.cor }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Resumo da Fatura</p>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
                  {formatCurrency(totalInvoice)}
                </h2>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                    <Calendar size={12} className="text-gray-400" />
                    <span className="text-[10px] font-black uppercase text-gray-500">Fecha dia {selectedCard.dia_fechamento}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-full border border-red-100">
                    <AlertCircle size={12} className="text-red-400" />
                    <span className="text-[10px] font-black uppercase text-red-500 font-black">Vencimento dia {selectedCard.dia_vencimento}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-3xl p-6 flex items-center justify-center min-w-[200px]">
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-sm font-black text-nubank-purple">ABERTA</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Lançamentos na fatura</h3>
            <div className="space-y-3">
              {Object.entries(groupedByCategory).map(([catName, data]) => (
                <CategoryGroup key={catName} catName={catName} data={data} color={selectedCard.cor} />
              ))}
              
              {filteredTransactions.length === 0 && (
                <div className="nb-card bg-white flex flex-col items-center py-20 text-center border-2 border-dashed border-gray-100">
                   <Clock size={40} className="text-gray-100 mb-4" />
                   <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nenhum lançamento este mês</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// --- Sub-componente para agrupar na fatura ---
const CategoryGroup: React.FC<{ catName: string; data: any; color: string }> = ({ catName, data, color }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
             <TrendingDown size={20} style={{ color }} />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 tracking-tight">{catName}</p>
            <p className="text-xs text-gray-400 font-bold">{data.count} itens</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-base font-black text-gray-900">{formatCurrency(data.total)}</span>
          <ChevronRight size={18} className={clsx('text-gray-300 transition-transform duration-300', isOpen && 'rotate-90')} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-50 bg-[#FCFCFD]"
          >
            <div className="p-2 space-y-1">
              {data.transactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-gray-100 group-hover:bg-nubank-purple transition-colors" />
                    <div>
                      <p className="text-sm font-bold text-gray-800">{t.descricao || 'Sem descrição'}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatDate(t.data)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(Number(t.valor))}</span>
                    <button className="p-1 px-3 bg-gray-100 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-nubank-purple hover:text-white transition-all">Ver</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardsPage;
