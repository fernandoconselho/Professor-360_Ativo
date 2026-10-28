import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  User as UserIcon,
  Mail,
  Phone,
  CreditCard,
  Building2,
  GraduationCap,
  Award,
  Edit3,
  ExternalLink,
  Clock,
  FileText,
  ShieldCheck,
  School,
  Sparkles,
  Users,
  CheckCircle2
} from 'lucide-react';

interface ProfessorProfileCardProps {
  onOpenEditModal: () => void;
  onNavigate?: (tab: string) => void;
}

export const ProfessorProfileCard: React.FC<ProfessorProfileCardProps> = ({
  onOpenEditModal,
  onNavigate
}) => {
  const { currentUser, institution, curricularUnits, classes, students } = useApp();

  const myUCs = curricularUnits.filter(
    u => u.teacherId === currentUser.id ||
      currentUser.curricularUnitIds?.includes(u.id) ||
      (currentUser.classIds && (currentUser.classIds.includes(u.classId) || u.additionalClassIds?.some(cid => currentUser.classIds?.includes(cid)))) ||
      (u.teacherName && currentUser.name && u.teacherName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]))
  );

  const instPrimary = institution?.primaryColor || '#002B5B';
  const instSecondary = institution?.secondaryColor || '#40E0D0';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-4.5 shadow-sm relative overflow-hidden transition-all">
      
      {/* Decorative top accent line with institution palette */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${instPrimary} 0%, ${instSecondary} 100%)`
        }}
      />

      {/* Card Header with Avatar, Details and Edit Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
        
        {/* Avatar and Basic Identification */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 shadow-xs"
                style={{ borderColor: instSecondary }}
              />
            ) : (
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-lg font-black border-2 shadow-xs"
                style={{
                  backgroundColor: `${instSecondary}20`,
                  color: instPrimary,
                  borderColor: instSecondary
                }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 p-0.5 rounded-full text-slate-900 shadow-xs"
              style={{ backgroundColor: instSecondary }}
              title="Docente Cadastrado e Autenticado"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${instSecondary}20`,
                  color: instSecondary,
                  border: `1px solid ${instSecondary}40`
                }}
              >
                {currentUser.title || 'Docente'} • {currentUser.titulation || 'Doutorado'}
              </span>

              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono font-bold border border-slate-200 dark:border-slate-700">
                Matrícula: {currentUser.registration || 'DOC-2024'}
              </span>

              <span className="text-[9px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5 text-blue-500" />
                Unidade: {institution.name}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
              {currentUser.name}
            </h2>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
              {currentUser.department || 'Corpo Docente Titular'}
            </p>
          </div>
        </div>

        {/* Action Buttons: Edit Personal Data & Lattes */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {currentUser.lattesUrl && (
            <a
              href={currentUser.lattesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 px-2.5 py-1.5 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg border border-cyan-200 dark:border-cyan-800/60"
            >
              <span>Lattes</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <button
            type="button"
            onClick={onOpenEditModal}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 cursor-pointer"
            title="Visualizar e editar dados pessoais e institucionais"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-500" />
            <span>Editar Meus Dados</span>
          </button>
        </div>

      </div>

      {/* Personal & Academic Data Grid (Compact) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 py-3 border-b border-slate-100 dark:border-slate-800 text-xs">
        
        {/* Email */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              E-mail Institucional
            </span>
            <p className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate">
              {currentUser.email || 'Não informado'}
            </p>
          </div>
        </div>

        {/* Telefone / Celular */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Telefone / WhatsApp
            </span>
            <p className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate">
              {currentUser.phone || '(Não cadastrado)'}
            </p>
          </div>
        </div>

        {/* CPF */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              CPF do Docente
            </span>
            <p className="font-mono font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate">
              {currentUser.cpf ? currentUser.cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '$1.***.***-$4') : '---'}
            </p>
          </div>
        </div>

        {/* Atendimento / Plantão */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Plantão de Dúvidas
            </span>
            <p className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate" title={currentUser.officeHours}>
              {currentUser.officeHours || 'A combinar'}
            </p>
          </div>
        </div>

      </div>

      {/* Mini-Biography & Pedagogical Statement (Compact) */}
      {currentUser.bio && (
        <div className="pt-2.5 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <FileText className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
          <p className="leading-snug italic line-clamp-2">
            "{currentUser.bio}"
          </p>
        </div>
      )}

    </div>
  );
};
