import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  CalendarCheck2,
  BookOpen,
  GraduationCap,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { getStatusBadgeStyle } from '../../utils/avaCalculations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const StudentBoletim: React.FC = () => {
  const {
    currentUser,
    students,
    curricularUnits,
    computedResults,
    institution,
    selectedUC
  } = useApp();

  // Find student entity matching logged user or default to first student for demo
  const currentStudent = students.find(s => s && (s.id === currentUser.id || s.academicRegistration === currentUser.registration)) || students[0];

  if (!currentStudent) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <GraduationCap className="w-12 h-12 mx-auto text-slate-400 mb-2" />
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">Nenhum estudante encontrado.</p>
        <p className="text-xs text-slate-500 mt-1">Cadastre alunos na aba de Gestão de Estudantes para visualizar o boletim.</p>
      </div>
    );
  }

  // Find result for current selected UC
  const currentResult = computedResults.find(r => r.studentId === currentStudent.id);

  const handleExportIndividualBoletimPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header Navy Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(institution.name, 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('BOLETIM ACADÊMICO DE NOTAS AVA E FREQUÊNCIA DE ENSINO', 14, 22);

    // Student Info Block
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.text(`Estudante: ${currentStudent.fullName}`, 14, 38);
    doc.text(`RA: ${currentStudent.academicRegistration}`, 120, 38);
    doc.text(`Curso: ${currentStudent.courseName}`, 14, 44);
    doc.text(`Turma / Período: ${currentStudent.className} (${currentStudent.period})`, 120, 44);
    doc.text(`Situação Acadêmica: ${currentStudent.status}`, 14, 50);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 54, 196, 54);

    // Table of Disciplines
    const headers = ['UC / Disciplina', 'Síntese 1', 'Síntese 2', 'Parcial', 'Recup.', 'Final', 'Freq. %', 'Situação'];
    const rows = computedResults
      .filter(r => r && currentStudent && r.studentId === currentStudent.id)
      .map(r => [
        selectedUC?.name || 'Unidade Curricular',
        Number(r.sintese1 || 0).toFixed(1),
        Number(r.sintese2 || 0).toFixed(1),
        Number(r.notaParcial || 0).toFixed(1),
        r.recuperacao !== undefined && !isNaN(Number(r.recuperacao)) ? Number(r.recuperacao).toFixed(1) : '-',
        Number(r.notaFinal || 0).toFixed(1),
        `${Number(r.attendancePercentage || 0).toFixed(1)}%`,
        r.finalAcademicStatus || 'EM ANDAMENTO'
      ]);

    autoTable(doc, {
      startY: 58,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 }
    });

    // Date & Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.text(`Documento emitido em ${new Date().toLocaleDateString('pt-BR')} via Plataforma AVA+ Presença.`, 14, finalY);

    doc.save(`Boletim_${currentStudent.academicRegistration}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Student Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={currentStudent.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'}
              alt={currentStudent.fullName}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-cyan-500/30"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  PORTAL DO ESTUDANTE
                </span>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${getStatusBadgeStyle(currentStudent.status)}`}>
                  {currentStudent.status}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {currentStudent.fullName}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                <strong>RA:</strong> {currentStudent.academicRegistration} | <strong>Curso:</strong> {currentStudent.courseName} | <strong>Turma:</strong> {currentStudent.className}
              </p>
            </div>
          </div>

          <button
            onClick={handleExportIndividualBoletimPDF}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0"
          >
            <FileText className="w-4 h-4" /> Baixar Boletim em PDF
          </button>
        </div>
      </div>

      {/* Main Card with Grades and Attendance */}
      {currentResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AVA Grades Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                  {selectedUC?.code}
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {selectedUC?.name}
                </h2>
              </div>
              
              {currentResult.finalAcademicStatus === 'APROVADO' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 text-xs font-extrabold">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" /> APROVADO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 text-xs font-extrabold">
                  <XCircle className="w-4 h-4 text-rose-600" /> {currentResult.finalAcademicStatus}
                </span>
              )}
            </div>

            {/* Syntheses Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl">
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">Síntese 1 (P1)</span>
                <p className="text-xl font-extrabold text-amber-900 dark:text-amber-100 mt-1">
                  {currentResult.sintese1.toFixed(1)}
                </p>
              </div>

              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/60 rounded-xl">
                <span className="text-[11px] font-semibold text-cyan-800 dark:text-cyan-300 block">Síntese 2 (P2)</span>
                <p className="text-xl font-extrabold text-cyan-900 dark:text-cyan-100 mt-1">
                  {currentResult.sintese2.toFixed(1)}
                </p>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded-xl">
                <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300 block">Nota Parcial</span>
                <p className="text-xl font-extrabold text-purple-900 dark:text-purple-100 mt-1">
                  {currentResult.notaParcial.toFixed(1)}
                </p>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">Recuperação</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {currentResult.recuperacao !== undefined ? currentResult.recuperacao.toFixed(1) : '-'}
                </p>
              </div>
            </div>

            {/* Final Big Grade Highlight */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Nota Final Calculada:</span>
                <p className="text-3xl font-black text-cyan-400 mt-0.5">{currentResult.notaFinal.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ 10</span></p>
              </div>
              <div className="text-right text-xs text-slate-300">
                <p>Critério Mínimo: <strong>{institution.minPassingGrade.toFixed(1)}</strong></p>
                <p className="text-[11px] text-slate-400 mt-0.5">Média calculada pelas regras da instituição</p>
              </div>
            </div>

          </div>

          {/* Attendance Breakdown Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <CalendarCheck2 className="w-4 h-4 text-emerald-500" />
                Minha Frequência e Ausências
              </h2>

              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-xs p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-500 font-medium">Aulas Ministradas:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{currentResult.totalClasses} Aulas</span>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Presenças Confirmadas:</span>
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300">{currentResult.totalPresences} Aulas</span>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl">
                  <span className="text-rose-700 dark:text-rose-400 font-medium">Total de Faltas:</span>
                  <span className="font-extrabold text-rose-800 dark:text-rose-300">{currentResult.totalAbsences} Faltas</span>
                </div>
              </div>
            </div>

            {/* Attendance Percentage Badge */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/80 text-emerald-300 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-emerald-400 block uppercase tracking-wider">Percentual de Frequência:</span>
              <p className="text-3xl font-black text-emerald-400 mt-1">{currentResult.attendancePercentage}%</p>
              <p className="text-[10px] text-emerald-500 mt-1">Frequência mínima exigida: {institution.minAttendancePercentage}%</p>
            </div>
          </div>

        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-2" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">Nenhum registro encontrado para este estudante na UC selecionada.</p>
        </div>
      )}

    </div>
  );
};
