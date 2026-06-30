const PDFDocument = require('pdfkit');
const path = require('path');

function numberToWords(num) {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
}

function generateSalarySlip(admin, slipIndex, res) {
  const slip = admin.salaryHistory[slipIndex];
  if (!slip) {
    return res.status(404).send("Salary slip not found");
  }

  const doc = new PDFDocument({
    size: [595.28, 841.89], // A4 Portrait
    margins: { top: 0, left: 0, right: 0, bottom: 0 }
  });

  const filename = `SalarySlip_${admin.name.replace(/\s+/g, '_')}_${new Date(slip.payPeriodEnd).toLocaleDateString('default', { month: 'short', year: 'numeric' })}.pdf`;
  res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-type', 'application/pdf');

  doc.pipe(res);

  // Fonts
  doc.registerFont("Montserrat", path.join(__dirname, "../public/fonts/Montserrat-Regular.ttf"));
  doc.registerFont("Montserrat-Bold", path.join(__dirname, "../public/fonts/Montserrat-Bold.ttf"));

  // Template Image
  const imagePath = path.join(__dirname, "../public/templet/Salary Slip Template.png");
  doc.image(imagePath, 0, 0, { width: 595.28, height: 841.89 });

  // Helpers
  const formatCurrency = (num) => `Rs. ${Number(num).toFixed(2)}`;
  const formatDateForLetter = (date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatMonthYear = (date) => new Date(date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  
  const formatDateForTable = (date) => {
      const d = new Date(date);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const payStart = formatDateForLetter(slip.payPeriodStart);
  const payEnd = formatDateForLetter(slip.payPeriodEnd);
  const payMonthYearStart = formatMonthYear(slip.payPeriodStart);
  const payMonthYearEnd = formatMonthYear(slip.payPeriodEnd);

  let periodText = payMonthYearStart;
  if (payMonthYearStart !== payMonthYearEnd) periodText += ` to ${payMonthYearEnd}`;

  // DATE
  doc.font("Montserrat").fontSize(10).fillColor('#000000')
     .text(`Date : ${formatDateForLetter(slip.paidAt)}`.toUpperCase(), 455, 40, { width: 115, align: 'right' });

  // Letter Title
  doc.font("Montserrat-Bold").fontSize(12)
     .text(`Salary Payment Letter for the Period ${periodText}`, 50, 100);

  // Paragraph 1
  doc.font("Montserrat").fontSize(10)
     .text(`Dear ${admin.name},`, 50, 130)
     .text(`This letter confirms the payment of your salary for the period ${payStart} to ${payEnd} in your role as ${admin.designation || 'Employee'} – ${admin.domain || 'Department'} at Rixi Lab Technologies.`, 50, 145, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 2
  const words = numberToWords(slip.netPay);
  doc.text(`As per the below salary slip, the net payable amount is INR ${Number(slip.netPay).toFixed(2)} (Rupees ${words} Only), which has been paid via (${slip.paymentMode}) on ${formatDateForLetter(slip.paidAt)}.`, 50, 185, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 3
  doc.text(`This payment includes all applicable salary components and statutory deductions. Please consider this letter as an official record of salary payment for the mentioned period.`, 50, 225, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 4
  doc.text(`We sincerely appreciate your continued leadership and contribution to Rixi Lab Technologies.`, 50, 265)
     .text(`Thank you.`, 50, 280);


  // TWO-COLUMN TABLE DESIGN (starts at y = 310)
  const startX = 40;
  const fullW = 515;
  const halfW = fullW / 2;
  const midX = startX + halfW;
  let y = 310;

  // 1. Header Box
  doc.rect(startX, y, fullW, 40).fillAndStroke('#f0f0f0', '#000000');
  doc.fillColor('#000000').font("Montserrat-Bold").fontSize(14)
     .text("Rixi Lab Technologies - SALARY SLIP", startX, y + 13, { width: fullW, align: 'center' });

  // 2. Employee Details
  y += 40;
  doc.rect(startX, y, fullW, 80).stroke('#000000');
  
  doc.font("Montserrat").fontSize(10);
  let ey = y + 15;
  const l1 = startX + 10; const l2 = startX + 110;
  const r1 = midX + 10; const r2 = midX + 90;

  doc.text("Employee Name:", l1, ey).text(admin.name, l2, ey);
  doc.text("Employee ID:", r1, ey).text(admin.emp_id || 'RL250201', r2, ey);
  ey += 15;
  doc.text("Email ID:", l1, ey).text(admin.email, l2, ey);
  doc.text("Designation:", r1, ey).text(admin.designation, r2, ey);
  ey += 15;
  doc.text("Department:", l1, ey).text('Administration', l2, ey);
  ey += 15;
  doc.text("Pay Period:", l1, ey).text(`${formatDateForTable(slip.payPeriodStart)} to ${formatDateForTable(slip.payPeriodEnd)}`, l2, ey);

  // 3. Earnings & Deductions Headers
  y += 90; // gap of 10
  doc.rect(startX, y, halfW, 20).fillAndStroke('#f0f0f0', '#000000');
  doc.rect(midX, y, halfW, 20).fillAndStroke('#f0f0f0', '#000000');
  
  doc.fillColor('#000000').font("Montserrat").fontSize(10);
  doc.text("EARNINGS", startX + 10, y + 5);
  doc.text("AMOUNT (IN INR)", startX + 10, y + 5, { width: halfW - 20, align: 'right' });
  doc.text("DEDUCTIONS", midX + 10, y + 5);
  doc.text("AMOUNT (IN INR)", midX + 10, y + 5, { width: halfW - 20, align: 'right' });

  // 4. Body
  y += 20;
  const bodyH = 80;
  doc.rect(startX, y, halfW, bodyH).stroke('#000000');
  doc.rect(midX, y, halfW, bodyH).stroke('#000000');

  doc.font("Montserrat").fontSize(10);
  
  // Left: Earnings
  let by = y + 10;
  doc.text("Basic Salary", startX + 10, by);
  doc.text(formatCurrency(slip.basicSalary), startX + 10, by, { width: halfW - 20, align: 'right' });
  by += 15;
  doc.text("Performance Bonus", startX + 10, by);
  doc.text(formatCurrency(slip.performanceBonus), startX + 10, by, { width: halfW - 20, align: 'right' });

  // Right: Deductions
  let ddy = y + 10;
  doc.text("Provident Fund (PF)", midX + 10, ddy);
  doc.text(formatCurrency(slip.providentFund), midX + 10, ddy, { width: halfW - 20, align: 'right' });
  ddy += 15;
  doc.text("Professional Tax", midX + 10, ddy);
  doc.text(formatCurrency(slip.professionalTax), midX + 10, ddy, { width: halfW - 20, align: 'right' });

  // 5. Gross / Total Deductions
  y += bodyH;
  doc.rect(startX, y, halfW, 25).stroke('#000000');
  doc.rect(midX, y, halfW, 25).stroke('#000000');

  doc.font("Montserrat-Bold").fontSize(10);
  doc.text("GROSS SALARY", startX + 10, y + 7);
  doc.text(formatCurrency(slip.grossSalary), startX + 10, y + 7, { width: halfW - 20, align: 'right' });
  doc.text("TOTAL DEDUCTIONS", midX + 10, y + 7);
  doc.text(formatCurrency(slip.totalDeductions), midX + 10, y + 7, { width: halfW - 20, align: 'right' });

  // 6. Net Pay
  y += 25;
  doc.rect(startX, y, fullW, 25).fillAndStroke('#f0f0f0', '#000000');
  doc.fillColor('#000000').font("Montserrat-Bold").fontSize(11);
  doc.text("NET PAY", startX + 10, y + 7);
  doc.text(formatCurrency(slip.netPay), startX + 10, y + 7, { width: fullW - 20, align: 'right' });

  // 7. Payment Details
  y += 35; // Gap of 10
  doc.rect(startX, y, fullW, 50).stroke('#000000');
  
  doc.font("Montserrat").fontSize(10);
  let py = y + 10;
  doc.text("Payment Mode:", l1, py).text(slip.paymentMode || 'N/A', l2, py);
  doc.text("Date of Payment:", r1, py).text(formatDateForTable(slip.paidAt), r1 + 100, py);
  py += 15;
  doc.text("Transaction ID:", l1, py).text(slip.transactionId || 'N/A', l2, py);

  y = 700;
  // Enclosure
  doc.font("Montserrat").fontSize(8).text(`Enclosure: Salary Slip (${periodText})`, 350, y + 15, { width: 195, align: 'right' });

  doc.end();
}

function generatePFSlip(admin, slipIndex, res) {
  const slip = admin.pfWithdrawals[slipIndex];
  if (!slip || slip.status !== 'Approved') {
    return res.status(404).send("Approved PF slip not found");
  }

  const doc = new PDFDocument({
    size: [595.28, 841.89], // A4 Portrait
    margins: { top: 0, left: 0, right: 0, bottom: 0 }
  });

  const filename = `PF_Withdrawal_Slip_${admin.name.replace(/\s+/g, '_')}_${new Date(slip.processedAt).toLocaleDateString('default', { month: 'short', year: 'numeric' })}.pdf`;
  res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-type', 'application/pdf');

  doc.pipe(res);

  // Fonts
  doc.registerFont("Montserrat", path.join(__dirname, "../public/fonts/Montserrat-Regular.ttf"));
  doc.registerFont("Montserrat-Bold", path.join(__dirname, "../public/fonts/Montserrat-Bold.ttf"));

  // Template Image
  const imagePath = path.join(__dirname, "../public/templet/Salary Slip Template.png");
  doc.image(imagePath, 0, 0, { width: 595.28, height: 841.89 });

  // Helpers
  const formatCurrency = (num) => `Rs. ${Number(num).toFixed(2)}`;
  const formatDateForLetter = (date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatMonthYear = (date) => new Date(date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  
  const formatDateForTable = (date) => {
      const d = new Date(date);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const requestDate = formatDateForLetter(slip.requestedAt);
  const processDate = formatDateForLetter(slip.processedAt);

  // DATE
  doc.font("Montserrat").fontSize(10).fillColor('#000000')
     .text(`Date : ${formatDateForLetter(slip.processedAt)}`.toUpperCase(), 455, 40, { width: 115, align: 'right' });

  // Letter Title
  doc.font("Montserrat-Bold").fontSize(12)
     .text(`Provident Fund (PF) Withdrawal Letter`, 50, 100);

  // Paragraph 1
  doc.font("Montserrat").fontSize(10)
     .text(`Dear ${admin.name},`, 50, 130)
     .text(`This letter confirms the approval and payment of your Provident Fund (PF) withdrawal requested on ${requestDate}.`, 50, 145, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 2
  const words = numberToWords(slip.amount);
  doc.text(`As per the below slip, the withdrawn amount is INR ${Number(slip.amount).toFixed(2)} (Rupees ${words} Only), which has been processed on ${processDate} to your provided payment details.`, 50, 175, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 3
  doc.text(`Please consider this letter as an official record of your PF withdrawal.`, 50, 215, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 4
  doc.text(`We sincerely appreciate your continued leadership and contribution to Rixi Lab Technologies.`, 50, 245)
     .text(`Thank you.`, 50, 260);


  // TWO-COLUMN TABLE DESIGN (starts at y = 310)
  const startX = 40;
  const fullW = 515;
  const halfW = fullW / 2;
  const midX = startX + halfW;
  let y = 310;

  // 1. Header Box
  doc.rect(startX, y, fullW, 40).fillAndStroke('#f0f0f0', '#000000');
  doc.fillColor('#000000').font("Montserrat-Bold").fontSize(14)
     .text("Rixi Lab Technologies - PF WITHDRAWAL SLIP", startX, y + 13, { width: fullW, align: 'center' });

  // 2. Employee Details
  y += 40;
  doc.rect(startX, y, fullW, 60).stroke('#000000');
  
  doc.font("Montserrat").fontSize(10);
  let ey = y + 15;
  const l1 = startX + 10; const l2 = startX + 110;
  const r1 = midX + 10; const r2 = midX + 90;

  doc.text("Employee Name:", l1, ey).text(admin.name, l2, ey);
  doc.text("Employee ID:", r1, ey).text(admin.emp_id || 'RL250201', r2, ey);
  ey += 15;
  doc.text("Email ID:", l1, ey).text(admin.email, l2, ey);
  doc.text("Designation:", r1, ey).text(admin.designation, r2, ey);
  ey += 15;
  doc.text("Department:", l1, ey).text('Administration', l2, ey);

  // 3. Body
  y += 70; // gap of 10
  const bodyH = 60;
  
  doc.rect(startX, y, fullW, 20).fillAndStroke('#f0f0f0', '#000000');
  doc.fillColor('#000000').font("Montserrat").fontSize(10);
  doc.text("WITHDRAWAL DETAILS", startX + 10, y + 5);
  doc.text("AMOUNT (IN INR)", startX + 10, y + 5, { width: fullW - 20, align: 'right' });
  
  y += 20;
  doc.rect(startX, y, fullW, bodyH).stroke('#000000');

  let by = y + 10;
  doc.text("PF Withdrawn Amount", startX + 10, by);
  doc.text(formatCurrency(slip.amount), startX + 10, by, { width: fullW - 20, align: 'right' });

  // 6. Net Pay
  y += bodyH;
  doc.rect(startX, y, fullW, 25).fillAndStroke('#f0f0f0', '#000000');
  doc.fillColor('#000000').font("Montserrat-Bold").fontSize(11);
  doc.text("TOTAL PAID", startX + 10, y + 7);
  doc.text(formatCurrency(slip.amount), startX + 10, y + 7, { width: fullW - 20, align: 'right' });

  // 7. Payment Details
  y += 35; // Gap of 10
  doc.rect(startX, y, fullW, 50).stroke('#000000');
  
  doc.font("Montserrat").fontSize(10);
  let py = y + 10;
  doc.text("Payment Details:", l1, py).text(slip.paymentDetails || 'N/A', l2, py);
  doc.text("Date of Process:", r1, py).text(formatDateForTable(slip.processedAt), r1 + 100, py);
  py += 15;
  doc.text("Transaction ID:", l1, py).text(slip.transactionId || 'N/A', l2, py);

  y = 700;
  // Enclosure
  doc.font("Montserrat").fontSize(8).text(`Enclosure: PF Withdrawal Slip`, 350, y + 15, { width: 195, align: 'right' });

  doc.end();
}

module.exports = { generateSalarySlip, generatePFSlip };
