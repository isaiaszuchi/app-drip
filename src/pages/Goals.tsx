import React, { useState, useMemo } from 'react';
import type { Goal } from '../hooks/useGoals';
import { useGoals } from '../hooks/useGoals';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Plus, 
  Trash2, 
  Target,
  Calendar,
  X,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { addMonths } from 'date-fns';
import clsx from 'clsx';

const GoalsPage: React.FC = () => {
  const { goals, loading: loadingGoals, fetchGoals } = useGoals();
  const { transactions, loading: loadingTrans } = useTransactions();
  const { user } = useAuth();

  const [showAdd, setShowAdd] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newValor, setNewValor] = useState('');
  const [newPrazo, setNewPrazo] = useState('');

  const reserveTotal = useMemo(() =>
    transactions.filter(t => t.tipo === 'reserva').reduce((acc, t) => acc + Number(t.valor), 0),
    [transactions]
  );

  const avgMonthly = useMemo(() => {
    const now = new Date();
    const last3 = transactions.filter(t => {
      if (t.tipo !== 'reserva') return false;
      const diff = (now.getFullYear() - new Date(t.data).getFullYear()) * 12 + (now.getMonth() - new Date(t.data).getMonth());
      return diff >= 0 && diff <= 2;
    });
    return last3.reduce((acc, t) => acc + Number(t.valor), 0) / 3;
  }, [transactions]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome || !newValor) return;
    const { error } = await supabase.from('metas').insert({
      user_id: user?.id,
      nome: newNome,
      valor_total: parseFloat(newValor.replace(',', '.')),
      prazo: newPrazo || null,
    });
    if (!error) { setNewNome(''); setNewValor(''); setNewPrazo(''); setShowAdd(false); fetchGoals(); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir esta meta?')) {
      const { error } = await supabase.from('metas').delete().eq('id', id);
      if (!error) fetchGoals();
    }
  };

  if (loadingGoals || loadingTrans) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-100 border-t-purple rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Metas</h1>
          <p className="text-sm text-gray-400 mt-1">Acompanhe seus objetivos financeiros</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-nb-primary w-auto px-5 py-2.5 text-sm">
          <Plus size={18} />
          Nova Meta
        </button>
      </div>

      {/* Formulário */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="nb-card nb-card-shadow p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-ink">Nova Meta</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1.5">Nome da meta</label>
                  <input
                    type="text"
                    value={newNome}
                    onChange={(e) => setNewNome(e.target.value)}
                    className="nb-input text-sm"
                    placeholder="Ex: Viagem, Carro..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1.5">Valor alvo (R$)</label>
                  <input
                    type="text"
                    value={newValor}
                    onChange={(e) => setNewValor(e.target.value)}
                    className="nb-input text-sm"
                    placeholder="Ex: 10000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Prazo (opcional)</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={newPrazo}
                    onChange={(e) => setNewPrazo(e.target.value)}
                    className="nb-input pl-10 text-sm"
                  />
                </div>
              </div>
              <button type="submit" className="btn-nb-primary py-2.5 text-sm">Criar Meta</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de metas */}
      <div className="space-y-4">
        {goals.map((goal, idx) => (
          <GoalCard
            key={goal.id}
            index={idx}
            goal={goal}
            reserveTotal={reserveTotal}
            avgMonthly={avgMonthly}
            onDelete={() => handleDelete(goal.id)}
          />
        ))}
      </div>

      {/* Estado vazio */}
      {goals.length === 0 && (
        <div className="nb-card nb-card-shadow flex flex-col items-center py-14 text-center">
          <Target size={40} className="text-gray-200 mb-4" />
          <p className="font-semibold text-gray-700">Sem metas definidas</p>
          <p className="text-sm text-gray-400 mt-1">Crie sua primeira meta financeira</p>
          <button onClick={() => setShowAdd(true)} className="btn-nb-primary mt-5 w-auto px-7 py-2.5 text-sm">
            Criar Meta
          </button>
        </div>
      )}
    </div>
  );
};

const GoalCard: React.FC<{
  goal: Goal;
  index: number;
  reserveTotal: number;
  avgMonthly: number;
  onDelete: () => void;
}> = ({ goal, index, reserveTotal, avgMonthly, onDelete }) => {
  const progress = Math.min((reserveTotal / goal.valor_total) * 100, 100);
  const remaining = Math.max(0, goal.valor_total - reserveTotal);
  const projMonths = avgMonthly > 0 ? Math.ceil(remaining / avgMonthly) : null;
  const estimatedDate = projMonths ? addMonths(new Date(), projMonths) : null;
  const isComplete = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="nb-card nb-card-shadow p-5 space-y-4"
    >
      {/* Topo */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            isComplete ? 'bg-green-50' : 'bg-purple-muted'
          )}>
            {isComplete
              ? <CheckCircle2 size={22} className="text-green-500" />
              : <Target size={22} className="text-purple" />
            }
          </div>
          <div>
            <h3 className="font-bold text-ink">{goal.nome}</h3>
            {goal.prazo && (
              <div className="flex items-center gap-1 mt-0.5">
                <Calendar size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400">Prazo: {formatDate(goal.prazo)}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Progresso */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400 font-medium">Progresso</span>
          <span className={clsx('text-sm font-bold', isComplete ? 'text-green-500' : 'text-purple')}>
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className={clsx('h-full rounded-full', isComplete ? 'bg-green-400' : 'bg-purple')}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 font-medium mb-0.5">Acumulado</p>
          <p className="text-sm font-bold text-purple">{formatCurrency(reserveTotal)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 font-medium mb-0.5">Alvo</p>
          <p className="text-sm font-bold text-ink">{formatCurrency(goal.valor_total)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 font-medium mb-0.5">Previsão</p>
          <p className="text-sm font-bold text-ink">
            {isComplete ? '✓ Atingida' : estimatedDate
              ? estimatedDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
              : '—'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default GoalsPage;
