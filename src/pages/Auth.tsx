import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronRight, Globe, HelpCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setIsLogin(true);
        setError('Conta criada! Verifique seu e-mail para confirmar.');
        return;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Left Side: Form */}
      <div className="w-full md:w-[450px] lg:w-[600px] flex flex-col p-8 md:p-16 lg:p-24 relative z-10 transition-all">
        
        {/* Header/Logo */}
        <div className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-2">
             <div className="w-12 h-12 bg-nubank-purple rounded-2xl flex items-center justify-center text-white font-bold text-2xl tracking-tighter shadow-lg shadow-purple-50">dr</div>
             <span className="text-gray-900 font-bold text-lg hidden sm:block tracking-tight ml-2">Financeiro</span>
          </div>
          <div className="flex items-center gap-6">
             <button className="text-sm font-semibold text-gray-500 hover:text-[#8A05BE] transition-colors flex items-center gap-2">
                <Globe size={18} />
                BR
             </button>
             <HelpCircle size={22} className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col justify-center max-w-[400px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-10"
            >
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                  Acesse sua conta DRIP
                </h1>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">Sua plataforma completa para gestão individual e empresarial (PF + PJ)</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-8">
                <div className="space-y-6">
                  <div className="group border-b border-gray-200 focus-within:border-[#8A05BE] transition-all py-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">E-mail</label>
                    <input 
                      type="email" 
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-transparent border-none px-0 py-2 text-base font-medium text-gray-800 outline-none placeholder:text-gray-200"
                    />
                  </div>
                  
                  <div className="group border-b border-gray-200 focus-within:border-[#8A05BE] transition-all py-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Senha</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-transparent border-none px-0 py-2 text-base font-medium text-gray-800 outline-none placeholder:text-gray-200"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
                )}

                <button 
                  type="submit"
                  disabled={loading || !email || !password}
                  className={clsx(
                    "w-full h-14 rounded-full flex items-center justify-center gap-3 transition-all",
                    loading || !email || !password 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-[#8A05BE] text-white shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-95"
                  )}
                >
                  {loading ? (
                    <Loader2 className="animate-spin text-white" />
                  ) : (
                    <>
                      <span className="font-bold text-sm uppercase tracking-widest">{isLogin ? 'Acessar' : 'Confirmar'}</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-4">
                 <p className="text-xs font-medium text-gray-400">
                    {isLogin ? 'Ainda não tem uma conta no DRIP? ' : 'Já tem uma conta? '}
                    <button 
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-[#8A05BE] font-bold hover:underline ml-1"
                    >
                      {isLogin ? 'Criar agora' : 'Entre aqui'}
                    </button>
                 </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-20">
           <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] leading-relaxed">
              DRIP FINANCEIRO © 2026<br/>
              Acompanhamos seu crescimento de perto.
           </p>
        </div>
      </div>

      {/* Right Side: Image/Illustration */}
      <div className="hidden md:flex flex-1 relative bg-[#F5F5F7] items-center justify-center p-12 lg:p-24 overflow-hidden">
         {/* Background Circles/Gradients */}
         <div className="absolute top-0 right-0 w-full h-full bg-[#8A05BE] transition-all duration-1000" 
              style={{ clipPath: 'polygon(100% 0, 100% 100%, 30% 100%)' }} />
         
         <div className="relative z-10 w-full max-w-2xl transform rotate-2 hover:rotate-0 transition-transform duration-700">
            <img 
               src="/nubank_style_card_illustration_1774234975476.png" 
               alt="Nubank Illustration" 
               className="w-full h-auto drop-shadow-[0_35px_35px_rgba(138,5,190,0.3)] rounded-[3rem]"
            />
            {/* Overlay Text/Cards if needed */}
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-[280px] border border-gray-100 hidden lg:block">
               <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 text-[#8A05BE]">
                  <Globe size={24} />
               </div>
               <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-2">Gestão completa</h3>
               <p className="text-sm text-gray-400 font-medium">Controle suas despesas PF e PJ em um só lugar com o DRIP.</p>
            </div>
         </div>

         {/* Animated Blob */}
         <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 -right-32 w-96 h-96 bg-purple-400 opacity-20 blur-[100px] rounded-full"
         />
      </div>

    </div>
  );
};

export default Auth;
