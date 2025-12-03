const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");

const EXPORT_DIR = path.join(__dirname, "../../exports")

if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}


// ============ CSV EXPORT ============
exports.exportToCSV = async (data, filename) => {
  try {
    const parser = new Parser();
    const csv = parser.parse(data);
    const filePath = path.join(EXPORT_DIR, `${filename}.csv`);

    fs.writeFileSync(filePath, csv);
    return filePath;
  } catch (error) {
    console.error("CSV export error:", error);
    throw error;
  }
};

// ============ EXCEL EXPORT ============
exports.exportToExcel = async (data, filename, sheetName = "Sheet1") => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length === 0) {
      throw new Error("Eksport uchun ma'lumot yo'q");
    }

    // Headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    worksheet.getRow(1).font.color = { argb: "FFFFFFFF" };

    // Data
    data.forEach((row) => {
      worksheet.addRow(Object.values(row));
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) maxLength = cellLength;
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    const filePath = path.join(EXPORT_DIR, `${filename}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    return filePath;
  } catch (error) {
    console.error("Excel export error:", error);
    throw error;
  }
};

// ============ PDF EXPORT ============
exports.exportToPDF = async (data, filename, title, headers) => {
  return new Promise((resolve, reject) => {
    try {
      const filePath = path.join(EXPORT_DIR, `${filename}.pdf`);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Title
      doc.fontSize(20).font("Helvetica-Bold").text(title, { align: "center" });
      doc.moveDown();

      // Date
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Yaratilish sanasi: ${new Date().toLocaleDateString("uz-UZ")}`, {
          align: "right",
        });
      doc.moveDown();

      // Table
      if (data.length > 0) {
        const tableTop = doc.y;
        const rowHeight = 20;
        const colWidths = [50, 100, 100, 100, 80]; // Adjust as needed

        // Table headers
        let xPos = 50;
        headers.forEach((header, i) => {
          doc.font("Helvetica-Bold").text(header, xPos, tableTop, {
            width: colWidths[i],
            align: "left",
          });
          xPos += colWidths[i];
        });

        doc.moveTo(50, tableTop + rowHeight).lineTo(550, tableTop + rowHeight).stroke();

        // Table rows
        let yPos = tableTop + rowHeight + 5;
        data.forEach((row, rowIndex) => {
          xPos = 50;
          Object.values(row).forEach((value, colIndex) => {
            if (colIndex < headers.length) {
              doc.font("Helvetica").fontSize(9).text(String(value), xPos, yPos, {
                width: colWidths[colIndex],
                align: "left",
              });
              xPos += colWidths[colIndex];
            }
          });
          yPos += rowHeight;

          // Add new page if needed
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
        });
      }

      doc.end();

      stream.on("finish", () => {
        resolve(filePath);
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};

// ============ TASKS EXPORT ============
exports.exportTasks = async (tasks, format = "excel") => {
  const data = tasks.map((task) => ({
    "Vazifa nomi": task.title,
    "Loyiha": task.project?.name || "N/A",
    "Mas'ul": task.assignedTo?.fullName || "N/A",
    "Status": task.status,
    "Prioritet": task.priority,
    "Muddati": task.dueDate ? new Date(task.dueDate).toLocaleDateString("uz-UZ") : "N/A",
    "Yaratilgan": new Date(task.createdAt).toLocaleDateString("uz-UZ"),
  }));

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `tasks_${timestamp}`;

  if (format === "csv") {
    return exports.exportToCSV(data, filename);
  } else if (format === "excel") {
    return exports.exportToExcel(data, filename, "Vazifalar");
  } else if (format === "pdf") {
    return exports.exportToPDF(
      data,
      filename,
      "Vazifalar Ro'yxati",
      ["Vazifa nomi", "Loyiha", "Mas'ul", "Status", "Prioritet", "Muddati", "Yaratilgan"]
    );
  }
};

// ============ PROJECTS EXPORT ============
exports.exportProjects = async (projects, format = "excel") => {
  const data = projects.map((project) => ({
    "Loyiha nomi": project.name,
    "Kod": project.code,
    "Menejeri": project.manager?.fullName || "N/A",
    "Status": project.status,
    "Prioritet": project.priority,
    "Boshlanish": new Date(project.startDate).toLocaleDateString("uz-UZ"),
    "Tugash": project.endDate ? new Date(project.endDate).toLocaleDateString("uz-UZ") : "N/A",
    "Azo soni": project.members?.length || 0,
  }));

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `projects_${timestamp}`;

  if (format === "csv") {
    return exports.exportToCSV(data, filename);
  } else if (format === "excel") {
    return exports.exportToExcel(data, filename, "Loyihalar");
  } else if (format === "pdf") {
    return exports.exportToPDF(
      data,
      filename,
      "Loyihalar Ro'yxati",
      ["Loyiha nomi", "Kod", "Menejeri", "Status", "Prioritet", "Boshlanish", "Tugash", "Azo soni"]
    );
  }
};

// ============ TIME LOGS EXPORT ============
exports.exportTimeLogs = async (timeLogs, format = "excel") => {
  const data = timeLogs.map((log) => ({
    "Foydalanuvchi": log.user?.fullName || "N/A",
    "Vazifa": log.task?.title || "N/A",
    "Loyiha": log.project?.name || "N/A",
    "Boshlanish": new Date(log.startTime).toLocaleString("uz-UZ"),
    "Tugashi": log.endTime ? new Date(log.endTime).toLocaleString("uz-UZ") : "Jarayonida",
    "Vaqt (daqiqa)": log.duration || 0,
    "Soatlarda": ((log.duration || 0) / 60).toFixed(2),
    "Status": log.status,
  }));

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `timelogs_${timestamp}`;

  if (format === "csv") {
    return exports.exportToCSV(data, filename);
  } else if (format === "excel") {
    return exports.exportToExcel(data, filename, "Vaqt Loglar");
  } else if (format === "pdf") {
    return exports.exportToPDF(
      data,
      filename,
      "Vaqt Loglar Ro'yxati",
      ["Foydalanuvchi", "Vazifa", "Loyiha", "Boshlanish", "Tugashi", "Vaqt (soat)", "Status"]
    );
  }
};

// ============ USERS EXPORT ============
exports.exportUsers = async (users, format = "excel") => {
  const data = users.map((user) => ({
    "To'liq ism": user.fullName,
    "Email": user.email,
    "Telefon": user.phone || "N/A",
    "Rol": user.role?.name || "N/A",
    "Bo'lim": user.department?.name || "N/A",
    "Lavozim": user.position || "N/A",
    "Holat": user.isActive ? "Faol" : "Nofaol",
    "Ro'yxatdan o'tgan": new Date(user.createdAt).toLocaleDateString("uz-UZ"),
  }));

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `users_${timestamp}`;

  if (format === "csv") {
    return exports.exportToCSV(data, filename);
  } else if (format === "excel") {
    return exports.exportToExcel(data, filename, "Foydalanuvchilar");
  } else if (format === "pdf") {
    return exports.exportToPDF(
      data,
      filename,
      "Foydalanuvchilar Ro'yxati",
      ["To'liq ism", "Email", "Telefon", "Rol", "Bo'lim", "Lavozim", "Holat", "Ro'yxatdan o'tgan"]
    );
  }
};

// ============ DELETE OLD EXPORTS ============
exports.cleanupOldExports = async (daysOld = 7) => {
  try {
    const now = Date.now();
    const cutoff = 1000 * 60 * 60 * 24 * daysOld;

    fs.readdirSync(EXPORT_DIR).forEach((file) => {
      const filePath = path.join(EXPORT_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > cutoff) {
        fs.unlinkSync(filePath);
        console.log(`Eski fayl o'chirildi: ${file}`);
      }
    });
  } catch (error) {
    console.error("Export cleanup error:", error);
  }
};