import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  Save,
  RotateCcw,
  X,
  Check,
  Sparkles,
  Shield,
  BookOpen,
  UserCheck,
  Compass,
  ShieldCheck,
  Users,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { RoleLabels, UserRole, defaultRoleOrder } from '../../types';

interface RoleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoleDefinition {
  key: UserRole;
  defaultName: string;
  description: string;
  icon: React.ReactNode;
  badgeStyle: string;
  permissionText: string;
}

const staticRoleDefinitions: Record<UserRole, Omit<RoleDefinition, 'key'>> = {
  admin: {
    defaultName: 'Administrador Geral (Perfil 1)',
    description: 'Controle irrestrito do sistema, parametrização institucional, logs e auditoria.',
    icon: <Shield className="w-4 h-4 text-purple-500" />,
    badgeStyle: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    permissionText: 'Acesso Total / Gestão Geral'
  },
  professor: {
    defaultName: 'Professor (Perfil 2)',
    description: 'Lançamento de notas na planilha AVA, registro e edição de presenças das turmas atribuídas.',
    icon: <BookOpen className="w-4 h-4 text-cyan-500" />,
    badgeStyle: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    permissionText: 'Docência / Planilha AVA / Presenças'
  },
  coordenador: {
    defaultName: 'Coordenador (Perfil 3)',
    description: 'Gestão curricular, acompanhamento de turmas, aprovação de lançamentos e relatórios.',
    icon: <UserCheck className="w-4 h-4 text-amber-500" />,
    badgeStyle: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    permissionText: 'Coordenação / Dashboard / Relatórios'
  },
  orientador: {
    defaultName: 'Orientador Educacional',
    description: 'Acompanhamento pedagógico, indicadores de frequência, engajamento e apoio discente.',
    icon: <Compass className="w-4 h-4 text-indigo-500" />,
    badgeStyle: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    permissionText: 'Orientação / Acompanhamento Pedagógico'
  },
  supervisor: {
    defaultName: 'Supervisor Educacional',
    description: 'Supervisão pedagógica e curricular, conformidade de diários e auditoria de turmas.',
    icon: <ShieldCheck className="w-4 h-4 text-teal-500" />,
    badgeStyle: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    permissionText: 'Supervisão Curricular & Conformidade'
  },
  aluno: {
    defaultName: 'Aluno / Estudante',
    description: 'Consulta individual ao boletim acadêmico, notas e histórico de frequência.',
    icon: <Users className="w-4 h-4 text-emerald-500" />,
    badgeStyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    permissionText: 'Portal do Aluno / Boletim'
  }
};

export const RoleConfigModal: React.FC<RoleConfigModalProps> = ({ isOpen, onClose }) => {
  const { roleLabels, updateRoleLabels, resetRoleLabels, roleOrder, updateRoleOrder, resetRoleOrder } = useApp();
  const [formData, setFormData] = useState<RoleLabels>({ ...roleLabels });
  const [orderedRoles, setOrderedRoles] = useState<UserRole[]>([...roleOrder]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...roleLabels });
      // Ensure all current roles are present in orderedRoles
      const cleanOrder = [...roleOrder];
      defaultRoleOrder.forEach(r => {
        if (!cleanOrder.includes(r)) cleanOrder.push(r);
      });
      setOrderedRoles(cleanOrder);
      setSavedSuccess(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  }, [isOpen, roleLabels, roleOrder]);

  if (!isOpen) return null;

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // Left target
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...orderedRoles];
    const [movedRole] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedRole);

    setOrderedRoles(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Keyboard / Touch up/down fallback
  const moveRole = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedRoles.length) return;

    const updated = [...orderedRoles];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setOrderedRoles(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateRoleLabels(formData);
    updateRoleOrder(orderedRoles);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar a nomenclatura e a ordem original de todos os perfis de acesso?')) {
      resetRoleLabels();
      resetRoleOrder();
      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Personalizar e Organizar Perfis de Acesso
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arraste os cards para ordenar e altere os nomes conforme a sua instituição
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Instructions banner */}
          <div className="p-3.5 bg-gradient-to-r from-cyan-50 to-indigo-50 dark:from-cyan-950/30 dark:to-indigo-950/30 border border-cyan-200 dark:border-cyan-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
            <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-cyan-900 dark:text-cyan-200 mb-0.5">
                Organização por Arrastar e Soltar (Drag & Drop):
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Clique e segure no ícone <span className="inline-flex items-center font-bold px-1.5 py-0.2 bg-white dark:bg-slate-800 border rounded text-slate-700 dark:text-slate-300 mx-0.5">⋮⋮ Arrastar</span> para reordenar a prioridade de exibição dos perfis nos menus e listas do sistema.
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Regras de Acesso:</strong> A reordenação e renomeação alteram os textos e sequências visuais nos formulários e relatórios. As permissões de segurança de cada perfil base são mantidas intactas.
            </div>
          </div>

          {/* Draggable Role List */}
          <div className="space-y-3 pt-1">
            {orderedRoles.map((roleKey, index) => {
              const def = staticRoleDefinitions[roleKey];
              if (!def) return null;
              const currentVal = formData[roleKey];
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={roleKey}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative p-3.5 rounded-xl border transition-all select-none ${
                    isDragging
                      ? 'opacity-40 border-dashed border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 scale-[0.99]'
                      : isDragOver
                      ? 'border-2 border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/50 shadow-md ring-2 ring-cyan-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                    
                    {/* Left: Drag Handle + Order Index + Role Info */}
                    <div className="flex items-center gap-2.5">
                      
                      {/* Drag Handle */}
                      <div
                        title="Clique, segure e arraste para reordenar"
                        className="cursor-grab active:cursor-grabbing p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-colors flex items-center gap-1 group"
                      >
                        <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-cyan-500" />
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Icon & Base Role */}
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-xs border border-slate-200 dark:border-slate-600">
                          {def.icon}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            Perfil Base ({roleKey.toUpperCase()})
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {def.permissionText}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Preview Badge & Quick Reorder Buttons */}
                    <div className="flex items-center gap-2 self-start sm:self-auto pl-8 sm:pl-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Prévia:</span>
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border shadow-xs ${def.badgeStyle}`}>
                          {currentVal || def.defaultName}
                        </span>
                      </div>

                      {/* Up/Down buttons for quick reordering */}
                      <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-0.5 shadow-xs">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveRole(index, 'up')}
                          title="Mover para cima"
                          className="p-1 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === orderedRoles.length - 1}
                          onClick={() => moveRole(index, 'down')}
                          title="Mover para baixo"
                          className="p-1 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Input for name customization */}
                  <div className="pl-0 sm:pl-8 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      Nome de exibição:
                    </label>
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => setFormData({ ...formData, [roleKey]: e.target.value })}
                      placeholder={def.defaultName}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                      required
                    />
                    <p className="text-[10px] text-slate-400 italic">
                      {def.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrões
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 sm:w-auto px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savedSuccess}
                className={`w-1/2 sm:w-auto px-5 py-2 text-xs font-extrabold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  savedSuccess
                    ? 'bg-emerald-600'
                    : 'bg-cyan-600 hover:bg-cyan-500 active:scale-95'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" /> Salvo com Sucesso!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Salvar Ordem e Nomes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
