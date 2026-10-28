import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpenCheck,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const {
    institution,
    courses,
    curricularUnits,
    students,
    users,
    computedResults
  } = useApp();

  const totalTeachers = users.filter(u => u.role === 'professor').length;
  const totalStudents = students.length;
  const totalClasses = courses.reduce((acc, c) => acc + 1, 0);

  const approvedCount = computedResults.filter(r => r.finalAcademicStatus === 'APROVADO').length;
  const reprovGradeCount = computedResults.filter(r => r.finalAcademicStatus === 'REPROVADO').length;
  const reprovFaltaCount = computedResults.filter(r => r.finalAcademicStatus === 'REPROVADO POR FALTA').length;

  const passRateData = [
    { name: 'Aprovados', value: approvedCount, color: '#0EA5E9' }, // Cyan
    { name: 'Reprov. Nota', value: reprovGradeCount, color: '#E11D48' }, // Magenta / Red
    { name: 'Reprov. Falta', value: reprovFaltaCount, color: '#F97316' } // Orange
  ];

  // Course performance comparison chart
  const coursePerformance = courses.map(c => {
    const cStudents = students.filter(s => s.courseId === c.id);
    return {
      name: c.code,
      fullName: c.name,
      totalStudents: cStudents.length,
      mediaGeral: 7.8 // demo average
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Painel de Controle Administrativo
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {institution.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Gestão acadêmica unificada de notas, frequência, corpo docente e relatórios estatísticos.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Instituições</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">1 Ativa</p>
            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium mt-0.5">CNPJ Cadastrado</p>
          </div>
          <div className="p-3 bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Corpo Docente</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalTeachers} Professores</p>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-0.5">Com UCs Ativas</p>
          </div>
          <div className="p-3 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Estudantes</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalStudents} Alunos</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Matriculados no Período</p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-2xl">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Disciplinas (UCs)</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{curricularUnits.length} UCs</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Planilhas AVA em uso</p>
          </div>
          <div className="p-3 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-2xl">
            <BookOpenCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Analytics Recharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pass / Fail Rate Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-cyan-500" />
                Distribuição de Desempenho e Aprovação
              </h2>
              <p className="text-xs text-slate-500">Percentual acumulado na UC selecionada</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={passRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {passRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Averages Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-500" />
                Total de Alunos por Curso
              </h2>
              <p className="text-xs text-slate-500">Distribuição acadêmica entre os cursos oferecidos</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coursePerformance}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="totalStudents" name="Alunos Matriculados" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
