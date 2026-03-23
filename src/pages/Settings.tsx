import React, { useState, useRef } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useCards } from '../hooks/useCards';
import { useFamily } from '../hooks/useFamily';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Trash2, 
  Tag as TagIcon, 
  CreditCard, 
  PlusCircle, 
  X,
  Users,
  Landmark,
  ShieldCheck,
  Palette,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { Category } from '../hooks/useCategories';

const SettingsPage: React.FC = () => {
  const { categories, addCategory, deleteCategory, updateCategory, addSubcategory, fetchCategories } = useCategories();
  const { cards, addCard, deleteCard } = useCards();
  const { members, addMember, deleteMember } = useFamily();

  const [activeTab, setActiveTab] = useState<'cats' | 'cards' | 'family'>('cats');
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Adicionar Categoria Form (com persistência de rascunho)
  const [showAddCat, setShowAddCat] = useState(() => localStorage.getItem('drip_draft_showCat') === 'true');
  const [newCatNome, setNewCatNome] = useState(() => localStorage.getItem('drip_draft_catNome') || '');
  const [newCatTipo, setNewCatTipo] = useState<'entrada' | 'saida' | 'reserva'>(() => (localStorage.getItem('drip_draft_catTipo') as any) || 'saida');
  const [newCatCor, setNewCatCor] = useState(() => localStorage.getItem('drip_draft_catCor') || '#8A05BE');
  const [newSubNome, setNewSubNome] = useState(() => localStorage.getItem('drip_draft_subNome') || '');

  // Persistir rascunho sempre que mudar
  React.useEffect(() => {
    localStorage.setItem('drip_draft_showCat', showAddCat.toString());
    localStorage.setItem('drip_draft_catNome', newCatNome);
    localStorage.setItem('drip_draft_catTipo', newCatTipo);
    localStorage.setItem('drip_draft_catCor', newCatCor);
    localStorage.setItem('drip_draft_subNome', newSubNome);
  }, [showAddCat, newCatNome, newCatTipo, newCatCor, newSubNome]);

  // Adicionar Subcategoria Form
  const [selectedCatForSub, setSelectedCatForSub] = useState<string | null>(null);

  // Adicionar Cartão Form
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    nome: '',
    banco: '',
    cor: '#8A05BE',
    dia_fechamento: 1,
    dia_vencimento: 10,
    tipo: 'credito' as 'credito' | 'debito'
  });

  // Adicionar Integrante Form
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberNome, setNewMemberNome] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNome) return;
    setLoadingPage(true);

    // addCategory agora retorna { data, error }
    const { data: cat, error: catErr } = await addCategory(newCatNome, newCatTipo, newCatCor, 'Tag');

    if (catErr) {
       alert("Erro ao criar categoria: " + (catErr as any).message || catErr);
       setLoadingPage(false);
       return;
    }

    if (cat && cat.id && newSubNome) {
       const subs = newSubNome.split(',').map(s => s.trim()).filter(Boolean);
       for (const sub of subs) {
          const { error: subErr } = await addSubcategory(cat.id, sub);
          if (subErr) console.error("Erro na subcategoria:", subErr);
       }
    }

    await fetchCategories();

    // Se chegou até aqui, deu tudo certo. Limpa rascunho.
    setNewCatNome('');
    setNewSubNome('');
    setNewCatCor('#8A05BE');
    localStorage.removeItem('drip_draft_catNome');
    localStorage.removeItem('drip_draft_subNome');

    setLoadingPage(false);
    setShowAddCat(false);
  };

  const handleCreateSub = async (catId: string) => {
    if (!newSubNome) return;
    const subs = newSubNome.split(',').map(s => s.trim()).filter(Boolean);
    for (const sub of subs) {
       await addSubcategory(catId, sub);
    }
    setNewSubNome('');
    setSelectedCatForSub(null);
    fetchCategories();
  };

  const [loadingPage, setLoadingPage] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.nome) return;
    setLoadingPage(true);
    const { error } = await updateCategory(editingCat.id, {
      nome: editingCat.nome,
      tipo: editingCat.tipo,
      cor: editingCat.cor
    });
    
    if (error) alert("Erro ao atualizar: " + (error as any).message);
    setLoadingPage(false);
    setEditingCat(null);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.nome || !newCard.banco) return;
    await addCard(newCard);
    setShowAddCard(false);
    setNewCard({ nome: '', banco: '', cor: '#8A05BE', dia_fechamento: 1, dia_vencimento: 10, tipo: 'credito' });
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberNome) return;
    await addMember(newMemberNome);
    setNewMemberNome('');
    setShowAddMember(false);
  };

  const handleDeleteSub = async (subId: string) => {
    const { error } = await supabase
      .from('subcategorias')
      .delete()
      .eq('id', subId);
    if (!error) {
      fetchCategories();
    }
  };

  const suggestedColors = [
    '#8A05BE', '#FF4D4D', '#FF9F43', '#2EB67D', '#03A9F4', '#FFD32A', '#1A1A1B', '#EC4899', '#A855F7', '#10B981','#06B6D4','#F59E0B'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 font-sans px-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-heading font-bold text-gray-900 tracking-tight">Configurações</h1>
        <p className="text-sm text-gray-500 font-medium">Gerencie sua estrutura financeira personalizada</p>
      </div>

      {/* Tabs Menu - Estilo Nu */}
      <div className="flex items-center gap-1 p-1.5 bg-gray-50/80 rounded-2xl w-fit border border-gray-100">
        {[
          { id: 'cats', label: 'Categorias & Subcategorias', icon: TagIcon },
          { id: 'cards', label: 'Cartões e Faturas', icon: CreditCard },
          { id: 'family', label: 'Gestão da Família', icon: Users },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              "flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-bold transition-all",
              activeTab === tab.id ? "bg-white text-nubank-purple shadow-sm ring-1 ring-gray-100" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {/* TAB 1: CATEGORIAS */}
        {activeTab === 'cats' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-nubank-purple rounded-full" />
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sua Árvore de Contas</h3>
              </div>
              <button 
                onClick={() => setShowAddCat(true)}
                className="flex items-center gap-2 bg-nubank-purple text-white px-6 py-3 rounded-full text-xs font-bold shadow-xl shadow-purple-50 hover:bg-nubank-purple-dark transition-all"
              >
                <Plus size={16} />
                <span>Nova Categoria</span>
              </button>
            </div>

            {/* Modal de Adicionar Categoria */}
            <AnimatePresence>
              {showAddCat && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="nb-card !bg-white p-8 space-y-8 border border-gray-100 shadow-2xl relative overflow-hidden">
                   <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h4 className="font-heading font-bold text-gray-900 text-xl tracking-tight">Novo Grupo de Gastos</h4>
                        <p className="text-xs text-gray-400 font-medium">Crie uma categoria principal (ex: Saúde, Moradia)</p>
                     </div>
                     <button onClick={() => {
                        setShowAddCat(false);
                        setNewCatNome('');
                        setNewSubNome('');
                     }} className="p-2 hover:bg-gray-50 rounded-full transition-all text-gray-300 hover:text-gray-900"><X size={20} /></button>
                   </div>
                   <form onSubmit={handleCreateCategory} className="space-y-8">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome da Categoria (Grupo)</label>
                           <input type="text" placeholder="Ex: Moradia, Saúde" value={newCatNome} onChange={e => setNewCatNome(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-purple-50" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subcategorias (separe por vírgula)</label>
                           <input 
                             type="text" 
                             placeholder="Ex: Aluguel, IPTU, Condomínio" 
                             value={newSubNome} 
                             onChange={e => setNewSubNome(e.target.value)} 
                             className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-purple-50" 
                           />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo de Fluxo</label>
                           <select value={newCatTipo} onChange={e => setNewCatTipo(e.target.value as any)} className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 text-sm font-bold outline-none">
                             <option value="saida">Saída (Gasto)</option>
                             <option value="entrada">Entrada (Receita)</option>
                             <option value="reserva">Reserva (Economia)</option>
                           </select>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Escolha uma Cor</label>
                           <div className="flex flex-wrap gap-2.5">
                              {suggestedColors.slice(0, 6).map(c => (
                                <button key={c} type="button" onClick={() => setNewCatCor(c)} className={clsx("w-8 h-8 rounded-xl border-4 transition-all", newCatCor === c ? "border-nubank-purple shadow-purple-100 scale-110" : "border-transparent opacity-60 hover:opacity-100")} style={{ backgroundColor: c }} />
                              ))}
                              <button type="button" onClick={() => colorInputRef.current?.click()} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200"><Palette size={14} /></button>
                              <input ref={colorInputRef} type="color" className="sr-only" value={newCatCor} onChange={e => setNewCatCor(e.target.value)} />
                           </div>
                        </div>
                     </div>
                     <button 
                       disabled={loadingPage || !newCatNome}
                       className="w-full py-5 bg-nubank-purple text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-xl shadow-purple-50 hover:bg-nubank-purple-dark transition-all flex items-center justify-center gap-3"
                     >
                       {loadingPage ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       ) : (
                          "Criar Categoria & Subcategorias"
                       )}
                     </button>
                   </form>
                </motion.div>
              )}
            </AnimatePresence>
 
            {/* Listagem Premium de Categorias */}
            <div className="grid grid-cols-1 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="nb-card !bg-white p-8 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: cat.cor }}>
                            <TagIcon size={28} />
                         </div>
                         <div className="space-y-1">
                           <h4 className="text-xl font-bold text-gray-900 tracking-tight leading-none">{cat.nome}</h4>
                           <div className="flex items-center gap-2">
                              <span className={clsx("text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border", 
                                cat.tipo === 'saida' ? "bg-red-50 text-red-500 border-red-100" : "bg-green-50 text-green-500 border-green-100"
                              )}>{cat.tipo === 'saida' ? 'Gasto' : cat.tipo === 'entrada' ? 'Receita' : 'Reserva'}</span>
                              <span className="text-[11px] text-gray-400 font-bold tracking-tight">• {cat.subcategorias?.length || 0} Subcategorias</span>
                           </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <button 
                          onClick={() => setSelectedCatForSub(selectedCatForSub === cat.id ? null : cat.id)} 
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-purple-50 rounded-full text-[10px] font-bold text-gray-400 hover:text-nubank-purple uppercase tracking-widest transition-all group"
                        >
                           <PlusCircle size={16} className="group-hover:scale-110 transition-transform" />
                           <span className="hidden sm:inline">Add Sub</span>
                        </button>
                        
                        <div className="w-px h-8 bg-gray-50 mx-1 hidden sm:block" />

                        <button onClick={() => setEditingCat(cat)} className="p-2.5 text-gray-200 hover:text-blue-500 transition-all bg-gray-50 sm:bg-transparent rounded-full">
                           <Edit3 size={18} />
                        </button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-2.5 text-gray-200 hover:text-red-500 transition-all bg-gray-50 sm:bg-transparent rounded-full">
                           <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
             
                  {/* Subcategorias List */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50 mt-4">
                     {cat.subcategorias?.map(sub => (
                        <div key={sub.id} className="group/sub flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full transition-all hover:border-purple-200">
                           <span className="text-xs font-bold text-gray-600">{sub.nome}</span>
                           <button onClick={() => handleDeleteSub(sub.id)} className="text-gray-300 hover:text-red-500 transition-all">
                              <X size={12} />
                           </button>
                        </div>
                     ))}
                  </div>

                  <AnimatePresence>
                    {selectedCatForSub === cat.id && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex gap-2">
                         <input 
                           type="text" autoFocus placeholder="Nova(s) Sub(s) separadas por vírgula..." value={newSubNome} onChange={e => setNewSubNome(e.target.value)}
                           className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-purple-50 transition-all shadow-sm"
                           onKeyDown={e => e.key === 'Enter' && handleCreateSub(cat.id)}
                         />
                         <button onClick={() => handleCreateSub(cat.id)} className="bg-nubank-purple text-white px-8 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-purple-50">Adicionar</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Editar Grupo */}
        <AnimatePresence>
          {editingCat && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/20"
            >
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="nb-card !bg-white p-8 space-y-8 border border-gray-100 shadow-2xl relative overflow-hidden max-w-lg w-full"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-heading font-bold text-gray-900 text-xl tracking-tight">Editar Grupo de Gastos</h4>
                    <p className="text-xs text-gray-400 font-medium">Ajuste os detalhes da categoria principal</p>
                  </div>
                  <button onClick={() => setEditingCat(null)} className="p-2 hover:bg-gray-50 rounded-full transition-all text-gray-300 hover:text-gray-900"><X size={20} /></button>
                </div>
                <form onSubmit={handleUpdateCategory} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome da Categoria (Grupo)</label>
                    <input
                      type="text"
                      placeholder="Ex: Moradia, Saúde"
                      value={editingCat.nome}
                      onChange={e => setEditingCat({ ...editingCat, nome: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-purple-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo de Fluxo</label>
                    <select
                      value={editingCat.tipo}
                      onChange={e => setEditingCat({ ...editingCat, tipo: e.target.value as any })}
                      className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 text-sm font-bold outline-none"
                    >
                      <option value="saida">Saída (Gasto)</option>
                      <option value="entrada">Entrada (Receita)</option>
                      <option value="reserva">Reserva (Economia)</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Escolha uma Cor</label>
                    <div className="flex flex-wrap gap-2.5">
                      {suggestedColors.slice(0, 6).map(c => (
                        <button key={c} type="button" onClick={() => setEditingCat({ ...editingCat, cor: c })} className={clsx("w-8 h-8 rounded-xl border-4 transition-all", editingCat.cor === c ? "border-nubank-purple shadow-purple-100 scale-110" : "border-transparent opacity-60 hover:opacity-100")} style={{ backgroundColor: c }} />
                      ))}
                      <button type="button" onClick={() => colorInputRef.current?.click()} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200"><Palette size={14} /></button>
                      <input ref={colorInputRef} type="color" className="sr-only" value={editingCat.cor} onChange={e => setEditingCat({ ...editingCat, cor: e.target.value })} />
                    </div>
                  </div>
                  <button
                    disabled={loadingPage || !editingCat.nome}
                    className="w-full py-5 bg-nubank-purple text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-xl shadow-purple-50 hover:bg-nubank-purple-dark transition-all flex items-center justify-center gap-3"
                  >
                    {loadingPage ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Salvar Alterações"
                    )}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 2: CARTÕES */}
        {activeTab === 'cards' && (
          <div className="space-y-8">
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-nubank-purple rounded-full" />
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Instituições e Cartões</h3>
              </div>
              <button 
                onClick={() => setShowAddCard(true)}
                className="flex items-center gap-2 bg-nubank-purple text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-purple-100 hover:bg-nubank-purple-dark transition-all"
              >
                <Plus size={16} />
                <span>Registrar Cartão</span>
              </button>
            </div>

            <AnimatePresence>
               {showAddCard && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="nb-card !bg-white p-8 space-y-8 border border-gray-100 shadow-2xl relative">
                    <h4 className="font-heading font-bold text-xl text-gray-900 tracking-tight">Onde você guarda o dinheiro?</h4>
                    <form onSubmit={handleCreateCard} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Nome de Exibição</label>
                              <input type="text" placeholder="Ex: Meu Roxinho" value={newCard.nome} onChange={e => setNewCard({...newCard, nome: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-nubank-purple transition-all" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Instituição Corretora/Banco</label>
                              <input type="text" placeholder="Ex: Santander, Nu, Itaú" value={newCard.banco} onChange={e => setNewCard({...newCard, banco: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-nubank-purple transition-all" />
                           </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tipo de Uso</label>
                              <select value={newCard.tipo} onChange={e => setNewCard({...newCard, tipo: e.target.value as any})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none">
                                <option value="credito">Crédito</option>
                                <option value="debito">Débito/CC</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Fechamento</label>
                              <input type="number" value={newCard.dia_fechamento} onChange={e => setNewCard({...newCard, dia_fechamento: parseInt(e.target.value)})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Vencimento</label>
                              <input type="number" value={newCard.dia_vencimento} onChange={e => setNewCard({...newCard, dia_vencimento: parseInt(e.target.value)})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
                           </div>
                        </div>
                        <button className="w-full py-4 bg-nubank-purple text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-purple-50 hover:bg-nubank-purple-dark transition-all">Confirmar Registro</button>
                    </form>
                  </motion.div>
               )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cards.map(card => (
                 <div key={card.id} className="nb-card !bg-white p-6 border border-gray-100 group hover:-translate-y-1 transition-all overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gray-900/5 -mr-12 -mt-12 rounded-full pointer-events-none" />
                    <div className="flex items-center justify-between mb-8">
                       <Landmark size={24} className="text-gray-400" />
                       <button onClick={() => deleteCard(card.id)} className="p-2 opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-500 transition-all">
                          <Trash2 size={18} />
                       </button>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{card.banco}</p>
                       <h4 className="text-xl font-heading font-bold text-gray-900 tracking-tight">{card.nome}</h4>
                       <div className="flex items-center gap-3 pt-4">
                          <div className={clsx("w-3 h-3 rounded-full shadow-inner", card.tipo === 'credito' ? "bg-purple-500" : "bg-green-500")} />
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{card.tipo}</span>
                       </div>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FAMÍLIA */}
        {activeTab === 'family' && (
          <div className="space-y-8">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Users size={16} /> Painel de Integrantes
                  </h3>
                  <p className="text-sm text-gray-400 font-bold">Quem faz parte da casa?</p>
                </div>
                <button 
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 bg-[#1A1A1B] text-white px-6 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all"
                >
                  <Plus size={16} />
                  <span>Adicionar Integrante</span>
                </button>
             </div>

             <AnimatePresence>
                {showAddMember && (
                   <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="nb-card !bg-white p-8 space-y-6 border border-gray-100 shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between">
                         <div>
                            <h4 className="font-heading font-bold text-xl text-gray-900">Novo Integrante</h4>
                            <p className="text-xs text-gray-400 font-medium tracking-tight">Crie perfis para separar os lançamentos (Isaías, Milena, Maria...)</p>
                         </div>
                         <button onClick={() => setShowAddMember(false)} className="p-2 hover:bg-gray-50 rounded-full transition-all text-gray-400"><X size={20} /></button>
                      </div>
                      <form onSubmit={handleCreateMember} className="flex gap-4">
                         <input 
                           type="text" autoFocus placeholder="Qual o nome?" value={newMemberNome} onChange={e => setNewMemberNome(e.target.value)}
                           className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-gray-100 transition-all"
                         />
                         <button className="bg-gray-900 text-white px-8 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-gray-200 hover:bg-gray-800 transition-all">Cadastrar</button>
                      </form>
                   </motion.div>
                )}
             </AnimatePresence>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map(member => (
                   <div key={member.id} className="nb-card !bg-white p-8 border border-gray-100 text-center space-y-4 group hover:shadow-xl transition-all relative">
                      <div className="w-16 h-16 bg-gray-50 rounded-[2rem] mx-auto flex items-center justify-center text-gray-300 font-bold text-xl relative overflow-hidden">
                         {member.nome.charAt(0).toUpperCase()}
                         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-100/10 to-transparent" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-heading font-bold text-gray-900 tracking-tight">{member.nome}</h4>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Integrante da Casa</p>
                      </div>
                      <div className="pt-4 flex items-center justify-center gap-2">
                         <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-bold uppercase border border-green-100">
                           <ShieldCheck size={10} /> Active
                         </div>
                         <button onClick={() => deleteMember(member.id)} className="p-2 opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-500 transition-all">
                           <Trash2 size={16} />
                         </button>
                      </div>
                   </div>
                ))}

                {members.length === 0 && !showAddMember && (
                   <div className="col-span-full border-2 border-dashed border-gray-100 rounded-[3rem] p-20 flex flex-col items-center gap-4 text-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200">
                         <Users size={32} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.15em]">Nenhum integrante cadastrado</p>
                        <p className="text-xs text-gray-300 max-w-[200px] mx-auto leading-relaxed">Você precisa adicionar pessoas para poder separar de quem são os gastos.</p>
                      </div>
                      <button onClick={() => setShowAddMember(true)} className="mt-4 text-[10px] font-bold uppercase tracking-widest bg-gray-900 text-white px-8 py-3 rounded-full shadow-lg shadow-gray-200">Começar Agora</button>
                   </div>
                )}
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
