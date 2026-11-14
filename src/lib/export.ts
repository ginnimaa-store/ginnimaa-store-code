import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportOrderRow {
  orderId: string;
  date: string;
  customerName: string;
  phone: string;
  address: string;
  items: string;
  total: number;
  status: string;
  otp: string;
  partner: string;
}

export function exportOrdersExcel(rows: ExportOrderRow[], filename = 'ginnimaa_orders.xlsx') {
  const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
    'Order ID': r.orderId,
    'Date': r.date,
    'Customer Name': r.customerName,
    'Phone': r.phone,
    'Address': r.address,
    'Ordered Items': r.items,
    'Total Amount': r.total,
    'Status': r.status,
    'OTP': r.otp,
    'Assigned Partner': r.partner,
  })));

  ws['!cols'] = [
    { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 14 },
    { wch: 40 }, { wch: 50 }, { wch: 12 }, { wch: 16 },
    { wch: 8 }, { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  XLSX.writeFile(wb, filename);
}

export function exportOrdersPDF(rows: ExportOrderRow[], filename = 'ginnimaa_orders.pdf') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GINNIMAA - Order Report', 40, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 40, 45);
  doc.text(`Total Orders: ${rows.length}`, 40, 58);

  autoTable(doc, {
    startY: 70,
    head: [['Order ID', 'Date', 'Customer', 'Phone', 'Address', 'Items', 'Total', 'Status', 'OTP', 'Partner']],
    body: rows.map(r => [
      r.orderId,
      r.date,
      r.customerName,
      r.phone,
      r.address.substring(0, 50),
      r.items.substring(0, 60),
      `Rs.${r.total}`,
      r.status,
      r.otp,
      r.partner,
    ]),
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [245, 158, 11], textColor: 255, fontSize: 8 },
    columnStyles: {
      4: { cellWidth: 120 },
      5: { cellWidth: 140 },
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(filename);
}
