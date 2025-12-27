import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storageService } from './storageService';
import { Transaction, Account, User } from '../types';
import { logger } from './loggerService';

export const reportService = {
  async generateFinancialReport() {
    try {
      logger.info('report', 'Starting PDF generation...');
      
      // 1. Gather Data
      const [user, transactions, accounts] = await Promise.all([
        storageService.getUser(),
        storageService.getTransactions(),
        storageService.getAccounts()
      ]);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

      // --- HEADER ---
      // Logo (Placeholder text)
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229); // Indigo 600
      doc.text('QUANTA', 14, 20);
      
      // Title
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.text('ESTADO DE SITUACIÓN FINANCIERA', pageWidth - 14, 20, { align: 'right' });
      
      // Subheader
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generado para: ${user?.displayName || 'Usuario'}`, pageWidth - 14, 28, { align: 'right' });
      doc.text(`Fecha: ${today}`, pageWidth - 14, 33, { align: 'right' });
      
      doc.setDrawColor(200);
      doc.line(14, 38, pageWidth - 14, 38);

      // --- 1. EXECUTIVE SUMMARY ---
      let yPos = 50;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('1. RESUMEN EJECUTIVO', 14, yPos);
      
      // Calculate Totals
      const totalAssets = accounts.reduce((sum, a) => sum + (a.isExcludedFromTotal ? 0 : a.balance), 0);
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netSavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

      // Summary Table
      autoTable(doc, {
        startY: yPos + 5,
        head: [['CONCEPTO', 'MONTO (RD$)']],
        body: [
          ['Activos Totales (Cuentas)', formatCurrency(totalAssets)],
          ['Ingresos Totales (Histórico)', formatCurrency(totalIncome)],
          ['Gastos Totales (Histórico)', formatCurrency(totalExpenses)],
          ['Ahorro Neto', formatCurrency(netSavings)],
          ['Tasa de Ahorro', `${savingsRate.toFixed(2)}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      });

      // --- 2. ASSETS BREAKDOWN (Balance Sheet) ---
      yPos = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.text('2. DESGLOSE DE ACTIVOS (Cuentas)', 14, yPos);

      const accountRows = accounts.map(a => [
        a.institution || a.type.toUpperCase(),
        a.name,
        a.type,
        formatCurrency(a.balance)
      ]);

      autoTable(doc, {
        startY: yPos + 5,
        head: [['INSTITUCIÓN', 'NOMBRE', 'TIPO', 'BALANCE']],
        body: accountRows,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85] }, // Slate 700
        columnStyles: { 3: { halign: 'right' } },
      });

      // --- 3. RECENT TRANSACTIONS (Statement of Activities) ---
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Check page break
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.text('3. ACTIVIDAD RECIENTE (Últimas 50)', 14, yPos);

      // Sort by date desc and take last 50
      const recentTx = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 50)
        .map(t => [
          t.date.split('T')[0],
          t.category,
          t.description || '-',
          t.type === 'income' ? '+' : '-',
          formatCurrency(t.amount)
        ]);

      autoTable(doc, {
        startY: yPos + 5,
        head: [['FECHA', 'CATEGORÍA', 'DESCRIPCIÓN', 'T', 'MONTO']],
        body: recentTx,
        theme: 'plain',
        headStyles: { fillColor: [241, 245, 249], textColor: 0 }, // Slate 100
        styles: { fontSize: 8 },
        columnStyles: { 
          3: { halign: 'center' },
          4: { halign: 'right' } 
        },
      });

      // Footer
      const pageCount = doc.internal.pages.length - 1;
      doc.setFontSize(8);
      doc.setTextColor(150);
      for (let i = 1; i <= pageCount; i++) {
         doc.setPage(i);
         doc.text(`Página ${i} de ${pageCount} - Generado por QUANTA`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }

      // Save
      doc.save(`QUANTA_Reporte_Financiero_${today.replace(/ /g, '_')}.pdf`);
      logger.success('report', 'PDF Generated successfully');

    } catch (error: any) {
      logger.error('report', 'PDF Generation failed', error);
      console.error(error);
    }
  }
};

// Helper for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
};
