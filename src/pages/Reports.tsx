import React from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency } from '../utils/formatters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as PieChartRe,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ReportsPage: React.FC = () => {
  const { transactions, loading } = useTransactions();
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const filteredTransactions = React.useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return transactions.filter(t => isWithinInterval(parseISO(t.data), { start, end }));
  }, [transactions, selectedDate]);

  const stats = React.useMemo(() => {
    const s = { entrada: 0, saida: 0, reserva: 0 };
    filteredTransactions.forEach(t => {
      s[t.tipo as keyof typeof s] += Number(t.valor);
    });
    return s;
  }, [filteredTransactions]);

  const catData = React.useMemo(() => {
    const groups: Record<string, { name: string; value: number; color: string }> = {};
    filteredTransactions.filter(t => t.tipo === 'saida').forEach(t => {
      const name = t.categorias?.nome || t.categoria || 'Outros';
      if (!groups[name]) groups[name] = { name, value: 0, color: t.categorias?.cor || '#820AD1' };
      groups[name].value += Number(t.valor);
    });
    return Object.values(groups).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const methodData = React.useMemo(() => {
    const groups: Record<string, { name: string; value: number }> = {};
    filteredTransactions.filter(t => t.tipo === 'saida').forEach(t => {
      const name = t.forma_pagamento || 'pix';
      if (!groups[name]) groups[name] = { name, value: 0 };
      groups[name].value += Number(t.valor);
    });
    return Object.values(groups);
  }, [filteredTransactions]);

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Relatórios Analíticos</h1>
          <p className="text-sm text-gray-400 font-bold">Visão profunda das suas finanças</p>
        </div>
        <select 
          value={format(selectedDate, 'yyyy-MM')}
          onChange={(e) => setSelectedDate(parseISO(e.target.value + '-01'))}
          className="bg-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-100 shadow-sm"
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => {
            const date = new Date();
            date.setMonth(date.getMonth() - m);
            return <option key={m} value={format(date, 'yyyy-MM')}>{format(date, 'MMMM yyyy', { locale: ptBR })}</option>
          })}
        </select>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Receitas" value={stats.entrada} color="text-green-600" bg="bg-green-50" icon={TrendingUp} />
        <StatCard label="Gastos" value={stats.saida} color="text-red-500" bg="bg-red-50" icon={TrendingDown} />
        <StatCard label="Resultados" value={stats.entrada - stats.saida} color="text-nubank-purple" bg="bg-purple-50" icon={PieIcon} />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gastos por Categoria */}
        <div className="nb-card bg-white p-6 space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-nubank-purple">
                 <PieIcon size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Gastos por Categoria</h3>
           </div>
           
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChartRe>
                <Pie 
                  data={catData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" cy="50%" 
                  innerRadius={60} 
                  outerRadius={100} 
                  paddingAngle={5}
                >
                  {catData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  content={({active, payload}) => active && payload ? (
                    <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-50 text-xs font-bold">
                       <p className="text-gray-400 mb-1">{payload[0].name}</p>
                       <p className="text-gray-900">{formatCurrency(Number(payload[0].value))}</p>
                    </div>
                  ) : null}
                />
                <Legend iconType="circle" />
              </PieChartRe>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Forma de Pagamento */}
        <div className="nb-card bg-white p-6 space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-nubank-purple">
                 <BarChart3 size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Forma de Pagamento</h3>
           </div>

           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methodData} layout="vertical" margin={{ left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F5F5F5" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#ABABAB' }} axisLine={false} tickLine={false} />
                 <Tooltip />
                 <Bar dataKey="value" fill="#820AD1" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string; bg: string; icon: any }> = ({ label, value, color, bg, icon: Icon }) => (
  <div className="nb-card bg-white p-6 border border-gray-100 transition-all hover:scale-105 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center", bg)}>
        <Icon size={20} className={color} strokeWidth={2.5} />
      </div>
      <AlertCircle size={16} className="text-gray-200" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className={clsx("text-2xl font-black tracking-tighter", color)}>{formatCurrency(value)}</p>
    </div>
  </div>
);

export default ReportsPage;
