// jsPDF will be loaded dynamically when needed

/**
 * Export data to CSV format
 */
export const exportToCSV = (data, columns, filename = "export") => {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  if (!columns || columns.length === 0) {
    throw new Error("No columns specified for export");
  }

  // Create CSV header
  const headers = columns.map(col => col.label || col.key);
  const csvRows = [headers.join(",")];

  // Add data rows
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col.key];
      // Handle null/undefined values
      if (value === null || value === undefined) return "";
      // Escape commas and quotes in values
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  });

  // Create CSV content
  const csvContent = csvRows.join("\n");
  
  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Download file
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to PDF format
 */
export const exportToPDF = async (data, columns, options = {}) => {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  if (!columns || columns.length === 0) {
    throw new Error("No columns specified for export");
  }

  // Try to load jsPDF and jspdf-autotable dynamically
  let jsPDFLib;
  let autoTableAvailable = false;
  
  try {
    // Import jspdf-autotable first so it can extend jsPDF
    try {
      await import("jspdf-autotable");
      autoTableAvailable = true;
    } catch (e) {
      console.warn("jspdf-autotable not available, using basic table generation", e);
    }
    
    // Then import jsPDF
    const jsPDFModule = await import("jspdf");
    jsPDFLib = jsPDFModule.default;
  } catch (e) {
    throw new Error("PDF export requires jsPDF. Please install it: npm install jspdf jspdf-autotable");
  }

  const {
    filename = "export",
    title = "Export Report",
    companyName = "AI Booking Voice System",
    companyLogo = null,
    orientation = "portrait",
    includeSummary = false,
    summaryData = null,
  } = options;

  // Create PDF document
  const doc = new jsPDFLib({
    orientation: orientation === "landscape" ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  let yPosition = 20;

  // Add company logo if provided
  if (companyLogo) {
    try {
      doc.addImage(companyLogo, "PNG", 14, yPosition, 30, 10);
      yPosition += 15;
    } catch (error) {
      console.warn("Could not add logo to PDF:", error);
    }
  }

  // Add company name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, 14, yPosition);
  yPosition += 8;

  // Add title
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, yPosition);
  yPosition += 6;

  // Add export date and time
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Exported on: ${new Date().toLocaleString()}`,
    14,
    yPosition
  );
  yPosition += 10;

  // Prepare table data
  const tableData = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return "";
      return String(value);
    })
  );

  const tableHeaders = columns.map(col => col.label || col.key);

  // Add table using autoTable if available, otherwise use basic table
  if (autoTableAvailable && typeof doc.autoTable === 'function') {
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue color
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { top: yPosition, left: 14, right: 14 },
      didDrawPage: (data) => {
        // Add page numbers
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const pageCount = doc.internal.getNumberOfPages();
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      },
    });
  } else {
    // Basic table generation without autoTable
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const colWidth = (doc.internal.pageSize.getWidth() - 28) / tableHeaders.length;
    let xPos = 14;
    tableHeaders.forEach((header, index) => {
      doc.text(header, xPos, yPosition);
      xPos += colWidth;
    });
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    tableData.forEach((row, rowIndex) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPosition = 20;
      }
      xPos = 14;
      row.forEach((cell, colIndex) => {
        doc.text(String(cell).substring(0, 20), xPos, yPosition);
        xPos += colWidth;
      });
      yPosition += 6;
    });
  }

  // Add summary if requested
  if (includeSummary && summaryData) {
    const finalY = (autoTableAvailable && doc.lastAutoTable) ? doc.lastAutoTable.finalY : yPosition + 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Summary", 14, finalY + 10);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    Object.entries(summaryData).forEach(([key, value], index) => {
      doc.text(`${key}: ${value}`, 14, finalY + 20 + index * 6);
    });
  }

  // Save PDF
  doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
};

/**
 * Format date for export
 */
export const formatDateForExport = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * Format datetime for export
 */
export const formatDateTimeForExport = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

