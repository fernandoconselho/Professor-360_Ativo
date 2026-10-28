import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Layers,
  Calculator,
  PlusCircle,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Edit3,
  Award,
  Info
} from 'lucide-react';
import { AVAActivity, GradeCalculationType } from '../../types';

interface AVAConfigModalProps {
  onClose: () => void;
}

export const AVAConfigModal: React.FC<AVAConfigModalProps> = ({ onClose }) => {
  const {
    selectedUC,
    avaActivities,
    addAVAActivity,
    updateAVAActivity,
    deleteAVAActivity,
    resetAVAActivitiesToDefault,
    updateGradeCalculationType,
    institution
  } = useApp();

  const [activeTab, setActiveTab] = useState<'p1' | 'p2'>('p1');
  const [newActName, setNewActName] = useState('');
  const [newActMaxScore, setNewActMaxScore] = useState<number>(3.0);
  const [newActWeight, setNewActWeight] = useState<number>(1.0);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const currentCalcType: GradeCalculationType =
    selectedUC?.gradeCalculationType || institution.defaultGradeCalculationType || 'sum';

  const p1List = avaActivities.filter(a => a && a.period === 'p1');
  const p2List = avaActivities.filter(a => a && a.period === 'p2');

  const currentList = activeTab === 'p1' ? p1List : p2List;
  const currentTabLabel = activeTab === 'p1' ? '1º Período (P1 - Síntese 1)' : '2º Período (P2 - Síntese 2)';
  const totalMaxScore = currentList.reduce((acc, a) => acc + (Number(a.maxScore) || 0), 0);

  const quickActivitySuggestions = [
    'Prova Bimestral',
    'Seminário Temático',
    'Estudo de Caso',
    'Quiz Interativo AVA',
    'Trabalho em Equipe',
    'Relatório Prático',
    'Artigo Científico',
    'Autoavaliação'
  ];

  const handleSelectCalcType = (type: GradeCalculationType) => {
    if (selectedUC) {
      updateGradeCalculationType(selectedUC.id, type);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActName.trim()) return;

    const newAct: AVAActivity = {
      id: `act-${activeTab}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      period: activeTab,
      name: newActName.trim(),
      weight: Number(newActWeight) || 1.0,
      maxScore: Number(newActMaxScore) || 3.0
    };

    addAVAActivity(newAct);
    setNewActName('');
    setNewActMaxScore(3.0);
    setNewActWeight(1.0);
    triggerSavedNotice();
  };

  const handleUpdate = (act: AVAActivity, field: keyof AVAActivity, value: any) => {
    const updated = { ...act, [field]: value };
    updateAVAActivity(updated);
    triggerSavedNotice();
  };

  const handleDelete = (id: string) => {
    deleteAVAActivity(id);
    triggerSavedNotice();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Deseja restaurar as atividades do AVA para a estrutura padrão (P1 e P2)?')) {
      resetAVAActivitiesToDefault();
      triggerSavedNotice();
    }
  };

  const triggerSavedNotice = () => {
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  return (
    <div id="modal-ava-config" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base tracking-tight">Configurar Atividades AVA por Trimestre</h2>
                {showSavedFeedback && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-bold animate-pulse">
                    <CheckCircle2 className="w-3 h-3" /> Sincronizado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {selectedUC ? `UC: ${selectedUC.name} (${selectedUC.code})` : 'Crie, edite e remova avaliações organizadas por trimestre.'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-ava-config"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* Section: Grade Calculation Method Selection */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-cyan-500" />
                  Formato de Computar a Nota (Síntese AVA)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Escolha como a nota síntese e parcial desta UC deve ser consolidada.
                </p>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                Ativo: {currentCalcType === 'average' ? 'Média Aritmética' : 'Somatória'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Option 1: Somatória */}
              <button
                type="button"
                id="btn-calc-sum"
                onClick={() => handleSelectCalcType('sum')}
                className={`text-left p-3.5 rounded-xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                  currentCalcType === 'sum'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 shadow-md ring-1 ring-cyan-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-100">
                      <PlusCircle className="w-4 h-4 text-amber-500" />
                      Somatória (Soma das Notas)
                    </span>
                    {currentCalcType === 'sum' && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    O professor faz a <strong>soma das notas</strong> obtidas em cada atividade (Síntese 1 e Síntese 2).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-950 p-1.5 rounded">
                  Fórmula: Síntese = Soma(Atividades) | Parcial = S1 + S2
                </div>
              </button>

              {/* Option 2: Média */}
              <button
                type="button"
                id="btn-calc-avg"
                onClick={() => handleSelectCalcType('average')}
                className={`text-left p-3.5 rounded-xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                  currentCalcType === 'average'
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 shadow-md ring-1 ring-cyan-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-100">
                      <Calculator className="w-4 h-4 text-cyan-500" />
                      Média (Média Aritmética)
                    </span>
                    {currentCalcType === 'average' && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Calcula a <strong>média das atividades</strong> de cada período, gerando a síntese de cada etapa.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-950 p-1.5 rounded">
                  Fórmula: Síntese = Média(Atividades) | Parcial = (S1 + S2) / 2
                </div>
              </button>
            </div>
          </div>

          {/* Activity Management Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-cyan-500" />
                  Gerenciamento de Atividades (P1 e P2)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Edite nomes e notas máximas diretamente nos campos ou adicione/exclua avaliações de cada período.
                </p>
              </div>

              {/* Total points badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Total {currentTabLabel}: <strong className="text-cyan-600 dark:text-cyan-400 font-extrabold">{totalMaxScore.toFixed(1)} pts</strong>
                </span>
              </div>
            </div>

            {/* Period Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 pt-2 rounded-t-xl gap-2">
              <button
                type="button"
                id="tab-ava-p1"
                onClick={() => setActiveTab('p1')}
                className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === 'p1'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                1º Período (P1 - Síntese 1)
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                  {p1List.length}
                </span>
              </button>

              <button
                type="button"
                id="tab-ava-p2"
                onClick={() => setActiveTab('p2')}
                className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
                  activeTab === 'p2'
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-900 shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                2º Período (P2 - Síntese 2)
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-bold">
                  {p2List.length}
                </span>
              </button>
            </div>

            {/* List & Edit Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-t-0 border-slate-200 dark:border-slate-800 rounded-b-xl space-y-3">
              {currentList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Nenhuma atividade cadastrada no {currentTabLabel}.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Utilize o formulário abaixo para adicionar novas avaliações.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <div className="sm:col-span-1">#</div>
                    <div className="sm:col-span-6">Nome da Atividade / Avaliação</div>
                    <div className="sm:col-span-2 text-center">Nota Máx.</div>
                    <div className="sm:col-span-2 text-center">Peso</div>
                    <div className="sm:col-span-1 text-right">Ações</div>
                  </div>

                  {currentList.map((act, index) => (
                    <div
                      key={act.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-xl flex flex-col sm:grid sm:grid-cols-12 items-center gap-3 text-xs hover:border-cyan-500/50 transition-colors"
                    >
                      {/* Badge Index */}
                      <div className="sm:col-span-1 flex items-center gap-2 self-start sm:self-center">
                        <span className={`w-6 h-6 rounded-lg font-black text-[11px] flex items-center justify-center ${
                          activeTab === 'p1' 
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' 
                            : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="sm:hidden font-bold text-slate-500">Atividade #{index + 1}</span>
                      </div>

                      {/* Name Input */}
                      <div className="w-full sm:col-span-6">
                        <input
                          type="text"
                          value={act.name}
                          onChange={(e) => handleUpdate(act, 'name', e.target.value)}
                          placeholder="Nome da atividade..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-sm"
                        />
                      </div>

                      {/* Max Score Input */}
                      <div className="w-full sm:col-span-2 flex sm:justify-center items-center gap-2">
                        <span className="sm:hidden text-slate-500 text-[11px] font-medium">Nota Máx:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="10"
                          value={act.maxScore}
                          onChange={(e) => handleUpdate(act, 'maxScore', Number(e.target.value))}
                          className="w-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm"
                        />
                      </div>

                      {/* Weight Input */}
                      <div className="w-full sm:col-span-2 flex sm:justify-center items-center gap-2">
                        <span className="sm:hidden text-slate-500 text-[11px] font-medium">Peso:</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          value={act.weight || 1.0}
                          onChange={(e) => handleUpdate(act, 'weight', Number(e.target.value))}
                          className="w-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm"
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="w-full sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDelete(act.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title={`Excluir atividade "${act.name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Suggestions Chips */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Sugestões rápidas de atividades (clique para preencher):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickActivitySuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setNewActName(suggestion)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-cyan-100 hover:text-cyan-800 dark:bg-slate-800 dark:hover:bg-cyan-950 dark:hover:text-cyan-300 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/60"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add New Activity Form */}
              <form onSubmit={handleAdd} className="mt-4 p-4 bg-slate-100 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-cyan-500" /> Criar Nova Atividade no {currentTabLabel}
                  </span>
                  <span className="text-[11px] text-slate-400">Preencha e adicione</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Nome da Avaliação:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Prova Escrita, Projeto Trimestral..."
                      value={newActName}
                      onChange={(e) => setNewActName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Nota Máxima:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="10"
                      value={newActMaxScore}
                      onChange={(e) => setNewActMaxScore(parseFloat(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none font-bold text-center shadow-sm"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Peso:
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={newActWeight}
                      onChange={(e) => setNewActWeight(parseFloat(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none font-medium text-center shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-add-ava-activity"
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Adicionar Atividade ao {currentTabLabel}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800"
            title="Restaurar padrão inicial do AVA"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
          </button>

          <button
            type="button"
            id="btn-save-conclude-ava"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-400" /> Concluir & Salvar
          </button>
        </div>

      </div>
    </div>
  );
};
