import React, { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useFamily } from '../hooks/useFamily';
import { useCategories } from '../hooks/useCategories';
import { formatCurrency } from '../utils/formatters';
import { 
  Eye, 
  EyeOff, 
  HelpCircle, 
  User, 
  Plus, 
  Smartphone, 
  TrendingUp,
  Heart,
  Clock,
  LayoutGrid,
  CreditCard,
  PieChart as PieChartIcon,
  ChevronDown
} from 'lucide-react';
import { 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const { transactions, loading: loadingTrans } = useTransactions();
  const { members } = useFamily();
  const { categories } = useCategories();
  const { user } = useAuth();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const [showBalance, setShowBalance] = useState(true);
  
  // Período selecionado (Mês/Ano)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // --- Filtro de Período ---
  const filteredTransactions = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    
    return transactions.filter(t => {
      // Forçar o parse das datas para o horário local (meia-noite) para evitar o erro de fuso horário (-1 dia)
      const dateStr = t.data.split('T')[0];
      const date = parseISO(`${dateStr}T00:00:00`);
      return isWithinInterval(date, { start, end });
    });
  }, [transactions, selectedDate]);

  // --- Cálculos de Totais ---
  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => {
      const val = Number(curr.valor);
      if (curr.tipo === 'entrada') acc.entrada += val;
      if (curr.tipo === 'saida') acc.saida += val;
      if (curr.tipo === 'reserva') acc.reserva += val;
      return acc;
    }, { entrada: 0, saida: 0, reserva: 0 });
  }, [filteredTransactions]);

  // --- Dados do Gráfico de Rosca (Categorias) ---
  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.tipo === 'saida');
    const grouped = expenses.reduce((acc, curr) => {
      const catName = curr.categorias?.nome || curr.categoria || 'Outros';
      acc[catName] = (acc[catName] || 0) + Number(curr.valor);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => {
        const cat = categories.find(c => c.nome === name);
        return { name, value, color: cat?.cor || '#E9273E' };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  // --- Gastos por Integrante ---
  const familySpent = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.tipo === 'saida');
    return members.map(m => {
       const total = expenses
         .filter(t => t.integrante_id === m.id)
         .reduce((acc, curr) => acc + Number(curr.valor), 0);
       return { ...m, total };
    }).sort((a, b) => b.total - a.total);
  }, [filteredTransactions, members]);

  const religiosoTotal = useMemo(() => {
    const cats = ['Dízimo', 'Oferta', 'Primícia', 'Esmola'];
    return filteredTransactions
      .filter(t => cats.includes(t.categorias?.nome || t.categoria || ''))
      .reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [filteredTransactions]);

  if (loadingTrans) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-purple rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user?.email?.split('@')[0] ?? 'usuário';

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans">
      {/* Nubank Top Bar Refined */}
      <div className="bg-nubank-purple pt-12 pb-20 px-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                <User size={24} />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Painel de Controle</p>
                <p className="text-white text-lg font-bold">Olá, {firstName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowBalance(!showBalance)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                {showBalance ? <Eye size={22} color="white" /> : <EyeOff size={22} color="white" />}
              </button>
              <button className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                <HelpCircle size={22} color="white" />
              </button>
            </div>
          </div>

          {/* Quick Actions - Agora Horizontal sem bugar */}
          <div className="nb-horizontal-scroll no-scrollbar -mx-2">
            <ActionIcon icon={Plus} label="Novo Gasto" onClick={() => navigate('/novo')} isPrimary />
            <ActionIcon icon={LayoutGrid} label="Pix" />
            <ActionIcon icon={CreditCard} label="Cartões" onClick={() => navigate('/config')} />
            <ActionIcon icon={TrendingUp} label="Metas" onClick={() => navigate('/metas')} />
            <ActionIcon icon={Smartphone} label="Recarga" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 space-y-6">
        
        {/* Seletor de Período e Resumo Flutuante */}
        <div className="nb-card bg-white p-6 shadow-xl border-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-0.5">Período de Análise</p>
              <div className="relative">
                <button 
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="flex items-center gap-2 bg-transparent hover:bg-gray-50/50 pr-4 pl-0 py-1 rounded-xl transition-all group -ml-0.5"
                >
                  <span className="text-2xl font-heading font-bold text-gray-900 group-hover:text-nubank-purple transition-colors leading-none">
                    {format(selectedDate, 'MMMM yyyy', { locale: ptBR }).charAt(0).toUpperCase() + format(selectedDate, 'MMMM yyyy', { locale: ptBR }).slice(1)}
                  </span>
                  <motion.div
                    animate={{ rotate: showMonthPicker ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1"
                  >
                    <ChevronDown size={20} className="text-gray-300 group-hover:text-nubank-purple" />
                  </motion.div>
                </button>

                  <AnimatePresence>
                    {showMonthPicker && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 p-3"
                        >
                          <div className="grid grid-cols-1 gap-1">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => {
                              const date = new Date();
                              date.setMonth(date.getMonth() - m);
                              const val = format(date, 'yyyy-MM');
                              const label = format(date, 'MMMM yyyy', { locale: ptBR });
                              const isSelected = format(selectedDate, 'yyyy-MM') === val;

                              return (
                                <button
                                  key={val}
                                  onClick={() => {
                                    setSelectedDate(parseISO(val + '-01'));
                                    setShowMonthPicker(false);
                                  }}
                                  className={clsx(
                                    "flex items-center justify-between px-5 py-3.5 rounded-2xl text-left transition-all",
                                    isSelected 
                                      ? "bg-purple-50 text-nubank-purple font-bold" 
                                      : "hover:bg-gray-50 text-gray-600 font-medium hover:text-gray-900"
                                  )}
                                >
                                  <span className="text-sm">
                                    {label.charAt(0).toUpperCase() + label.slice(1)}
                                  </span>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-nubank-purple shadow-sm shadow-purple-200" />}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            
            <div className="flex gap-4">
               <div className="text-right">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Gastos</p>
                  <p className="text-lg font-bold text-red-500">
                    {showBalance ? formatCurrency(totals.saida) : '••••'}
                  </p>
               </div>
               <div className="w-px h-10 bg-gray-100" />
               <div className="text-right">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Entradas</p>
                  <p className="text-lg font-bold text-green-500">
                    {showBalance ? formatCurrency(totals.entrada) : '••••'}
                  </p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza - Categorias */}
          <div className="nb-card bg-white p-6 border-none shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <PieChartIcon size={20} className="text-nubank-purple" />
                <h3 className="font-bold text-gray-800 tracking-tight">Onde você gastou?</h3>
              </div>
            </div>
            <div className="h-[250px] w-full flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="h-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.length > 0 ? categoryData : [{ name: 'Sem dados', value: 1, color: '#F1F3F5' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {(categoryData.length > 0 ? categoryData : [{ color: '#F8F9FA' }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={(entry as any).color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length && categoryData.length > 0) {
                          return (
                            <div className="bg-white p-3 rounded-xl shadow-2xl border border-gray-50">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                              <p className="text-sm font-bold text-nubank-purple">{formatCurrency(Number(payload[0].value))}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {categoryData.length > 0 && (
                <div className="flex flex-col gap-3 min-w-[140px]">
                   {categoryData.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex items-center justify-between gap-4 group cursor-default">
                         <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: c.color }} />
                            <span className="text-[11px] font-bold text-gray-500 truncate max-w-[80px] group-hover:text-gray-900 transition-colors">{c.name}</span>
                         </div>
                         <span className="text-[10px] font-bold text-gray-400">
                            {Math.round((c.value / totals.saida) * 100)}%
                         </span>
                      </div>
                   ))}
                </div>
              )}
            </div>
          </div>

          {/* Gastos por Pessoa */}
          <div className="nb-card bg-white p-6 border-none shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <User size={20} className="text-gray-900" />
              <h3 className="font-bold text-gray-800 tracking-tight">Gastos por Pessoa</h3>
            </div>
            <div className="space-y-5">
              {familySpent.map((m) => (
                <div key={m.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">{m.nome}</span>
                    <span className="text-xs font-bold text-gray-900">{formatCurrency(m.total)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: totals.saida > 0 ? `${(m.total / totals.saida) * 100}%` : '0%' }}
                      className="h-full bg-nubank-purple"
                    />
                  </div>
                </div>
              ))}
              {familySpent.length === 0 && (
                <div className="flex flex-col items-center py-8 opacity-30">
                   <User size={32} />
                   <p className="text-[10px] font-bold uppercase mt-2">Ninguém cadastrado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Religioso / Doações */}
        <div className="nb-card bg-purple-50 flex items-center justify-between border border-purple-100 shadow-sm p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Heart size={24} className="text-nubank-purple fill-nubank-purple/5" />
            </div>
            <div>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Ofertas e Dízimos</p>
              <p className="text-sm font-semibold text-gray-800">Propósito e Gratidão</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-nubank-purple">
              {showBalance ? formatCurrency(religiosoTotal) : '••••'}
            </p>
          </div>
        </div>

        {/* Histórico Recente - Mini */}
        <div className="nb-card bg-white p-6 border-none shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-gray-400" />
              <h3 className="font-bold text-gray-800 tracking-tight">Visto Recentemente</h3>
            </div>
            <button onClick={() => navigate('/historico')} className="text-xs font-bold text-nubank-purple hover:underline">Ver tudo</button>
          </div>
          <div className="space-y-4">
             {filteredTransactions.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                         <div className={clsx("w-2 h-2 rounded-full", t.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500')} />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xs font-bold text-gray-800">{t.descricao || (t as any).categorias?.nome || t.categoria}</span>
                         <span className="text-[10px] text-gray-400 font-medium">{(t as any).integrantes?.nome || 'Geral'}</span>
                      </div>
                   </div>
                   <span className={clsx("text-xs font-bold", t.tipo === 'entrada' ? 'text-green-600' : 'text-gray-900')}>
                      {t.tipo === 'entrada' ? '+' : '-'} {formatCurrency(Number(t.valor))}
                   </span>
                </div>
             ))}
             {filteredTransactions.length === 0 && <p className="text-center py-4 text-xs font-bold text-gray-300">Nenhum registro.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

const ActionIcon: React.FC<{ 
  icon: any; 
  label: string; 
  onClick?: () => void;
  isPrimary?: boolean;
}> = ({ icon: Icon, label, onClick, isPrimary }) => (
  <div className="nb-action-icon" onClick={onClick}>
    <div className={clsx(
      "nb-icon-circle transition-all active:scale-95",
      isPrimary ? "bg-white text-nubank-purple scale-110 shadow-lg" : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
    )}>
      <Icon size={isPrimary ? 24 : 20} strokeWidth={isPrimary ? 2.5 : 2} />
    </div>
    <span className={clsx(
      "nb-action-label text-[10px] font-bold uppercase tracking-widest mt-2",
      isPrimary ? "text-white" : "text-white/60"
    )}>
      {label}
    </span>
  </div>
);

export default Dashboard;
