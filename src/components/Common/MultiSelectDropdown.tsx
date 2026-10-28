import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search, Calendar, Clock } from 'lucide-react';

export interface MultiSelectOption {
  id: string;
  label: string;
  subLabel?: string;
  badge?: string;
  group?: string;
}

interface MultiSelectDropdownProps {
  label: string;
  icon?: React.ReactNode;
  placeholder?: string;
  description?: string;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  colorTheme?: 'cyan' | 'emerald' | 'purple' | 'blue';
  emptyMessage?: string;
  idPrefix?: string;
  inlineExpanded?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  icon,
  placeholder = 'Selecione as opções...',
  description,
  options,
  selectedIds,
  onChange,
  colorTheme = 'cyan',
  emptyMessage = 'Nenhuma opção disponível cadastrada.',
  idPrefix = 'multiselect',
  inlineExpanded = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside (only needed when not inline expanded)
  useEffect(() => {
    if (inlineExpanded) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inlineExpanded]);

  const themeClasses = {
    cyan: {
      accent: 'border-cyan-500 ring-cyan-500 text-cyan-600 dark:text-cyan-400',
      badge: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      tagBadge: 'bg-cyan-600 text-white',
      checkBg: 'bg-cyan-600 text-white border-cyan-600',
      hover: 'hover:bg-cyan-50 dark:hover:bg-cyan-950/40',
      focusRing: 'focus:ring-cyan-500',
      btnText: 'text-cyan-600 dark:text-cyan-400',
      activeItem: 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800',
    },
    emerald: {
      accent: 'border-emerald-500 ring-emerald-500 text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      tagBadge: 'bg-emerald-600 text-white',
      checkBg: 'bg-emerald-600 text-white border-emerald-600',
      hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
      focusRing: 'focus:ring-emerald-500',
      btnText: 'text-emerald-600 dark:text-emerald-400',
      activeItem: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
    },
    purple: {
      accent: 'border-purple-500 ring-purple-500 text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      tagBadge: 'bg-purple-600 text-white',
      checkBg: 'bg-purple-600 text-white border-purple-600',
      hover: 'hover:bg-purple-50 dark:hover:bg-purple-950/40',
      focusRing: 'focus:ring-purple-500',
      btnText: 'text-purple-600 dark:text-purple-400',
      activeItem: 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800',
    },
    blue: {
      accent: 'border-blue-500 ring-blue-500 text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      tagBadge: 'bg-blue-600 text-white',
      checkBg: 'bg-blue-600 text-white border-blue-600',
      hover: 'hover:bg-blue-50 dark:hover:bg-blue-950/40',
      focusRing: 'focus:ring-blue-500',
      btnText: 'text-blue-600 dark:text-blue-400',
      activeItem: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800',
    },
  }[colorTheme];

  const isOptionSelected = (optId: string) => {
    return selectedIds.some((id) => {
      if (id === optId) return true;
      if (id.replace(/[º°]/g, 'º') === optId.replace(/[º°]/g, 'º')) return true;
      if (id.startsWith('Anual') && optId.startsWith('Anual')) return true;
      return false;
    });
  };

