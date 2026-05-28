import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export interface EInvoiceData {
  invoiceNumber: string;
  date: Date;
  issuer: {
    name: string;
    tin: string;
    brn: string;
    address: string;
  };
  receiver: {
    name: string;
    tin: string;
    address: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    total: number;
  }>;
  totalExcludingTax: number;
  totalTax: number;
  totalAmount: number;
  lhdnValidationRef?: string;
}

export const generateEInvoicePDF = (data: EInvoiceData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header & Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("e-INVOIS", 14, 22);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Invoice No: ${data.invoiceNumber}`, 14, 30);
  doc.text(`Date: ${format(data.date, 'dd MMM yyyy')}`, 14, 35);
  if (data.lhdnValidationRef) {
    doc.setTextColor(16, 185, 129); // Emerald color
    doc.text(`LHDN Ref: ${data.lhdnValidationRef}`, 14, 40);
  }

  // 2. Issuer & Receiver Info
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("ISSUER", 14, 55);
  doc.text("RECEIVER", pageWidth / 2, 55);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  // Issuer details
  doc.text(data.issuer.name, 14, 62);
  doc.text(`TIN: ${data.issuer.tin}`, 14, 67);
  doc.text(`BRN: ${data.issuer.brn}`, 14, 72);
  doc.text(data.issuer.address, 14, 77, { maxWidth: 80 });

  // Receiver details
  doc.text(data.receiver.name, pageWidth / 2, 62);
  doc.text(`TIN: ${data.receiver.tin}`, pageWidth / 2, 67);
  doc.text(data.receiver.address, pageWidth / 2, 72, { maxWidth: 80 });

  // 3. Items Table
  autoTable(doc, {
    startY: 95,
    head: [['Description', 'Qty', 'Unit Price (RM)', 'Tax (RM)', 'Total (RM)']],
    body: data.items.map(item => [
      item.description,
      item.quantity,
      item.unitPrice.toFixed(2),
      item.taxAmount.toFixed(2),
      item.total.toFixed(2)
    ]),
    headStyles: { fillColor: [24, 24, 27], fontStyle: 'bold' },
    foot: [
      ['', '', '', 'Subtotal', `RM ${data.totalExcludingTax.toFixed(2)}`],
      ['', '', '', 'Total Tax', `RM ${data.totalTax.toFixed(2)}`],
      ['', '', '', 'Grand Total', `RM ${data.totalAmount.toFixed(2)}`]
    ],
    footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    theme: 'striped'
  });

  // 4. Compliance Footer
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    "This is a computer-generated e-Invois compliant with LHDN Malaysia requirements.",
    pageWidth / 2,
    finalY + 20,
    { align: "center" }
  );

  // Save the PDF
  doc.save(`e-invois-${data.invoiceNumber}.pdf`);
};
