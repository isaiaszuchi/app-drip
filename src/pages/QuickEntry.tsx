import React, { useState, useEffect, useMemo } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useCards } from '../hooks/useCards';
import { useTransactions } from '../hooks/useTransactions';
import { useFamily } from '../hooks/useFamily';
import type { Subcategory } from '../hooks/useCategories';
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Tag, 
  AlertCircle,
  Calendar,
  CreditCard,
  Wallet,
  Coins,
  QrCode,
  Notebook,
  Repeat,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';

const QuickEntry: React.FC = () => {
  const { categories } = useCategories();
  const { cards } = useCards();
  const { members } = useFamily();
  const { transactions, addTransaction, updateTransaction } = useTransactions();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'reserva'>('saida');
  const [valor, setValor] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [subcategoriaId, setSubcategoriaId] = useState('');
  const [selectedIntegrantes, setSelectedIntegrantes] = useState<string[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategory[]>([]);
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'debito' | 'credito' | 'dinheiro'>('pix');
  const [cartaoId, setCartaoId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [isRecorrente, setIsRecorrente] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = useMemo(() =>
    categories.filter(c => c.tipo === tipo),
    [categories, tipo]
  );

  useEffect(() => {
    setCategoriaId('');
    setSubcategoriaId('');
    setSubcategorias([]);
    setError(null);
  }, [tipo]);

  useEffect(() => {
    if (isEditing && transactions.length > 0) {
      const t = transactions.find(item => item.id === id);
      if (t) {
        setTipo(t.tipo);
        setValor(t.valor.toString().replace('.', ','));
        setCategoriaId(t.categoria_id || '');
        setSubcategoriaId(t.subcategory_id || '');
        setDescricao(t.descricao || '');
        setData(t.data);
        if (t.forma_pagamento) setFormaPagamento(t.forma_pagamento as any);
        setCartaoId(t.cartao_id || '');
        setObservacao(t.observacao || '');
        setIsRecorrente(t.is_recorrente);
        if (t.integrante_id) setSelectedIntegrantes([t.integrante_id]);
      }
    }
  }, [id, transactions, isEditing]);

  useEffect(() => {
    const activeCat = categories.find(c => c.id === categoriaId);
    if (activeCat?.subcategorias) {
      setSubcategorias(activeCat.subcategorias);
      // Mantém a subcategoria se for edição
      if (!isEditing) setSubcategoriaId('');
    } else {
      setSubcategorias([]);
      if (!isEditing) setSubcategoriaId('');
    }
  }, [categoriaId, categories, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || !categoriaId) { 
      setError('Informe o valor e a categoria.'); 
      return; 
    }
    
    setLoading(true);
    setError(null);

    const isCardRequired = tipo === 'saida' && (formaPagamento === 'credito' || formaPagamento === 'debito');
    if (isCardRequired && !cartaoId) {
      setError('Selecione um cartão ou conta para este lançamento.');
      setLoading(false);
      return;
    }

    const totalValor = parseFloat(valor.replace(',', '.'));
    const isSplit = selectedIntegrantes.length > 1;
    const splitValor = isSplit ? totalValor / selectedIntegrantes.length : totalValor;

    const baseData = {
      tipo,
      valor: splitValor,
      categoria_id: categoriaId,
      subcategory_id: subcategoriaId || null,
      descricao: isSplit ? `${descricao || 'Lançamento'} (Compartilhado)` : descricao,
      data,
      forma_pagamento: tipo === 'saida' ? formaPagamento : null,
      cartao_id: isCardRequired ? (cartaoId || null) : null,
      observacao,
      is_recorrente: isRecorrente
    };

    try {
      if (isEditing && id) {
        // Modo Edição (Apenas um registro)
        await updateTransaction(id, {
          ...baseData,
          valor: totalValor, // Não divide na edição manual
          integrante_id: selectedIntegrantes[0] || null,
          descricao // Limpa o prefixo se editado
        });
      } else {
        // Novo Lançamento
        if (selectedIntegrantes.length === 0) {
          await addTransaction({ ...baseData, integrante_id: null });
        } else {
          for (const pid of selectedIntegrantes) {
            await addTransaction({ ...baseData, integrante_id: pid });
          }
        }
      }
      navigate('/');
    } catch (err) {
      setError('Erro ao salvar lançamento.');
      setLoading(false);
    }
  };

  const typeConfig = {
    saida: { label: 'Gasto', icon: TrendingDown, color: 'text-red-500', activeBg: 'bg-red-500', activeText: 'text-white' },
    entrada: { label: 'Receita', icon: TrendingUp, color: 'text-green-600', activeBg: 'bg-green-500', activeText: 'text-white' },
    reserva: { label: 'Reserva', icon: ShieldCheck, color: 'text-nubank-purple', activeBg: 'bg-nubank-purple', activeText: 'text-white' },
  };

  const isCardRequired = tipo === 'saida' && (formaPagamento === 'credito' || formaPagamento === 'debito');
  const canSubmit = valor && categoriaId && (!isCardRequired || cartaoId);

  const paymentMethods = [
    { id: 'pix', label: 'Pix', icon: QrCode },
    { id: 'credito', label: 'Crédito', icon: CreditCard },
    { id: 'debito', label: 'Débito', icon: Wallet },
    { id: 'dinheiro', label: 'Dinheiro', icon: Coins },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12 font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10 pt-4">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-2xl transition-all active:scale-90">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <div>
           <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
             {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
           </h1>
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1.5">Drip Financeiro</p>
        </div>
      </div>

      <div className="nb-card shadow-xl p-8 space-y-10 border border-gray-100 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-nubank-purple" />

        {/* Valor Utama */}
        <div className="text-center py-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">Valor do Lançamento</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-gray-200">R$</span>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="text-6xl font-bold text-gray-900 text-center bg-transparent border-none outline-none w-auto max-w-[350px] tracking-tighter placeholder:text-gray-50"
              autoFocus
            />
          </div>
        </div>

        {/* Tipo de Operação */}
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((t) => {
            const cfg = typeConfig[t];
            const isActive = tipo === t;
            const Icon = cfg.icon;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={clsx(
                  'flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all duration-300 font-bold text-xs',
                  isActive
                    ? `${cfg.activeBg} ${cfg.activeText} border-transparent shadow-lg scale-[1.02]`
                    : `bg-gray-50 border-gray-100 ${cfg.color} hover:bg-white`
                )}
              >
                <Icon size={24} strokeWidth={2.5} />
                <span className="uppercase tracking-widest text-[9px] font-bold">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Categoria, Subcategoria e QUEM */}
        <div className="space-y-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Categoria</label>
                <div className="relative">
                  <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl pl-12 pr-10 py-4 text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-purple-50 transition-all cursor-pointer"
                    required
                  >
                    <option value="" disabled>Selecione...</option>
                    {filteredCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Subcategoria</label>
                <div className="relative">
                  <select
                    value={subcategoriaId}
                    onChange={(e) => setSubcategoriaId(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-purple-50 transition-all disabled:opacity-30 cursor-pointer"
                    disabled={subcategorias.length === 0}
                  >
                    <option value="">Geral / Outros</option>
                    {subcategorias.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
           </div>

           {/* CAMPO: PRA QUEM? (Pessoa) */}
           <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">
                 <UserIcon size={14} className="text-nubank-purple" />
                 Para quem é este gasto?
              </label>
              <div className="flex flex-wrap gap-2">
                 {members.map(member => {
                    const isSelected = selectedIntegrantes.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                           if (isSelected) {
                              setSelectedIntegrantes(prev => prev.filter(id => id !== member.id));
                           } else {
                              setSelectedIntegrantes(prev => [...prev, member.id]);
                           }
                        }}
                        className={clsx(
                          "px-6 py-2.5 rounded-full text-[11px] font-bold transition-all border",
                          isSelected 
                            ? "bg-gray-900 text-white border-transparent shadow-md scale-105" 
                            : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                        )}
                      >
                         {member.nome}
                      </button>
                    );
                 })}
                 <button 
                  type="button"
                  onClick={() => navigate('/config')}
                  className="px-6 py-2.5 rounded-full text-[10px] font-bold border border-dashed border-gray-200 text-gray-300 hover:border-gray-300"
                 >
                    + Novo Membro
                 </button>
              </div>
           </div>
        </div>

        {/* Forma de Pagamento e Cartão */}
        {tipo === 'saida' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6 border-t border-gray-50">
             <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Meio de Pagamento</label>
             <div className="grid grid-cols-4 gap-3">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormaPagamento(method.id as any)}
                    className={clsx(
                      'flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all text-[9.5px] font-bold uppercase tracking-widest',
                      formaPagamento === method.id
                        ? 'bg-[#1A1A1B] text-white border-transparent shadow-xl'
                        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                    )}
                  >
                    <method.icon size={20} strokeWidth={2} />
                    <span>{method.label}</span>
                  </button>
                ))}
             </div>

             {/* Seleção de Cartão Condicional */}
             <AnimatePresence>
                {(formaPagamento === 'credito' || formaPagamento === 'debito') && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4">
                     <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Qual o Cartão / Conta?</label>
                     <div className="flex flex-wrap gap-3">
                        {cards.map(card => (
                           <button
                             key={card.id}
                             type="button"
                             onClick={() => setCartaoId(card.id)}
                             className={clsx(
                               "flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all text-sm font-bold shadow-sm",
                               cartaoId === card.id 
                                 ? "border-nubank-purple bg-purple-50 text-nubank-purple ring-2 ring-purple-100" 
                                 : "border-gray-50 bg-white hover:border-gray-100"
                             )}
                           >
                             <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: card.cor }}>
                               <CreditCard size={14} />
                             </div>
                             <span>{card.nome}</span>
                           </button>
                        ))}
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </motion.div>
        )}

        {/* Título e Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-gray-50">
           <div className="space-y-2">
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Título do Lançamento</label>
              <div className="relative">
                <Notebook size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Assinatura Netflix"
                  className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-purple-50 transition-all"
                />
              </div>
           </div>
           <div className="space-y-2">
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Data / Período</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none cursor-pointer"
                />
              </div>
           </div>
        </div>

        {/* Opções Extras */}
        <div className="flex items-center justify-between pt-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                 <input 
                   type="checkbox" 
                   checked={isRecorrente}
                   onChange={e => setIsRecorrente(e.target.checked)}
                   className="sr-only" 
                 />
                 <div className={clsx(
                   "w-12 h-7 rounded-full transition-colors",
                   isRecorrente ? "bg-nubank-purple" : "bg-gray-200"
                 )} />
                 <div className={clsx(
                   "absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm",
                   isRecorrente ? "translate-x-5" : ""
                 )} />
              </div>
              <div className="flex items-center gap-2">
                <Repeat size={16} className={isRecorrente ? "text-nubank-purple" : "text-gray-300"} />
                <span className={clsx("text-[10px] font-bold uppercase tracking-widest transition-colors", isRecorrente ? "text-nubank-purple" : "text-gray-400")}>Fixo / Recorrente</span>
              </div>
            </label>
            
            <button type="button" onClick={() => setObservacao(observacao ? '' : '...')} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
               + Observação
            </button>
        </div>

        {observacao !== '' && (
           <textarea
             value={observacao === '...' ? '' : observacao}
             onChange={(e) => setObservacao(e.target.value)}
             placeholder="Alguma nota extra sobre este gasto?"
             rows={3}
             className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-purple-50 resize-none animate-slide-up"
           />
        )}

        {/* Botão Finalizar */}
        <div className="pt-4">
           {error && (
              <p className="text-xs font-bold text-red-500 bg-red-50 p-4 rounded-2xl mb-6 flex items-center gap-2">
                 <AlertCircle size={16} /> {error}
              </p>
           )}

           <button
             onClick={handleSubmit}
             disabled={loading || !canSubmit}
             className={clsx(
                "w-full py-5 rounded-[2rem] font-bold uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3",
                loading || !canSubmit
                  ? "bg-gray-100 text-gray-400"
                  : "bg-nubank-purple text-white shadow-purple-200 hover:scale-[1.02]"
             )}
           >
             {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
                <>
                   <span>{isEditing ? 'Salvar Alterações' : 'Finalizar Lançamento'}</span>
                   <ChevronRight size={20} />
                </>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default QuickEntry;
