import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ComputedAVAResult,
  CurricularUnit,
  DeletionReport,
  Institution,
  ClassTurma,
  DailyAttendanceRecord,
  Student
} from '../types';

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]) {
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportAVAPDF(
  institution: Institution,
  uc: CurricularUnit,
  results: ComputedAVAResult[]
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFillColor(15, 23, 42); // Dark Navy Blue #0F172A
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(institution.name, 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Avaliação e Verificação da Aprendizagem(AVA) - ${uc.code} - ${uc.name.toUpperCase()}`, 14, 19);

  // Subheader Info Box
  const calcLabel = uc.gradeCalculationType === 'average' ? 'Média Aritmética' : 'Somatória das Atividades';
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text(`Docente: ${uc.teacherName} (${uc.teacherRegistration})`, 14, 29);
  doc.text(`Turma: ${uc.className} | ${uc.semester}`, 110, 29);
  doc.text(`Total de Aulas: ${uc.workloadHours}h | Cálculo: ${calcLabel} | Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 175, 29);

  // Table Columns
  const isAvg = uc.gradeCalculationType === 'average';
  const tableHeaders = [
    'RA',
    'Nome do Aluno',
    'Sit.',
    isAvg ? 'Síntese 1 (Média)' : 'Síntese 1 (Soma)',
    isAvg ? 'Síntese 2 (Média)' : 'Síntese 2 (Soma)',
    isAvg ? 'Parcial (Média)' : 'Parcial (S1+S2)',
    'Recup.',
    'Nota Final',
    'Resultado Final'
  ];

  const tableRows = results.map(r => [
    r.academicRegistration || '',
    r.studentName || '',
    r.status || 'Ativo',
    Number(r.sintese1 || 0).toFixed(1),
    Number(r.sintese2 || 0).toFixed(1),
    Number(r.notaParcial || 0).toFixed(1),
    r.recuperacao !== undefined && !isNaN(Number(r.recuperacao)) ? Number(r.recuperacao).toFixed(1) : '-',
    Number(r.notaFinal || 0).toFixed(1),
    (r.notaFinal >= (institution.minPassingGrade || 6.0)) ? 'APROVADO' : 'REPROVADO'
  ]);

  autoTable(doc, {
    startY: 34,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { cellWidth: 50 },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center', fontStyle: 'bold' },
      8: { halign: 'center' },
      9: { halign: 'center' },
      10: { halign: 'center' },
      11: { halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 2) {
          const val = data.cell.raw as string;
          data.cell.styles.fontStyle = 'bold';
          if (val === 'Ativo') {
            data.cell.styles.textColor = [16, 185, 129]; // Verde
          } else if (val === 'Trancado') {
            data.cell.styles.textColor = [217, 119, 6]; // Laranja
          } else if (val === 'Remanejado') {
            data.cell.styles.textColor = [147, 51, 234]; // Roxo
          } else if (val === 'Transferido') {
            data.cell.styles.textColor = [225, 29, 72]; // Vermelho
          }
        } else if (data.column.index === 8 || data.column.index === 11) {
          const val = data.cell.raw as string;
          if (val === 'APROVADO') {
            data.cell.styles.textColor = [16, 185, 129]; // Emerald
          } else if (val === 'REPROVADO' || (typeof val === 'string' && val.includes('REPROV'))) {
            data.cell.styles.textColor = [225, 29, 72]; // Red
          }
        }
      }
    }
  });

  // Footer Signature Lines
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  if (finalY < 180) {
    doc.setDrawColor(150, 150, 150);
    doc.line(20, finalY + 10, 100, finalY + 10);
    doc.line(180, finalY + 10, 260, finalY + 10);

    doc.setFontSize(8);
    doc.text('Assinatura do Docente', 60, finalY + 15, { align: 'center' });
    doc.text('Assinatura da Coordenação Acadêmica', 220, finalY + 15, { align: 'center' });
  }

  doc.save(`Planilha_AVA_${uc.code}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Exportação de Boletim com Suporte a Layout Selecionável:
 * - 'oficial': Layout Completo com P1, P2, parciais, recuperação, nota final, frequência e assinaturas institucionais
 * - 'sintetico': Layout Sintético / Mural com RA, Nome, Média Final, Frequência (%) e Resultado
 * - 'analitico': Layout Analítico Pedagógico detalhado com estatísticas da turma e parecer pedagógico
 */
export function exportBoletimPDF(
  institution: Institution,
  turma: ClassTurma | undefined,
  uc: CurricularUnit,
  results: ComputedAVAResult[],
  layout: 'oficial' | 'sintetico' | 'analitico' = 'oficial'
) {
  const isSintetico = layout === 'sintetico';
  const isAnalitico = layout === 'analitico';
  const doc = new jsPDF({
    orientation: isSintetico ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = isSintetico ? 210 : 297;
  const turmaName = turma ? turma.name : uc.className || 'Turma Não Especificada';
  const emissionDate = new Date().toLocaleDateString('pt-BR');

  // Top Navy Banner
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Turquoise Accent Line
  doc.setFillColor(64, 224, 208); // #40E0D0
  doc.rect(0, 24, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(institution.name.toUpperCase(), 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);

  let layoutTitle = 'BOLETIM OFICIAL DE RENDIMENTO ACADÊMICO E FREQUÊNCIA';
  if (isSintetico) layoutTitle = 'BOLETIM ESCOLAR SINTÉTICO (DIVULGAÇÃO EM MURAL)';
  if (isAnalitico) layoutTitle = 'RELATÓRIO ANALÍTICO PEDAGÓGICO DE DESEMPENHO E APROVEITAMENTO';

  doc.text(`${layoutTitle} • ${uc.code} - ${uc.name.toUpperCase()}`, 14, 18);

  // Subheader Info Card
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Turma: ${turmaName}`, 14, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(`Docente: ${uc.teacherName || 'Docente Responsável'} (${uc.teacherRegistration || 'Matrícula'})`, 85, 31);
  doc.text(`Carga Horária: ${uc.workloadHours || 80}h | Mín. Frequência: ${institution.minAttendancePercentage || 75}% | Mín. Nota: ${(institution.minPassingGrade || 6).toFixed(1)}`, isSintetico ? 14 : 170, isSintetico ? 36 : 31);
  doc.text(`Emissão: ${emissionDate}`, pageWidth - (isSintetico ? 40 : 35), isSintetico ? 36 : 31);

  // Layout-specific table headers & rows
  let tableHeaders: string[] = [];
  let tableRows: (string | number)[][] = [];

  if (isSintetico) {
    // SINTÉTICO: Focado em divulgação limpa
    tableHeaders = ['Nº', 'R.A.', 'Nome do Estudante', 'Nota Final', 'Frequência (%)', 'Situação Final'];
    tableRows = results.map((r, idx) => [
      idx + 1,
      r.academicRegistration || '-',
      r.studentName || '-',
      Number(r.notaFinal || 0).toFixed(1),
      `${r.attendancePercentage ?? 100}%`,
      r.finalAcademicStatus || (r.notaFinal >= (institution.minPassingGrade || 6) ? 'APROVADO' : 'REPROVADO')
    ]);
  } else if (isAnalitico) {
    // ANALÍTICO: Notas detalhadas, faltas em horas e parecer
    tableHeaders = [
      'R.A.',
      'Nome do Estudante',
      'Sit.',
      'P1',
      'P2',
      'Parcial',
      'Recup.',
      'Nota Final',
      'Aulas',
      'Faltas (h)',
      'Freq. (%)',
      'Parecer Pedagógico'
    ];
    tableRows = results.map(r => {
      const isApproved = (r.notaFinal || 0) >= (institution.minPassingGrade || 6);
      const isFreqOk = (r.attendancePercentage ?? 100) >= (institution.minAttendancePercentage || 75);
      let parecer = 'Aprovado por Média e Frequência';
      if (!isFreqOk) parecer = 'Reprovado por Infrequência';
      else if (!isApproved) parecer = 'Reprovado por Nota';

      return [
        r.academicRegistration || '-',
        r.studentName || '-',
        r.status || 'Ativo',
        Number(r.sintese1 || 0).toFixed(1),
        Number(r.sintese2 || 0).toFixed(1),
        Number(r.notaParcial || 0).toFixed(1),
        r.recuperacao !== undefined && !isNaN(Number(r.recuperacao)) ? Number(r.recuperacao).toFixed(1) : '-',
        Number(r.notaFinal || 0).toFixed(1),
        r.totalClasses || uc.workloadHours || 80,
        r.totalAbsences || 0,
        `${r.attendancePercentage ?? 100}%`,
        parecer
      ];
    });
  } else {
    // OFICIAL COMPLETO (Padrão)
    tableHeaders = [
      'R.A.',
      'Nome Completo do Estudante',
      'Situação',
      'Síntese 1',
      'Síntese 2',
      'Média Parcial',
      'Recup.',
      'Nota Final',
      'Freq. (%)',
      'Resultado Final'
    ];
    tableRows = results.map(r => [
      r.academicRegistration || '-',
      r.studentName || '-',
      r.status || 'Ativo',
      Number(r.sintese1 || 0).toFixed(1),
      Number(r.sintese2 || 0).toFixed(1),
      Number(r.notaParcial || 0).toFixed(1),
      r.recuperacao !== undefined && !isNaN(Number(r.recuperacao)) ? Number(r.recuperacao).toFixed(1) : '-',
      Number(r.notaFinal || 0).toFixed(1),
      `${r.attendancePercentage ?? 100}%`,
      r.finalAcademicStatus || (r.notaFinal >= (institution.minPassingGrade || 6) ? 'APROVADO' : 'REPROVADO')
    ]);
  }

  autoTable(doc, {
    startY: isSintetico ? 41 : 36,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rowContent = data.row.raw as (string | number)[];
        const lastCell = String(rowContent[rowContent.length - 1] || '');
        if (data.column.index === rowContent.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          if (lastCell.includes('APROVADO') || lastCell.includes('Aprovado')) {
            data.cell.styles.textColor = [16, 185, 129];
          } else {
            data.cell.styles.textColor = [225, 29, 72];
          }
        }
      }
    }
  });

  // Footer / Signatures
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  const maxAllowedY = isSintetico ? 260 : 185;

  if (finalY < maxAllowedY) {
    doc.setDrawColor(203, 213, 225);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    if (isSintetico) {
      doc.line(40, finalY + 12, 170, finalY + 12);
      doc.text('Carimbo e Assinatura da Secretaria Escolar / Coordenação', 105, finalY + 16, { align: 'center' });
    } else {
      doc.line(20, finalY + 10, 100, finalY + 10);
      doc.line(180, finalY + 10, 260, finalY + 10);
      doc.text('Assinatura do Docente Responsável', 60, finalY + 15, { align: 'center' });
      doc.text('Visto da Coordenação Acadêmica / Direção', 220, finalY + 15, { align: 'center' });
    }
  }

  doc.save(`Boletim_${layout}_${turmaName.replace(/\s+/g, '_')}_${uc.code}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Exportação de Diário de Classe em PDF
 */
export function exportDiarioClassePDF(
  institution: Institution,
  turma: ClassTurma | undefined,
  uc: CurricularUnit,
  records: DailyAttendanceRecord[],
  students: Student[]
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const turmaName = turma ? turma.name : uc.className || 'Turma Não Especificada';
  const totalHoursTaught = records.reduce((acc, curr) => acc + (curr.lessonCount || 1), 0);
  const totalStudents = students.length;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setFillColor(64, 224, 208);
  doc.rect(0, 24, 297, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(institution.name.toUpperCase(), 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`DIÁRIO DE CLASSE OFICIAL - REGISTRO DE AULAS MINISTRADAS • ${uc.code} - ${uc.name.toUpperCase()}`, 14, 18);

  // Subheader Info
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Turma: ${turmaName}`, 14, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(`Docente: ${uc.teacherName || 'Docente'} (${uc.teacherRegistration || 'Matrícula'})`, 80, 31);
  doc.text(`Carga Horária: ${uc.workloadHours || 80}h | Aulas Realizadas: ${totalHoursTaught}h (${records.length} chamadas) | Alunos Matriculados: ${totalStudents}`, 155, 31);

  const tableHeaders = [
    'Aula Nº',
    'Data da Aula',
    'Horas / Aulas',
    'Conteúdo Programático Ministrado',
    'Presentes',
    'Ausentes',
    '% Frequência'
  ];

  const tableRows = records.map((rec, idx) => {
    const totalInCall = Object.keys(rec.presences || {}).length || totalStudents;
    const presCount = Object.values(rec.presences || {}).filter(Boolean).length;
    const absCount = totalInCall - presCount;
    const pct = totalInCall > 0 ? Math.round((presCount / totalInCall) * 100) : 100;

    return [
      idx + 1,
      new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      `${rec.lessonCount || 1}h`,
      rec.contentTaught || 'Conteúdo ministrado conforme plano de ensino',
      presCount,
      absCount,
      `${pct}%`
    ];
  });

  autoTable(doc, {
    startY: 36,
    head: [tableHeaders],
    body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'Nenhuma aula registrada até o momento no diário', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 120 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }
    }
  });

  // Footer signatures
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY < 185) {
    doc.setDrawColor(203, 213, 225);
    doc.line(25, finalY + 10, 105, finalY + 10);
    doc.line(175, finalY + 10, 255, finalY + 10);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Assinatura do Docente', 65, finalY + 15, { align: 'center' });
    doc.text('Visto da Coordenação Acadêmica', 215, finalY + 15, { align: 'center' });
  }

  doc.save(`Diario_Classe_${turmaName.replace(/\s+/g, '_')}_${uc.code}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Exportação de Lista de Presença em PDF (Consolidada ou Folha em Branco para Sala)
 */
export function exportListaPresencaPDF(
  institution: Institution,
  turma: ClassTurma | undefined,
  uc: CurricularUnit,
  students: Student[],
  records: DailyAttendanceRecord[],
  blankMode: boolean = false
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const turmaName = turma ? turma.name : uc.className || 'Turma Não Especificada';
  const emissionDate = new Date().toLocaleDateString('pt-BR');

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setFillColor(64, 224, 208);
  doc.rect(0, 24, 297, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(institution.name.toUpperCase(), 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  const title = blankMode
    ? 'FOLHA DE CHAMADA EM SALA DE AULA (ASSINATURA MANUAL)'
    : 'LISTA DE PRESENÇA CONSOLIDADA E CONTROLE DE FREQUÊNCIA';
  doc.text(`${title} • ${uc.code} - ${uc.name.toUpperCase()}`, 14, 18);

  // Subheader
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Turma: ${turmaName}`, 14, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(`Docente: ${uc.teacherName || 'Docente'}`, 80, 31);
  doc.text(`Total Estudantes: ${students.length} | Emissão: ${emissionDate}`, 180, 31);

  let tableHeaders: string[] = [];
  let tableRows: (string | number)[][] = [];

  if (blankMode) {
    // Modo Folha em Branco: colunas de datas vazias para o aluno assinar
    tableHeaders = [
      'Nº',
      'R.A.',
      'Nome Completo do Estudante',
      'Situação',
      'Data: ___/___',
      'Data: ___/___',
      'Data: ___/___',
      'Data: ___/___',
      'Rubrica / Observação'
    ];
    tableRows = students.map((s, idx) => [
      idx + 1,
      s.academicRegistration || '-',
      s.fullName || '-',
      s.status || 'Ativo',
      '',
      '',
      '',
      '',
      ''
    ]);
  } else {
    // Modo Consolidado: presenças calculadas
    const totalLessons = records.reduce((acc, curr) => acc + (curr.lessonCount || 1), 0);
    const minReq = institution.minAttendancePercentage || 75;

    tableHeaders = [
      'Nº',
      'R.A.',
      'Nome Completo do Estudante',
      'Situação',
      'Aulas Totais',
      'Presenças (h)',
      'Faltas (h)',
      '% Frequência',
      'Situação da Frequência'
    ];

    tableRows = students.map((s, idx) => {
      let presences = 0;
      let absences = 0;
      records.forEach(rec => {
        const isPresent = rec.presences?.[s.id] ?? true;
        const count = rec.lessonCount || 1;
        if (isPresent) presences += count;
        else absences += count;
      });

      const totalH = presences + absences;
      const pct = totalH > 0 ? Math.round((presences / totalH) * 100) : 100;
      const situacao = pct >= minReq ? 'Regular' : pct >= minReq - 5 ? 'Em Alerta' : 'Reprovado por Falta';

      return [
        idx + 1,
        s.academicRegistration || '-',
        s.fullName || '-',
        s.status || 'Ativo',
        `${totalLessons}h`,
        `${presences}h`,
        `${absences}h`,
        `${pct}%`,
        situacao
      ];
    });
  }

  autoTable(doc, {
    startY: 36,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: blankMode ? 75 : 65 },
      3: { cellWidth: 22, halign: 'center' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY < 185) {
    doc.setDrawColor(203, 213, 225);
    doc.line(25, finalY + 10, 105, finalY + 10);
    doc.line(175, finalY + 10, 255, finalY + 10);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Assinatura do Docente', 65, finalY + 15, { align: 'center' });
    doc.text('Visto da Coordenação Acadêmica', 215, finalY + 15, { align: 'center' });
  }

  const prefix = blankMode ? 'Folha_Chamada_Sala' : 'Lista_Presenca';
  doc.save(`${prefix}_${turmaName.replace(/\s+/g, '_')}_${uc.code}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Exportação de Relatório de Faltas e Infrequência em PDF
 */
export function exportRelatorioFaltasPDF(
  institution: Institution,
  turma: ClassTurma | undefined,
  uc: CurricularUnit,
  students: Student[],
  records: DailyAttendanceRecord[],
  minAttendancePercentage: number = 75
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const turmaName = turma ? turma.name : uc.className || 'Turma Não Especificada';
  const workload = uc.workloadHours || 80;
  const maxAllowedAbsences = Math.floor(workload * ((100 - minAttendancePercentage) / 100));
  const totalLessons = records.reduce((acc, curr) => acc + (curr.lessonCount || 1), 0);

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setFillColor(225, 29, 72); // Rose line for absence alert
  doc.rect(0, 24, 297, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(institution.name.toUpperCase(), 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`RELATÓRIO OFICIAL DE CONTROLE DE FALTAS & INFREQUÊNCIA • ${uc.code} - ${uc.name.toUpperCase()}`, 14, 18);

  // Subheader
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Turma: ${turmaName}`, 14, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(`Docente: ${uc.teacherName || 'Docente'}`, 80, 31);
  doc.text(`Carga Horária: ${workload}h | Limite Máx. Faltas (${100 - minAttendancePercentage}%): ${maxAllowedAbsences}h | Aulas Dadas: ${totalLessons}h`, 140, 31);

  const tableHeaders = [
    'R.A.',
    'Nome Completo do Estudante',
    'Situação',
    'Aulas Dadas',
    'Presenças (h)',
    'Faltas (h)',
    'Limite Máx.',
    'Faltas Restantes',
    '% Frequência',
    'Status de Assiduidade'
  ];

  const tableRows = students.map(s => {
    let presences = 0;
    let absences = 0;
    records.forEach(rec => {
      const isPresent = rec.presences?.[s.id] ?? true;
      const count = rec.lessonCount || 1;
      if (isPresent) presences += count;
      else absences += count;
    });

    const totalH = presences + absences;
    const pct = totalH > 0 ? Math.round((presences / totalH) * 100) : 100;
    const remainingAbsences = Math.max(0, maxAllowedAbsences - absences);
    const isReprovado = absences > maxAllowedAbsences || pct < minAttendancePercentage;
    const isAlerta = !isReprovado && (remainingAbsences <= 4 || pct < minAttendancePercentage + 5);

    let statusLabel = 'Frequência Regular';
    if (isReprovado) statusLabel = 'REPROVADO POR INFREQUÊNCIA';
    else if (isAlerta) statusLabel = 'EM RISCO / ALERTA';

    return [
      s.academicRegistration || '-',
      s.fullName || '-',
      s.status || 'Ativo',
      `${totalLessons}h`,
      `${presences}h`,
      `${absences}h`,
      `${maxAllowedAbsences}h`,
      `${remainingAbsences}h`,
      `${pct}%`,
      statusLabel
    ];
  });

  autoTable(doc, {
    startY: 36,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 24, halign: 'center' },
      8: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 34, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rowContent = data.row.raw as (string | number)[];
        const lastCell = String(rowContent[9] || '');
        if (data.column.index === 9) {
          if (lastCell.includes('REPROVADO')) {
            data.cell.styles.textColor = [225, 29, 72];
          } else if (lastCell.includes('RISCO') || lastCell.includes('ALERTA')) {
            data.cell.styles.textColor = [217, 119, 6];
          } else {
            data.cell.styles.textColor = [16, 185, 129];
          }
        }
      }
    }
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY < 185) {
    doc.setDrawColor(203, 213, 225);
    doc.line(25, finalY + 10, 105, finalY + 10);
    doc.line(175, finalY + 10, 255, finalY + 10);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Assinatura do Docente Responsável', 65, finalY + 15, { align: 'center' });
    doc.text('Parecer da Coordenação / Serviço Pedagógico', 215, finalY + 15, { align: 'center' });
  }

  doc.save(`Relatorio_Faltas_${turmaName.replace(/\s+/g, '_')}_${uc.code}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportDeletionReportPDF(
  institution: Institution,
  report: DeletionReport
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Navy Top Header Bar
  doc.setFillColor(15, 23, 42); // Dark Navy Blue #0F172A
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(institution.name.toUpperCase(), 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('LAUDO E COMPROVANTE OFICIAL DE EXCLUSÃO DE HISTÓRICO DE AUDITORIA', 14, 19);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('DOCUMENTO REGISTRADO E INVIOLÁVEL NO SISTEMA AVA+ PRESENÇA', 14, 24);

  // Red Warning Stripe
  doc.setFillColor(225, 29, 72); // Rose 600
  doc.rect(0, 28, 210, 3, 'F');

  // Section 1: User & Deletion Info Box
  let y = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. DADOS DO USUÁRIO RESPONSÁVEL PELA EXCLUSÃO', 14, y);

  y += 5;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, y, 182, 38, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const deleteDate = new Date(report.deletedAt).toLocaleString('pt-BR');

  doc.setFont('helvetica', 'bold'); doc.text('Nome do Responsável:', 18, y + 7);
  doc.setFont('helvetica', 'normal'); doc.text(report.user.name, 56, y + 7);

  doc.setFont('helvetica', 'bold'); doc.text('Cargo / Função:', 18, y + 13);
  doc.setFont('helvetica', 'normal'); doc.text(report.user.role.toUpperCase(), 56, y + 13);

  doc.setFont('helvetica', 'bold'); doc.text('E-mail / Login:', 18, y + 19);
  doc.setFont('helvetica', 'normal'); doc.text(report.user.email, 56, y + 19);

  doc.setFont('helvetica', 'bold'); doc.text('Matrícula / Registro:', 18, y + 25);
  doc.setFont('helvetica', 'normal'); doc.text(report.user.registration || 'N/A', 56, y + 25);

  doc.setFont('helvetica', 'bold'); doc.text('Data e Hora Exata:', 18, y + 31);
  doc.setFont('helvetica', 'normal'); doc.text(deleteDate, 56, y + 31);

  doc.setFont('helvetica', 'bold'); doc.text('Tipo de Operação:', 110, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    report.targetType === 'all'
      ? 'LIMPEZA COMPLETA DO HISTÓRICO'
      : report.targetType === 'selected'
      ? 'EXCLUSÃO EM LOTE DE REGISTROS'
      : 'EXCLUSÃO INDIVIDUAL DE REGISTRO',
    145, y + 7
  );

  doc.setFont('helvetica', 'bold'); doc.text('Qtd. Registros Removidos:', 110, y + 13);
  doc.setFont('helvetica', 'normal'); doc.text(`${report.totalLogsDeleted} registro(s)`, 155, y + 13);

  doc.setFont('helvetica', 'bold'); doc.text('ID do Comprovante:', 110, y + 19);
  doc.setFont('helvetica', 'normal'); doc.text(report.id, 145, y + 19);

  // Section 2: Deleted Snapshot Logs Table
  y += 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. AUDITORIA DOS REGISTROS QUE FORAM ELIMINADOS', 14, y);

  const tableHeaders = ['Data/Hora', 'Usuário', 'Perfil', 'Ação Realizada', 'Detalhes Ocorridos'];

  const tableRows = report.logsSnapshot.map(log => [
    new Date(log.timestamp).toLocaleString('pt-BR'),
    log.userName,
    log.userRole,
    log.action,
    log.details
  ]);

  autoTable(doc, {
    startY: y + 4,
    head: [tableHeaders],
    body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'Nenhum snapshot de log individual registrado', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 30 },
      2: { cellWidth: 20 },
      3: { cellWidth: 35, fontStyle: 'bold' },
      4: { cellWidth: 55 }
    }
  });

  // Footer & Declarations
  const finalY = (doc as any).lastAutoTable.finalY + 12;

  if (finalY < 260) {
    doc.setDrawColor(203, 213, 225);
    doc.line(14, finalY, 196, finalY);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Este relatório é gerado automaticamente pelo sistema AVA+ Presença e armazenado de forma permanente e inviolável.',
      14,
      finalY + 6
    );
    doc.text(
      `Autenticado digitalmente por ${report.user.name} (${report.user.email}) em ${deleteDate}.`,
      14,
      finalY + 11
    );

    doc.setDrawColor(148, 163, 184);
    doc.line(60, finalY + 28, 150, finalY + 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(report.user.name, 105, finalY + 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Usuário Autenticador (${report.user.role.toUpperCase()})`, 105, finalY + 36, { align: 'center' });
  }

  doc.save(`Laudo_Exclusao_Audit_${report.id}_${new Date(report.deletedAt).toISOString().slice(0, 10)}.pdf`);
}
