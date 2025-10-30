
import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Defines the structure for a column in the export
interface Column<T> {
  header: string;
  // Accessor can be a key of the data object or a function to derive the value
  accessor: keyof T | ((item: T) => string | number);
}

interface ExportButtonsProps<T> {
  data: T[];
  columns: Column<T>[];
  filenamePrefix: string;
}

// A generic component to render CSV and PDF export buttons
const ExportButtons = <T extends object>({ data, columns, filenamePrefix }: ExportButtonsProps<T>) => {

  // Helper function to get a value from a data row based on the column definition
  const getRowValue = (item: T, column: Column<T>): string => {
    if (typeof column.accessor === 'function') {
      return String(column.accessor(item));
    }
    // Type assertion is needed here to access the property via a key
    return String(item[column.accessor as keyof T] ?? '');
  };

  // Handles the CSV export logic
  const handleExportCSV = () => {
    // Create header row
    const headers = columns.map(c => c.header).join(',');
    // Create data rows, ensuring values are properly quoted for CSV format
    const rows = data.map(item =>
      columns.map(col => `"${getRowValue(item, col).replace(/"/g, '""')}"`).join(',')
    );

    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');
    // Add BOM for Excel compatibility with UTF-8
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handles the PDF export logic using jsPDF and jspdf-autotable
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableHeaders = columns.map(c => c.header);
    const tableBody = data.map(item => columns.map(col => getRowValue(item, col)));
    
    const title = `Relatório de ${filenamePrefix}`;
    doc.text(title, 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [tableHeaders],
      body: tableBody,
    });

    doc.save(`${filenamePrefix}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex items-center space-x-2">
        <button onClick={handleExportCSV} className="px-3 py-2 text-sm bg-success text-white rounded-md hover:bg-green-700 flex items-center shadow-sm transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            CSV
        </button>
        <button onClick={handleExportPDF} className="px-3 py-2 text-sm bg-danger text-white rounded-md hover:bg-red-700 flex items-center shadow-sm transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            PDF
        </button>
    </div>
  );
};

export default ExportButtons;
