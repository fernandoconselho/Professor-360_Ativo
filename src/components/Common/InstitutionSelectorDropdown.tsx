import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, ChevronDown, Plus, Check, School, ShieldAlert, Sparkles, Settings2 } from 'lucide-react';

interface InstitutionSelectorDropdownProps {
  variant?: 'navbar' | 'inline' | 'sidebar' | 'dashboard';
  onManageClick?: () => void;
}

export const InstitutionSelectorDropdown: React.FC<InstitutionSelectorDropdownProps> = ({
  variant = 'navbar',
  onManageClick
}) => {
  const {
    institutions,
    selectedInstitutionId,
    setSelectedInstitutionId,
    institution,
    allCourses,
    allClasses,
    allStudents
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCountsForInstitution = (instId: string) => {
    const coursesCount = allCourses.filter(c => (c.institutionId || institutions[0]?.id) === instId).length;
    const classesCount = allClasses.filter(c => (c.institutionId || institutions[0]?.id) === instId).length;
    const studentsCount = allStudents.filter(s => (s.institutionId || institutions[0]?.id) === instId).length;
    return { coursesCount, classesCount, studentsCount };
  };

  const handleSelect = (instId: string) => {
    setSelectedInstitutionId(instId);
    setIsOpen(false);
  };

  const handleAddNew = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onManageClick) {
      onManageClick();
    }
  };

  if (variant === 'sidebar') {
    return (
      <div className="relative w-full" ref={dropdownRef} id="sidebar-institution-selector">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1.5 flex items-center justify-between px-1">
          <span className="flex items-center gap-1">
            <School className="w-3 h-3 text-[#40E0D0]" /> Unidade Escolar
          </span>
          <span className="bg-[#40E0D0]/10 text-[#40E0D0] px-1.5 py-0.2 rounded font-bold text-[9px]">
            {institutions.length}/3
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all group"
        >
          <div className="flex items-center gap-2 min-w-0">
            {institution.logoUrl ? (
              <img
                src={institution.logoUrl}
                alt={institution.name}
                className="w-6 h-6 object-contain rounded bg-white p-0.5 border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded bg-[#40E0D0]/20 text-[#40E0D0] flex items-center justify-center shrink-0 font-bold text-xs">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                {institution.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {institution.code ? `${institution.code} • ` : ''}{institution.city || 'Campus Principal'}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180 text-[#40E0D0]' : 'group-hover:text-slate-600'}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
              <span>Selecione a Unidade ({institutions.length}/3)</span>
              <span className="text-[9px] lowercase font-normal text-slate-400">dados isolados</span>
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {institutions.map(inst => {
                const isSelected = inst.id === selectedInstitutionId;
                const stats = getCountsForInstitution(inst.id);
                return (
                  <button
                    key={inst.id}
                    onClick={() => handleSelect(inst.id)}
                    className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-[#40E0D0]/15 text-[#002B5B] dark:text-[#40E0D0] font-semibold border border-[#40E0D0]/30'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {inst.logoUrl ? (
                        <img src={inst.logoUrl} alt="" className="w-5 h-5 rounded bg-white p-0.5 object-contain border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {inst.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{inst.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {stats.coursesCount} cursos • {stats.studentsCount} alunos
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#40E0D0] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
              {institutions.length < 3 && onManageClick && (
                <button
                  onClick={handleAddNew}
                  className="w-full flex items-center justify-center gap-1.5 p-1.5 rounded-lg text-xs font-bold text-[#002B5B] dark:text-[#40E0D0] bg-[#40E0D0]/10 hover:bg-[#40E0D0]/20 transition-all border border-[#40E0D0]/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cadastrar Unidade ({institutions.length + 1}/3)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default 'navbar' variant
  return (
    <div className="relative" ref={dropdownRef} id="navbar-institution-selector">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#001D3D] hover:bg-[#001D3D]/90 border border-[#ffffff20] hover:border-[#40E0D0]/60 text-white transition-all shadow-inner group cursor-pointer"
        title="Clique para alternar ou cadastrar Unidades Escolares (até 3)"
      >
        <div className="flex items-center gap-2">
          {institution.logoUrl ? (
            <div className="w-6 h-6 rounded-md bg-white p-0.5 shadow flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={institution.logoUrl}
                alt={institution.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div
              className="w-6 h-6 rounded-md font-bold flex items-center justify-center text-xs shrink-0 shadow-sm"
              style={{
                backgroundColor: institution.secondaryColor || '#40E0D0',
                color: institution.primaryColor || '#002B5B'
              }}
            >
              <School className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: institution.secondaryColor || '#40E0D0' }}
              >
                Unidade Escolar
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-white/80 font-mono">
                {institutions.length}/3
              </span>
              {/* Color indicator pip */}
              <span
                className="w-2 h-2 rounded-full border border-white/30"
                style={{ backgroundColor: institution.secondaryColor || '#40E0D0' }}
                title={`Tema Ativo`}
              />
            </div>
            <p className="text-xs font-bold text-white max-w-[140px] md:max-w-[200px] lg:max-w-[260px] truncate leading-tight">
              {institution.name}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${isOpen ? 'rotate-180 text-[#40E0D0]' : 'group-hover:text-white'}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 sm:w-80 z-50 bg-[#002244] border border-[#40E0D0]/40 rounded-2xl shadow-2xl p-2 text-white animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#40E0D0] flex items-center gap-1">
                <School className="w-3.5 h-3.5" /> Unidades Escolares
              </span>
              <p className="text-[10px] text-slate-300">
                Alterne entre suas instituições (máx. 3 cadastradas)
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#40E0D0]/20 text-[#40E0D0] font-bold border border-[#40E0D0]/40">
              {institutions.length} de 3
            </span>
          </div>

          {/* List of Institutions */}
          <div className="py-2 space-y-1.5 max-h-64 overflow-y-auto">
            {institutions.map((inst, index) => {
              const isSelected = inst.id === selectedInstitutionId;
              const stats = getCountsForInstitution(inst.id);
              const instPrimary = inst.primaryColor || '#002B5B';
              const instSecondary = inst.secondaryColor || '#40E0D0';

              return (
                <button
                  key={inst.id}
                  onClick={() => handleSelect(inst.id)}
                  className={`w-full flex items-start justify-between gap-2.5 p-2.5 rounded-xl text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-white/15 border shadow-md'
                      : 'hover:bg-white/10 border border-transparent text-slate-200'
                  }`}
                  style={{
                    borderColor: isSelected ? instSecondary : undefined
                  }}
                >
                  {/* Left color bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: instSecondary }}
                  />

                  <div className="flex items-start gap-2.5 min-w-0 pl-1">
                    <div className="relative shrink-0 mt-0.5">
                      {inst.logoUrl ? (
                        <img
                          src={inst.logoUrl}
                          alt={inst.name}
                          className="w-8 h-8 rounded-lg bg-white p-0.5 object-contain border border-white/20 shadow-sm"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg font-black flex items-center justify-center text-sm border shadow-sm"
                          style={{
                            backgroundColor: `${instSecondary}30`,
                            color: instSecondary,
                            borderColor: `${instSecondary}50`
                          }}
                        >
                          {inst.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#001D3D] rounded-full text-[9px] font-bold text-slate-300 flex items-center justify-center border border-white/20">
                        {index + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white truncate">
                          {inst.name}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-300 truncate">
                        {inst.city || 'Campus Principal'} {inst.code ? `• Código: ${inst.code}` : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: instSecondary }}>
                        <span>{stats.coursesCount} cursos</span>
                        <span>•</span>
                        <span>{stats.classesCount} turmas</span>
                        <span>•</span>
                        <span>{stats.studentsCount} alunos</span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="shrink-0 mt-1">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center shadow-md font-bold"
                        style={{
                          backgroundColor: instSecondary,
                          color: instPrimary
                        }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Action to Add / Manage */}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
            {institutions.length < 3 ? (
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold bg-[#40E0D0] text-[#002B5B] hover:bg-[#40E0D0]/90 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Nova Unidade ({institutions.length + 1}/3)
              </button>
            ) : (
              <div className="text-center py-1 px-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                Limite máximo atingido (3/3 instituições)
              </div>
            )}

            {onManageClick && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onManageClick();
                }}
                className="w-full flex items-center justify-center gap-1.5 p-1.5 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5 text-[#40E0D0]" />
                Gerenciar Dados e Parâmetros das Unidades
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
