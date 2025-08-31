import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudyRecord } from '@/types';
import { formatTime, formatDateTime } from './timer';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export const generatePDFReport = (
  records: StudyRecord[],
  studyType: 'self-study' | 'lecture-study'
): void => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('JEE TIMER', 105, 20, { align: 'center' });
    
    // Add subtitle
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    const titleText = studyType === 'self-study' ? 'Self Study Report' : 'Lecture Study Report';
    doc.text(titleText, 105, 30, { align: 'center' });
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 105, 40, { align: 'center' });
    
    // Calculate total time
    const totalTime = records.reduce((sum, record) => sum + record.duration, 0);
    doc.text(`Total Study Time: ${formatTime(totalTime)}`, 105, 48, { align: 'center' });
    doc.text(`Total Sessions: ${records.length}`, 105, 56, { align: 'center' });
  
  // Prepare table data
  const tableHeaders = ['Date', 'Subject', 'Start Time', 'End Time', 'Duration'];
  const tableData = records.map(record => [
    record.date,
    record.subject.charAt(0).toUpperCase() + record.subject.slice(1),
    formatDateTime(record.startTime).split(', ')[1],
    formatDateTime(record.endTime).split(', ')[1],
    formatTime(record.duration)
  ]);
  
  // Add table using autoTable function directly
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 70,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [34, 119, 255], // Blue color
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 15, right: 15 },
  });
  
  // Add footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text('Made by programmer_deepak', 105, pageHeight - 10, { align: 'center' });
  
    // Save the PDF
    const fileName = `${studyType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};