  const handleToggle = (id: string) => {
    if (isOptionSelected(id)) {
      onChange(selectedIds.filter((item) => {
        if (item === id) return false;
        if (item.replace(/[º°]/g, 'º') === id.replace(/[º°]/g, 'º')) return false;
        if (item.startsWith('Anual') && id.startsWith('Anual')) return false;
        return true;
      }));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredOptions.map((o) => o.id);
    const combined = Array.from(new Set([...selectedIds, ...allFilteredIds]));
    onChange(combined);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const filteredOptions = options.filter((opt) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q)) ||
      (opt.group && opt.group.toLowerCase().includes(q))
    );
  });

  // Resolve selected options with fallback for custom or differently-cased ids
  const selectedOptionsMap = new Map<string, MultiSelectOption>();
  selectedIds.forEach((id) => {
    const matched = options.find((opt) =>
      opt.id === id ||
      opt.id.replace(/[º°]/g, 'º') === id.replace(/[º°]/g, 'º') ||
      (opt.id.startsWith('Anual') && id.startsWith('Anual'))
    );
    if (matched) {
      selectedOptionsMap.set(matched.id, matched);
    } else {
      selectedOptionsMap.set(id, { id, label: id });
    }
  });
  const selectedOptions = Array.from(selectedOptionsMap.values());

  // RENDER MODE 1: INLINE EXPANDED (Permite que todos os cadastros sejam vistos diretamente)
  if (inlineExpanded) {
    return (
      <div ref={containerRef} className="w-full space-y-2" id={`${idPrefix}-container`}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
            {icon}
            <span>{label}</span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${themeClasses.tagBadge}`}>
              {selectedIds.length} selecionado{selectedIds.length !== 1 ? 's' : ''} de {options.length}
            </span>
          </label>
          <div className="flex items-center gap-2 text-[11px] font-bold shrink-0">
            <button
              type="button"
              onClick={handleSelectAll}
              className={`${themeClasses.btnText} hover:underline`}
            >
              Todos ({filteredOptions.length})
            </button>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-rose-500 hover:underline"
            >
              Limpar
            </button>
          </div>
        </div>

        {description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            {description}
          </p>
        )}

        {/* Search Input for fast filtering if more than 3 items */}
        {options.length > 3 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Filtrar (${options.length} disponíveis)...`}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-400"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Expanded Box with visible checkboxes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 max-h-56 sm:max-h-64 overflow-y-auto space-y-1 shadow-inner">
          {filteredOptions.length === 0 ? (
            <div className="py-6 px-3 text-center text-xs text-slate-400 dark:text-slate-500 italic">
              {searchFilter ? 'Nenhum resultado encontrado para a busca.' : emptyMessage}
            </div>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected = isOptionSelected(opt.id);
              const showGroupHeader = Boolean(
                opt.group && (index === 0 || filteredOptions[index - 1]?.group !== opt.group)
              );
              return (
                <React.Fragment key={opt.id}>
                  {showGroupHeader && (
                    <div className="px-2 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-slate-800/50 rounded">
                      {opt.group}
                    </div>
                  )}
                  <div
                    onClick={() => handleToggle(opt.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all text-xs border ${
                      isSelected
                        ? `${themeClasses.activeItem} font-semibold shadow-xs`
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div
                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? themeClasses.checkBg
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-slate-800 dark:text-slate-100 font-bold">
                          {opt.label}
                        </div>
                        {opt.subLabel && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {opt.subLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    {opt.badge && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // RENDER MODE 2: DROPDOWN (Padrão)
  return (
    <div ref={containerRef} className="relative w-full space-y-1.5" id={`${idPrefix}-container`}>
      {/* Label and Info */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
          {selectedIds.length > 0 && (
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${themeClasses.tagBadge}`}>
              {selectedIds.length}
            </span>
          )}
        </label>
      </div>

      {description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
          {description}
        </p>
      )}

      {/* Trigger Box (Caixa Suspensa) */}
      <button
        type="button"
        id={`${idPrefix}-trigger`}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-xs font-medium text-left flex items-center justify-between gap-2 transition-all outline-none ${
          isOpen
            ? `border-2 ${themeClasses.accent} shadow-sm bg-white dark:bg-slate-800`
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex-1 truncate">
          {selectedIds.length === 0 ? (
            <span className="text-slate-400 dark:text-slate-500 italic">{placeholder}</span>
          ) : (
            <span className="text-slate-800 dark:text-slate-100 font-semibold">
              {selectedOptions.map((o) => o.label).join(', ')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 shrink-0">
          {selectedIds.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              title="Limpar seleção"
              className="p-0.5 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-500' : ''}`}
          />
        </div>
      </button>

      {/* Selected tags pills display */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-24 overflow-y-auto">
          {selectedOptions.map((opt) => (
            <span
              key={opt.id}
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all ${themeClasses.badge}`}
            >
              <span>{opt.label}</span>
              {opt.badge && (
                <span className="text-[9px] opacity-75 font-normal">({opt.badge})</span>
              )}
              <button
                type="button"
                onClick={() => handleToggle(opt.id)}
                className="hover:text-rose-500 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title={`Remover ${opt.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Menu (Caixa Suspensa Aberta) */}
      {isOpen && (
        <div
          id={`${idPrefix}-dropdown-menu`}
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header with Search and Quick Actions */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar opções..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-400 placeholder:font-normal"
                autoFocus
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold px-1 text-slate-500 dark:text-slate-400">
              <span>{filteredOptions.length} disponíveis</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`${themeClasses.btnText} hover:underline`}
                >
                  Selecionar Todos
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-rose-500 hover:underline"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-400 dark:text-slate-500">
                {searchFilter ? 'Nenhum resultado encontrado para a busca.' : emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = isOptionSelected(opt.id);
                const showGroupHeader = Boolean(
                  opt.group && (index === 0 || filteredOptions[index - 1]?.group !== opt.group)
                );
                return (
                  <React.Fragment key={opt.id}>
                    {showGroupHeader && (
                      <div className="px-2.5 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/70 dark:bg-slate-900/50 rounded mt-0.5">
                        {opt.group}
                      </div>
                    )}
                    <div
                      onClick={() => handleToggle(opt.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800/80 font-bold'
                          : `${themeClasses.hover} text-slate-700 dark:text-slate-300`
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 pr-2">
                        <div
                          className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            isSelected
                              ? themeClasses.checkBg
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-slate-800 dark:text-slate-100 font-semibold">
                            {opt.label}
                          </div>
                          {opt.subLabel && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {opt.subLabel}
                            </div>
                          )}
                        </div>
                      </div>

                      {opt.badge && (
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Footer close button */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors"
            >
              Concluir Seleção
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const defaultSemesterApplicationOptions: MultiSelectOption[] = [
  // Trimestres
  { id: '1° Trimestre', label: '1° Trimestre', group: 'Trimestres', badge: 'Trimestre' },
  { id: '2° Trimestre', label: '2° Trimestre', group: 'Trimestres', badge: 'Trimestre' },
  { id: '3° Trimestre', label: '3° Trimestre', group: 'Trimestres', badge: 'Trimestre' },
  // Semestres
  { id: '1º Semestre', label: '1º Semestre', group: 'Semestres', badge: 'Semestre' },
  { id: '2º Semestre', label: '2º Semestre', group: 'Semestres', badge: 'Semestre' },
  // Anual
  { id: 'Anual (Ano Letivo Completo)', label: 'Anual (Ano Letivo Completo)', group: 'Anual', badge: 'Ano Letivo' },
];

export const getDefaultLessonsForStage = (stageName: string): number => {
  if (stageName.includes('Trimestre')) return 40;
  if (stageName.includes('Semestre')) return 80;
  if (stageName.includes('Anual')) return 120;
  return 80;
};

// ==========================================
// SEMESTER CHECKBOXES COMPONENT
// ==========================================
export interface SemesterCheckboxesProps {
  label?: string;
  icon?: React.ReactNode;
  description?: string;
  selectedSemesters: string[];
  onChange: (selected: string[]) => void;
  idPrefix?: string;
}

export const SemesterCheckboxes: React.FC<SemesterCheckboxesProps> = ({
  label = 'Semestre de Aplicação (Seleção via Checkbox):',
  icon,
  description = 'Marque os semestres ou trimestres em que a disciplina será aplicada:',
  selectedSemesters,
  onChange,
  idPrefix = 'sem-chk',
}) => {
  const isSelected = (id: string) => {
    return selectedSemesters.some((s) => {
      if (s === id) return true;
      if (s.replace(/[º°]/g, 'º') === id.replace(/[º°]/g, 'º')) return true;
      if (s.startsWith('Anual') && id.startsWith('Anual')) return true;
      return false;
    });
  };

  const handleToggle = (id: string) => {
    if (isSelected(id)) {
      onChange(selectedSemesters.filter((s) => {
        if (s === id) return false;
        if (s.replace(/[º°]/g, 'º') === id.replace(/[º°]/g, 'º')) return false;
        if (s.startsWith('Anual') && id.startsWith('Anual')) return false;
        return true;
      }));
    } else {
      onChange([...selectedSemesters, id]);
    }
  };

  const handleQuickSelect = (type: 'trimestres' | 'semestres' | 'anual' | 'limpar') => {
    if (type === 'trimestres') {
      onChange(['1° Trimestre', '2° Trimestre', '3° Trimestre']);
    } else if (type === 'semestres') {
      onChange(['1º Semestre', '2º Semestre']);
    } else if (type === 'anual') {
      onChange(['Anual (Ano Letivo Completo)']);
    } else if (type === 'limpar') {
      onChange([]);
    }
  };

  const optionsList = [
    { id: '1° Trimestre', label: '1° Trimestre', category: 'Trimestre', badge: '1° Tri' },
    { id: '2° Trimestre', label: '2° Trimestre', category: 'Trimestre', badge: '2° Tri' },
    { id: '3° Trimestre', label: '3° Trimestre', category: 'Trimestre', badge: '3° Tri' },
    { id: '1º Semestre', label: '1º Semestre', category: 'Semestre', badge: '1º Sem' },
    { id: '2º Semestre', label: '2º Semestre', category: 'Semestre', badge: '2º Sem' },
    { id: 'Anual (Ano Letivo Completo)', label: 'Anual (Ano Letivo Completo)', category: 'Anual', badge: 'Ano Todo' },
  ];

  return (
    <div className="w-full space-y-2.5" id={`${idPrefix}-container`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          {icon || <Calendar className="w-4 h-4 text-cyan-500" />}
          <span>{label}</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-600 text-white">
            {selectedSemesters.length} marcada{selectedSemesters.length !== 1 ? 's' : ''}
          </span>
        </label>

        {/* Quick select shortcuts */}
        <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => handleQuickSelect('trimestres')}
            className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900 transition-colors"
          >
            3 Trimestres
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect('semestres')}
            className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            2 Semestres
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect('anual')}
            className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
          >
            Anual
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect('limpar')}
            className="px-1.5 py-0.5 text-rose-500 hover:underline"
          >
            Limpar
          </button>
        </div>
      </div>

      {description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
          {description}
        </p>
      )}

      {/* Grid of Checkboxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {optionsList.map((opt) => {
          const checked = isSelected(opt.id);
          return (
            <label
              key={opt.id}
              onClick={() => handleToggle(opt.id)}
              className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none transition-all ${
                checked
                  ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-500 ring-1 ring-cyan-500 text-cyan-900 dark:text-cyan-100 font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  checked
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                }`}
              >
                {checked && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs truncate font-bold leading-tight">{opt.label}</div>
                <div className="text-[10px] opacity-70 font-normal truncate">{opt.category}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
