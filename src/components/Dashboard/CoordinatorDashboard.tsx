import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  Building2,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  BookOpen,
  CalendarCheck2,
  TrendingUp,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface CoordinatorDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({ setActiveTab }) => {
  const {
    currentUser,
    institution,
    courses,
    curricularUnits,
    students,
    computedResults
  } = useApp();

  const totalStudents = students.length;
  const approvedCount = computedResults.filter(r => r.finalAcademicStatus === 'APROVADO').length;
  const riskCount = computedResults.filter(r => r.attendanceStatus === 'Em Risco' || r.attendancePercentage < 75).length;
  const recoveryCount = computedResults.filter(r => r.notaParcial < 6.0).length;

  const getRoleHeaderInfo = () => {
    if (currentUser.role === 'orientador') {
      return {
        badge: 'ORIENTAÇÃO EDUCACIONAL E PEDAGÓGICA',
        icon: <Compass className="w-3.5 h-3.5" />,
        badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        title: 'Acompanhamento Pedagógico & Desempenho dos Alunos',
        description: 'Visão consolidada do rendimento escolar, alertas de frequência, suporte pedagógico e engajamento dos estudantes.'
      };
    }
    if (currentUser.role === 'supervisor') {
      return {
        badge: 'SUPERVISÃO EDUCACIONAL E CURRICULAR',
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
        badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
        title: 'Supervisão de Turmas & Validação Curricular',
        description: 'Monitoramento da conformidade acadêmica, lançamentos de notas, frequência regulamentar e auditoria das UCs.'
      };
    }
    return {
      badge: 'COORDENAÇÃO ACADÊMICA GERAL',
      icon: <UserCheck className="w-3.5 h-3.5" />,
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      title: 'Acompanhamento de Turmas & Aprovação de Lançamentos',
      description: 'Visão consolidada das turmas, relatórios de frequência, taxas de aprovação e validação institucional.'
    };
  };

  const headerInfo = getRoleHeaderInfo();

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`border text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${headerInfo.badgeClass}`}>
                {headerInfo.icon} {headerInfo.badge}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {headerInfo.title}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              {headerInfo.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('relatorios')}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" /> Relatórios Acadêmicos Completos
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total de Turmas</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{courses.length} Turmas</p>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-0.5">Em acompanhamento</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Aprovação Global</span>
          <p className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">
            {totalStudents > 0 ? ((approvedCount / totalStudents) * 100).toFixed(0) : 0}%
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{approvedCount} de {totalStudents} alunos</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Frequência em Risco</span>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{riskCount} Alunos</p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Abaixo do mínimo (75%)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Em Recuperação</span>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{recoveryCount} Alunos</p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">Média parcial &lt; 6.0</p>
        </div>
      </div>

      {/* Disciplines Approval & Monitor Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-500" />
          Status de Lançamentos de Notas por Disciplina (UC)
        </h2>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {curricularUnits.map(uc => (
            <div key={uc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-xs text-purple-600 dark:text-purple-400 font-mono">{uc.code}</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{uc.name}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Docente: <strong>{uc.teacherName}</strong> | Turma: {uc.className} ({uc.semester})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lançamentos em Dia
                </span>
                <button
                  onClick={() => setActiveTab('ava-planilha')}
                  className="px-3 py-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-colors border border-cyan-300 dark:border-cyan-800"
                >
                  Auditar Planilha AVA
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
