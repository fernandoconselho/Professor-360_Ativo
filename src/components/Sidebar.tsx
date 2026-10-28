import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Table,
  CalendarCheck2,
  Building2,
  BookOpenCheck,
  Users,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  Edit3,
  ShieldCheck,
  LogOut,
  UserCheck
} from 'lucide-react';
import { ProfessorProfileModal } from './Dashboard/ProfessorProfileModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen
}) => {
  const {
    currentUser,
    institutions,
    institution,
    logout
  } = useApp();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navItems = [
    ...(currentUser.role === 'admin' ? [
      {
        id: 'professores',
        label: 'Gestão de Professores',
        icon: UserCheck,
        badge: 'Admin',
        isActive: activeTab === 'professores'
      }
    ] : []),
    {
      id: 'dashboard',
      label: 'Painel do Docente',
      icon: LayoutDashboard,
      isActive: activeTab === 'dashboard'
    },
    {
      id: 'ava-planilha',
      label: 'Planilha AVA',
      icon: Table,
      badge: 'Notas',
      isActive: activeTab === 'ava-planilha' || activeTab === 'painel-turma'
    },
    {
      id: 'frequencia',
      label: 'Registro de Presença',
      icon: CalendarCheck2,
      badge: 'Chamada',
      isActive: activeTab === 'frequencia'
    },
    {
      id: 'cursos',
      label: 'Cursos, Turmas e UC´s',
      icon: BookOpenCheck,
      isActive: activeTab === 'cursos' || activeTab === 'ucs'
    },
    {
      id: 'alunos',
      label: 'Estudantes Cadastrados',
      icon: Users,
      isActive: activeTab === 'alunos'
    },
    {
      id: 'instituicao',
      label: 'Unidade Escolar',
      icon: Building2,
      badge: `${institutions.length}/3`,
      isActive: activeTab === 'instituicao'
    },
    {
      id: 'relatorios',
      label: 'Relatórios & Exportação',
      icon: FileSpreadsheet,
      isActive: activeTab === 'relatorios'
    }
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#002B5B] border-r border-[#ffffff15] text-slate-100 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:w-64 pt-16 lg:pt-0 shrink-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col justify-between p-4 overflow-y-auto">
        
        <div className="space-y-4">

          {/* Nav List */}
          <div>
            <p className="text-[11px] font-bold text-[#40E0D0] uppercase tracking-wider px-3 mb-2 opacity-90">
              Menu Principal
            </p>
            <nav className="space-y-1.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = item.isActive;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ffffff1a] text-white font-semibold shadow-sm border-l-4 border-[#40E0D0]'
                        : 'text-slate-200 hover:bg-[#ffffff0d] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#40E0D0]' : 'text-slate-300'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isActive
                            ? 'bg-[#40E0D0]/20 text-[#40E0D0]'
                            : 'bg-white/10 text-[#40E0D0]'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#40E0D0] shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

        </div>

        {/* Docente Profile Box & Edit Modal Trigger */}
        <div className="mt-auto pt-3 border-t border-[#ffffff15] space-y-2">
          <div
            onClick={() => {
              setShowProfileModal(true);
              setIsOpen(false);
            }}
            className="p-2.5 bg-[#001D3D] hover:bg-[#001D3D]/80 rounded-xl border border-[#ffffff1a] hover:border-[#40E0D0]/50 transition-all cursor-pointer group flex items-center justify-between gap-2.5 shadow-inner"
            title="Clique para editar seus dados pessoais e foto de perfil"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover border border-[#40E0D0]/40 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#40E0D0]/20 text-[#40E0D0] font-black flex items-center justify-center text-xs border border-[#40E0D0]/40">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 p-0.5 bg-[#40E0D0] text-[#002B5B] rounded-full">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-[#40E0D0] transition-colors">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-300 truncate">
                  {currentUser.registration || 'Docente'} • {currentUser.title || 'Prof.'}
                </p>
              </div>
            </div>

            <span className="p-1 rounded-lg bg-white/10 group-hover:bg-[#40E0D0] text-slate-300 group-hover:text-[#002B5B] transition-colors shrink-0">
              <Edit3 className="w-3 h-3" />
            </span>
          </div>

          {/* Footer Info Box */}
          <div className="p-2.5 bg-[#001D3D]/60 rounded-xl border border-[#ffffff15] text-[10px] text-slate-300 space-y-0.5">
            <div className="flex items-center justify-between font-bold text-white">
              <span>SISTEMA AVA+</span>
              <span className="text-[9px] text-[#40E0D0] bg-[#002B5B] border border-[#40E0D0]/40 px-1 py-0.2 rounded font-mono">v2.4 Pro</span>
            </div>
            <p className="text-slate-300">
              Freq. mínima: <strong className="text-[#40E0D0]">75%</strong> • Média: <strong className="text-[#FFD700]">6.0</strong>
            </p>
          </div>

          {/* Sair da Conta */}
          <button
            onClick={async () => {
              setIsOpen(false);
              await logout();
            }}
            className="w-full p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>

      </div>

      {/* Professor Profile Modal */}
      <ProfessorProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </aside>
  );
};

