'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  History as HistoryIcon, 
  PlusCircle, 
  Target, 
  Settings,
  CreditCard,
  Droplets,
  ChevronRight,
  PieChart
} from 'lucide-react';
import clsx from 'clsx';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === '/';

  const navItems = [
    { href: '/', icon: Home, label: 'Início' },
    { href: '/historico', icon: HistoryIcon, label: 'Extrato' },
    { href: '/categorias', icon: PieChart, label: 'Análise' },
    { href: '/faturas', icon: CreditCard, label: 'Cartões' },
    { href: '/metas', icon: Target, label: 'Caixinhas' },
    { href: '/config', icon: Settings, label: 'Config' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col xl:flex-row">
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-white border-r border-gray-100 hidden xl:flex flex-col sticky top-0 h-screen shadow-sm shrink-0">
        {/* Logo */}
        <div className="px-8 py-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-nubank-purple rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 shrink-0">
            <Droplets size={26} strokeWidth={2.5} className="text-white fill-white/10" />
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-900 tracking-tighter leading-none">DRIP</span>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Financeiro</p>
          </div>
        </div>

        {/* Navigation Desktop */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-bold transition-all group',
                  isActive 
                    ? 'bg-purple-50 text-nubank-purple shadow-sm scale-[1.02]' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                )}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={20} className={clsx('transition-colors', 'group-hover:text-nubank-purple')} />
                  <span className="uppercase tracking-widest text-[10px]">{item.label}</span>
                </div>
                <ChevronRight size={14} className={clsx('opacity-0 transition-opacity', 'group-hover:opacity-100')} />
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions (Sidebar Footer) */}
        <div className="p-6">
          <Link 
            href="/novo" 
            className="flex items-center justify-center gap-3 w-full bg-nubank-purple text-white py-4 rounded-3xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-purple-100 hover:bg-nubank-purple-dark transition-all active:scale-95"
          >
            <PlusCircle size={18} />
            Novo Lançamento
          </Link>
          <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">Desenvolvido com foco em alta gestão financeira</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={clsx(
        "flex-1 relative min-h-screen",
        isDashboard ? "" : "px-4 pt-8 lg:px-10 pb-32 xl:pb-10"
      )}>
        {!isDashboard && (
          <div className="max-w-4xl mx-auto mb-8 xl:hidden">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-nubank-purple rounded-xl flex items-center justify-center text-white">
                    <Droplets size={22} />
                 </div>
                 <span className="text-xl font-bold text-gray-900 tracking-tighter">DRIP</span>
              </div>
          </div>
        )}
        <div className={clsx(!isDashboard && "max-w-4xl mx-auto")}>
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-gray-900/95 backdrop-blur-md rounded-[2.5rem] px-4 py-3 flex items-center justify-between shadow-2xl z-50 border border-white/10">
        {navItems.slice(0, 3).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all',
                isActive ? 'text-white' : 'text-gray-500'
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[8px] font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Floating Add Button Mobile */}
        <Link 
          href="/novo" 
          className="bg-nubank-purple text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-purple-600/30 -mt-12 border-4 border-[var(--nubank-bg)] transition-transform active:scale-95 ring-4 ring-gray-900"
        >
          <PlusCircle size={24} />
        </Link>

        {navItems.slice(3).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all',
                isActive ? 'text-white' : 'text-gray-500'
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[8px] font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
