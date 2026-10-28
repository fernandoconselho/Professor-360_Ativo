import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  CalendarCheck2,
  AlertTriangle,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  School,
  Building2,
  PlusCircle,
  BookOpenCheck,
  UserPlus,
  Layers,
  ChevronDown,
  UserCheck,
  Edit3,
  GraduationCap,
  Table
} from 'lucide-react';
import { ProfessorProfileCard } from './ProfessorProfileCard';
import { ProfessorProfileModal } from './ProfessorProfileModal';

interface ProfessorDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const ProfessorDashboard: React.FC<ProfessorDashboardProps> = ({ setActiveTab }) => {
  const {
    currentUser,
    curricularUnits,
    selectedUC,
    setSelectedUCId,
    computedResults,
    courses,
    classes,
    students,
    institution,
    institutions
  } = useApp();

  const [showProfileModal, setShowProfileModal] = useState(false);

  const myUCs = curricularUnits.filter(
    u => u.teacherId === currentUser.id ||
      currentUser.curricularUnitIds?.includes(u.id) ||
      (currentUser.classIds && (currentUser.classIds.includes(u.classId) || u.additionalClassIds?.some(cid => currentUser.classIds?.includes(cid)))) ||
      (u.teacherName && currentUser.name && u.teacherName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]))
  );

  const recoveryStudents = computedResults.filter(r => r.recuperacao !== undefined || r.notaParcial < 6.0);
  const lowAttendanceStudents = computedResults.filter(r => r.attendancePercentage < 75);

  return (
    <div className="space-y-4">
      {/* Professor Profile & Personal Data Card */}
      <ProfessorProfileCard
        onOpenEditModal={() => setShowProfileModal(true)}
        onNavigate={setActiveTab}
      />

      {/* Quick Management Cards (Compact & Elegant) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Meus Dados Pessoais */}
        <div
          onClick={() => setShowProfileModal(true)}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm hover:border-[#40E0D0] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-105 transition-transform">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 font-mono">
                {currentUser.registration || 'DOC-01'}
              </span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#002B5B] dark:group-hover:text-[#40E0D0] transition-colors leading-snug">
              Dados do Docente
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              Perfil, contato, foto e Lattes.
            </p>
          </div>
          <div className="mt-2.5 flex items-center text-[11px] font-bold text-amber-600 dark:text-amber-400 gap-1">
            <span>Editar</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Cadastrar Turmas */}
        <div
          onClick={() => setActiveTab('cursos')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm hover:border-[#40E0D0] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-105 transition-transform">
                <School className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                {classes.length} turmas
              </span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#002B5B] dark:group-hover:text-[#40E0D0] transition-colors leading-snug">
              Gestão de Turmas
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              Turmas letivas, períodos e turnos.
            </p>
          </div>
          <div className="mt-2.5 flex items-center text-[11px] font-bold text-[#002B5B] dark:text-[#40E0D0] gap-1">
            <span>Gerenciar</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Cadastrar Cursos */}
        <div
          onClick={() => setActiveTab('cursos')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm hover:border-[#40E0D0] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                <BookOpenCheck className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                {courses.length} cursos
              </span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#002B5B] dark:group-hover:text-[#40E0D0] transition-colors leading-snug">
              Gestão de Cursos
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              Matrizes curriculares e habilitações.
            </p>
          </div>
          <div className="mt-2.5 flex items-center text-[11px] font-bold text-[#002B5B] dark:text-[#40E0D0] gap-1">
            <span>Gerenciar</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Cadastrar Alunos */}
        <div
          onClick={() => setActiveTab('alunos')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm hover:border-[#40E0D0] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 rounded-lg group-hover:scale-105 transition-transform">
                <UserPlus className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-1.5 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
                {students.length} alunos
              </span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#002B5B] dark:group-hover:text-[#40E0D0] transition-colors leading-snug">
              Gestão de Alunos
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              Estudantes, fotos e matrículas.
            </p>
          </div>
          <div className="mt-2.5 flex items-center text-[11px] font-bold text-[#002B5B] dark:text-[#40E0D0] gap-1">
            <span>Gerenciar</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Planilha AVA (Notas) */}
        <div
          onClick={() => setActiveTab('ava-planilha')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm hover:border-[#40E0D0] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
                <Table className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Notas
              </span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#002B5B] dark:group-hover:text-[#40E0D0] transition-colors leading-snug">
              Planilha AVA
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              Lançamentos de notas AVA e sínteses.
            </p>
          </div>
          <div className="mt-2.5 flex items-center text-[11px] font-bold text-[#002B5B] dark:text-[#40E0D0] gap-1">
            <span>Acessar</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Registro de Presença */}
        <div
          onClick={() => setActiveTab('frequencia')}
          className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm hover:border-[#40E0D0] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-lg group-hover:scale-105 transition-transform">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Chamada
              </span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#002B5B] dark:group-hover:text-[#40E0D0] transition-colors leading-snug">
              Registro de Presença
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              Lançamento diário de faltas e presenças.
            </p>
          </div>
          <div className="mt-2.5 flex items-center text-[11px] font-bold text-[#002B5B] dark:text-[#40E0D0] gap-1">
            <span>Acessar</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

      </div>

      {/* Profile Edit Modal */}
      <ProfessorProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* My Curricular Units Grid / Turmas Cadastradas (Compact) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <School className="w-3.5 h-3.5 text-cyan-500" />
            Minhas Turmas Cadastradas ({myUCs.length})
          </h2>
          <button
            onClick={() => setActiveTab('ucs')}
            className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            Ver Todas as UCs <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {myUCs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <School className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhuma turma ou disciplina cadastrada</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Cadastre turmas e cursos no menu lateral para iniciar os lançamentos pedagógicos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myUCs.map(uc => {
              const isSelected = selectedUC?.id === uc.id;
              return (
                <div
                  key={uc.id}
                  onClick={() => {
                    setSelectedUCId(uc.id);
                    setActiveTab('painel-turma');
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-50/80 border-cyan-500 dark:bg-cyan-950/40 dark:border-cyan-700 ring-2 ring-cyan-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-cyan-400 hover:shadow-xs'
                  }`}
                  title="Clique para abrir o Painel Individual desta turma com Planilha AVA e Presença"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">
                      {uc.code}
                    </span>
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded">
                      {uc.shift}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {uc.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Turma: <strong className="text-slate-700 dark:text-slate-300">{uc.className}</strong>
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                    <span>{isSelected ? 'Abrir Painel desta Turma' : 'Acessar Turma'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Risk & Recovery Alerts (Compact) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Low Attendance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Alunos com Frequência &lt; 75% ({lowAttendanceStudents.length})
            </h3>
          </div>

          <div className="space-y-1.5">
            {lowAttendanceStudents.length === 0 ? (
              <p className="p-3 text-xs text-slate-500 text-center bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                Nenhum aluno em situação de risco por faltas nesta UC.
              </p>
            ) : (
              lowAttendanceStudents.map(s => (
                <div key={s.studentId} className="p-2.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{s.studentName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">RA: {s.academicRegistration}</p>
                  </div>
                  <span className="font-extrabold text-[11px] text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-rose-200">
                    {s.attendancePercentage}% Freq.
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recovery / Low Grades */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Alunos na Recuperação / Média Baixa ({recoveryStudents.length})
            </h3>
          </div>

          <div className="space-y-1.5">
            {recoveryStudents.length === 0 ? (
              <p className="p-3 text-xs text-slate-500 text-center bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                Todos os alunos atingiram a nota mínima de aprovação!
              </p>
            ) : (
              recoveryStudents.map(s => (
                <div key={s.studentId} className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{s.studentName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">RA: {s.academicRegistration}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-amber-700 dark:text-amber-300 block">
                      Parcial: {s.notaParcial.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Recup: {s.recuperacao !== undefined ? s.recuperacao.toFixed(1) : 'Não realizada'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
