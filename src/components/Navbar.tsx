import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  UserCheck,
  Shield,
  BookOpen,
  Users,
  Search,
  RotateCcw,
  Smartphone,
  CheckCircle2,
  X,
  Sparkles,
  Compass,
  ShieldCheck,
  Layers,
  School
} from 'lucide-react';
import { UserRole } from '../types';
import { InstitutionSelectorDropdown } from './Common/InstitutionSelectorDropdown';
import { ProfessorProfileModal } from './Dashboard/ProfessorProfileModal';
import { Edit3 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentUser,
    setCurrentUser,
    users,
    notifications,
    markNotificationAsRead,
    isDarkMode,
    toggleDarkMode,
    resetDemoData,
    institution,
    getRoleLabel,
    roleOrder,
    logout
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMobileBadge, setShowMobileBadge] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.read);

  const getRoleBadge = () => {
    return (
      <span className="bg-[#40E0D0]/20 text-[#40E0D0] border border-[#40E0D0]/40 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
        <BookOpen className="w-3 h-3" /> Docente
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-[#002B5B] border-b border-[#ffffff15] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center flex-wrap sm:flex-nowrap min-h-16 py-2 sm:py-0 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#40E0D0] text-[#002B5B] font-black shadow-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 text-[#002B5B]" />
              </div>
              <div className="hidden min-[400px]:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl tracking-tight text-white">
                    AVA+
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[#40E0D0]/20 text-[#40E0D0] border border-[#40E0D0]/40 font-bold uppercase tracking-wider">
                    Presença
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium">
                  Portal do Professor
                </p>
              </div>
            </button>
          </div>

          <div className="hidden sm:block w-px h-7 bg-white/15 shrink-0" />

          {/* Unidade Escolar Dropdown Selector */}
          <div className="shrink-0">
            <InstitutionSelectorDropdown
              variant="navbar"
              onManageClick={() => setActiveTab('institution')}
            />
          </div>

          <div className="hidden sm:block w-px h-7 bg-white/15 shrink-0" />

          {/* Action Icons & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Mobile / PWA App Store Readiness Indicator */}
            <button
              onClick={() => setShowMobileBadge(prev => !prev)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Compatibilidade Web & Mobile Native"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline font-medium">Web/App</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors border border-slate-700 cursor-pointer"
              title="Alternar Modo Claro / Escuro"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(prev => !prev)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors relative border border-slate-700 cursor-pointer"
                title="Central de Notificações"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-400" /> Notificações do Sistema
                    </span>
                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-medium">
                      {unreadNotifs.length} não lidas
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-500">Nenhuma notificação no momento.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-800/50 ${
                            !n.read ? 'bg-slate-800/30' : 'opacity-70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`font-semibold ${
                              n.type === 'danger' ? 'text-rose-400' :
                              n.type === 'warning' ? 'text-amber-400' :
                              n.type === 'success' ? 'text-emerald-400' : 'text-cyan-400'
                            }`}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                              {new Date(n.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

              {/* User Profile Info */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(prev => !prev)}
                  className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 transition-all text-left"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-cyan-500/40"
                  />
                  <div className="hidden sm:block text-xs leading-tight">
                    <div className="font-bold text-white truncate max-w-[140px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-cyan-400 font-semibold">
                      Docente Responsável
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Profile Dropdown */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'}
                          alt={currentUser.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-cyan-500/50"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-sm text-white truncate">{currentUser.name}</p>
                          <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                          <div className="mt-1">
                            {getRoleBadge()}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-0.5">
                        <p><strong className="text-slate-400">Matrícula:</strong> {currentUser.registration || 'DOC-2024-089'}</p>
                        <p><strong className="text-slate-400">Departamento:</strong> {currentUser.department || 'Ciências e Tecnologia'}</p>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-950/80 space-y-1">
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            setActiveTab('professores');
                          }}
                          className="text-xs text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all w-full justify-center font-bold shadow-md cursor-pointer mb-1"
                        >
                          <Users className="w-4 h-4" /> Gestão de Professores (Admin)
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setShowProfileModal(true);
                        }}
                        className="text-xs text-white bg-cyan-600 hover:bg-cyan-500 flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all w-full justify-center font-bold shadow-md cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" /> Meus Dados & Segurança
                      </button>

                      <button
                        onClick={async () => {
                          setShowUserDropdown(false);
                          await logout();
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-colors w-full justify-center font-bold cursor-pointer border border-rose-900/40"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Sair da Conta (Logout)
                      </button>
                    </div>
                  </div>
                )}
              </div>

          </div>
        </div>
      </div>

      {/* Professor Profile Modal */}
      <ProfessorProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Mobile / PWA App Compatibility Info Banner */}
      {showMobileBadge && (
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-t border-cyan-800/50 px-4 py-2 text-xs text-cyan-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Layout Multi-Plataforma Ativo:</strong> Totalmente otimizado para navegadores Web, Tablets, Android (PWA) e iOS (App Store viewport).
              </span>
            </div>
            <button
              onClick={() => setShowMobileBadge(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
