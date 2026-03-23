import React, { useState } from 'react';
import { useActiveProfile } from '../contexts/ProfileContext';
import { 
  User, 
  Briefcase, 
  Plus, 
  ChevronRight, 
  LogOut,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';

const ProfilePicker: React.FC = () => {
  const { profiles, setActiveProfile, createProfile, loading } = useActiveProfile();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'PF' | 'PJ'>('PF');

  const handleCreate = async () => {
    if (!newName) return;
    await createProfile(newName, newType);
    setNewName('');
    setShowAdd(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-[#8A05BE] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Decor - Subtle Purple Accent */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
         <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-[#8A05BE] rounded-full opacity-[0.03] blur-[120px]" />
         <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-[#8A05BE] rounded-full opacity-[0.02] blur-[100px]" />
      </div>

      <div className="max-w-md w-full space-y-12 relative z-10 transition-all">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#8A05BE] rounded-[1.25rem] mx-auto flex items-center justify-center shadow-xl shadow-purple-200 mb-6 group transition-transform hover:rotate-6">
             <div className="text-white font-black text-2xl tracking-tighter italic">dr</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Qual conta DRIP você quer acessar?</h1>
          <p className="text-gray-400 text-sm font-medium">Controle total sobre suas finanças PF + PJ</p>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {profiles.map((profile, idx) => (
              <motion.button
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setActiveProfile(profile)}
                className="group relative flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-[#8A05BE] hover:shadow-xl hover:shadow-purple-100/50 transition-all active:scale-95"
              >
                 <div className="flex items-center gap-5">
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                      profile.tipo === 'PF' ? "bg-gray-50 text-gray-400" : "bg-purple-50 text-[#8A05BE] group-hover:scale-110"
                    )}>
                       {profile.tipo === 'PF' ? <User size={22} /> : <Briefcase size={22} />}
                    </div>
                    <div className="text-left">
                       <p className="text-gray-900 font-bold text-base tracking-tight">{profile.nome}</p>
                       <span className="text-[10px] font-bold text-[#8A05BE] uppercase tracking-[0.1em]">{profile.tipo === 'PF' ? 'Conta Pessoal' : 'Conta PJ'}</span>
                    </div>
                 </div>
                 <ChevronRight size={20} className="text-gray-300 group-hover:text-[#8A05BE] transition-colors" />
                 
                 {profile.tipo === 'PJ' && (
                    <div className="absolute top-4 right-10 bg-[#8A05BE] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Business</div>
                 )}
              </motion.button>
            ))}

            {showAdd && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="nb-card p-8 space-y-6 rounded-[2.5rem] shadow-2xl relative border-purple-100"
              >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#8A05BE]">Novo Perfil</h3>
                    <button onClick={() => setShowAdd(false)} className="text-[10px] text-gray-400 font-bold uppercase hover:text-red-500">Voltar</button>
                  </div>
                  
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Identificação do Perfil" 
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-purple-100 placeholder:text-gray-300"
                      autoFocus
                    />

                    <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl">
                       {(['PF', 'PJ'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setNewType(t)}
                            className={clsx(
                              "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                              newType === t ? "bg-white text-[#8A05BE] shadow-sm" : "text-gray-400"
                            )}
                          >
                            {t === 'PF' ? 'Individual' : 'Empresa'}
                          </button>
                       ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleCreate}
                    className="w-full py-4 bg-[#8A05BE] text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-lg shadow-purple-100 hover:scale-[1.02] transition-all active:scale-95"
                  >
                    Confirmar Criação
                  </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!showAdd && profiles.length < 5 && (
            <button 
              onClick={() => setShowAdd(true)}
              className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-100 rounded-[2rem] text-gray-400 hover:border-[#8A05BE] hover:text-[#8A05BE] transition-all active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Adicionar nova conta</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-8 flex flex-col items-center gap-6">
           <div className="flex items-center gap-6">
              <button onClick={handleSignOut} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-800 transition-colors">
                <LogOut size={16} />
                Sair
              </button>
              <div className="w-1 h-1 bg-gray-200 rounded-full" />
              <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-800 transition-colors">
                <Globe size={16} />
                PT-BR
              </button>
           </div>
           <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300">Design inspirado na NuBank © 2026</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePicker;
