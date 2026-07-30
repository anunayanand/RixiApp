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
  doc.registerFont("Montserrat", path.join(__dirname, "../../public/fonts/Montserrat-Regular.ttf"));
  doc.registerFont("Montserrat-Bold", path.join(__dirname, "../../public/fonts/Montserrat-Bold.ttf"));

  // Template Image
  const imagePath = path.join(__dirname, "../../public/templet/Salary Slip Template.png");
  doc.image(imagePath, 0, 0, { width: 595.28, height: 841.89 });

  // Helpers
  const formatCurrency = (num) => `Rs. ${Number(num).toFixed(2)}`;
  const formatDateForLetter = (date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatMonthYear = (date) => new Date(date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  
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

  // DATE (Moved to align with the template's SALARY SLIP header)
  doc.font("Montserrat").fontSize(10).fillColor('#000000')
     .text(`Date : ${formatDateForLetter(slip.paidAt)}`.toUpperCase(), 430, 135, { width: 115, align: 'right' });

  // Paragraph 1
  doc.font("Montserrat").fontSize(10)
     .text(`Dear ${admin.name},`, 50, 165)
     .text(`This letter confirms the payment of your salary for the period ${payStart} to ${payEnd} in your role as ${admin.designation || 'Employee'} – ${admin.domain || 'Department'} at Rixi Lab Technologies.`, 50, 180, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 2
  const words = numberToWords(slip.netPay);
  doc.text(`As per the below salary slip, the net payable amount is INR ${Number(slip.netPay).toFixed(2)} (Rupees ${words} Only), which has been paid via (${slip.paymentMode}) on ${formatDateForLetter(slip.paidAt)}.`, 50, 220, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 3
  doc.text(`This payment includes all applicable salary components and statutory deductions. Please consider this letter as an official record of salary payment for the mentioned period.`, 50, 260, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 4
  doc.text(`We sincerely appreciate your continued leadership and contribution to Rixi Lab Technologies.`, 50, 300)
     .text(`Thank you.`, 50, 315);


  // TWO-COLUMN TABLE DESIGN
  const startX = 40;
  const fullW = 515;
  const halfW = fullW / 2;
  const midX = startX + halfW;
  let y = 345;
  
  // Theme colors
  const primaryColor = '#212529';
  const secondaryColor = '#6c757d';
  const borderColor = '#dee2e6';
  const bgLight = '#f8f9fa';
  const bgAccent = '#f1f3f5';

  // 2. Employee Details
  doc.roundedRect(startX, y, fullW, 75, 6).stroke(borderColor);
  
  let ey = y + 12;
  const l1 = startX + 15; const l2 = startX + 115;
  const r1 = midX + 10; const r2 = midX + 100;

  doc.font("Montserrat").fontSize(9).fillColor(secondaryColor);
  doc.text("Employee Name:", l1, ey);
  doc.fillColor(primaryColor).font("Montserrat-Bold").text(admin.name, l2, ey);
  
  doc.font("Montserrat").fillColor(secondaryColor);
  doc.text("Employee ID:", r1, ey);
  doc.fillColor(primaryColor).font("Montserrat-Bold").text(admin.emp_id || 'RL250201', r2, ey);
  
  ey += 18;
  doc.font("Montserrat").fillColor(secondaryColor);
  doc.text("Email ID:", l1, ey);
  doc.fillColor(primaryColor).text(admin.email, l2, ey);
  
  doc.font("Montserrat").fillColor(secondaryColor);
  doc.text("Designation:", r1, ey);
  doc.fillColor(primaryColor).text(admin.designation, r2, ey);
  
  ey += 18;
  doc.font("Montserrat").fillColor(secondaryColor);
  doc.text("Department:", l1, ey);
  doc.fillColor(primaryColor).text('Administration', l2, ey);
  
  doc.font("Montserrat").fillColor(secondaryColor);
  doc.text("Pay Period:", r1, ey);
  doc.fillColor(primaryColor).text(`${formatDateForTable(slip.payPeriodStart)} to ${formatDateForTable(slip.payPeriodEnd)}`, r2, ey);

  // 3. Earnings & Deductions Table
  y += 90; // gap of 15
  const tableTop = y;
  const bodyH = 50;
  const tableH = 25 + bodyH + 25 + 30; // 130
  
  // Fill background regions and clip to rounded rect
  doc.save();
  doc.roundedRect(startX, y, fullW, tableH, 6).clip();
  doc.rect(startX, y, fullW, 25).fill(bgAccent); // Header bg
  doc.rect(startX, y + 25 + bodyH, fullW, 25).fill(bgLight); // Gross bg
  doc.rect(startX, y + 25 + bodyH + 25, fullW, 30).fill('#e9ecef'); // Net Pay bg
  doc.restore();
  
  // Draw outer border
  doc.roundedRect(startX, y, fullW, tableH, 6).stroke(borderColor);

  // Header texts
  doc.fillColor(primaryColor).font("Montserrat-Bold").fontSize(9);
  doc.text("EARNINGS", startX + 15, y + 8);
  doc.text("AMOUNT (INR)", startX + 15, y + 8, { width: halfW - 30, align: 'right' });
  doc.text("DEDUCTIONS", midX + 15, y + 8);
  doc.text("AMOUNT (INR)", midX + 15, y + 8, { width: halfW - 30, align: 'right' });
  
  // Horizontal lines
  doc.moveTo(startX, y + 25).lineTo(startX + fullW, y + 25).stroke(borderColor);
  doc.moveTo(startX, y + 25 + bodyH).lineTo(startX + fullW, y + 25 + bodyH).stroke(borderColor);
  doc.moveTo(startX, y + 25 + bodyH + 25).lineTo(startX + fullW, y + 25 + bodyH + 25).stroke(borderColor);

  // Vertical line
  doc.moveTo(midX, y).lineTo(midX, y + 25 + bodyH + 25).stroke(borderColor);

  // 4. Body Texts
  let bodyY = y + 25;
  doc.font("Montserrat").fontSize(9).fillColor(primaryColor);
  
  let by = bodyY + 12;
  doc.text("Basic Salary", startX + 15, by);
  doc.text(formatCurrency(slip.basicSalary), startX + 15, by, { width: halfW - 30, align: 'right' });
  by += 18;
  doc.text("Performance Bonus", startX + 15, by);
  doc.text(formatCurrency(slip.performanceBonus), startX + 15, by, { width: halfW - 30, align: 'right' });

  let ddy = bodyY + 12;
  doc.text("Provident Fund (PF)", midX + 15, ddy);
  doc.text(formatCurrency(slip.providentFund), midX + 15, ddy, { width: halfW - 30, align: 'right' });
  ddy += 18;
  doc.text("Professional Tax", midX + 15, ddy);
  doc.text(formatCurrency(slip.professionalTax), midX + 15, ddy, { width: halfW - 30, align: 'right' });

  // 5. Gross / Total Deductions Texts
  let grossY = bodyY + bodyH;
  doc.font("Montserrat-Bold").fontSize(9).fillColor(primaryColor);
  doc.text("GROSS SALARY", startX + 15, grossY + 7);
  doc.text(formatCurrency(slip.grossSalary), startX + 15, grossY + 7, { width: halfW - 30, align: 'right' });
  
  doc.text("TOTAL DEDUCTIONS", midX + 15, grossY + 7);
  doc.text(formatCurrency(slip.totalDeductions), midX + 15, grossY + 7, { width: halfW - 30, align: 'right' });

  // 6. Net Pay Texts
  let netY = grossY + 25;
  doc.fillColor(primaryColor).font("Montserrat-Bold").fontSize(11);
  doc.text("NET PAY", startX + 15, netY + 9);
  doc.text(formatCurrency(slip.netPay), startX + 15, netY + 9, { width: fullW - 30, align: 'right' });

  // 7. Payment Details
  y += tableH + 15;
  doc.roundedRect(startX, y, fullW, 55, 6).stroke(borderColor);
  
  let py = y + 12;
  doc.font("Montserrat").fontSize(9).fillColor(secondaryColor);
  doc.text("Payment Mode:", startX + 15, py);
  doc.fillColor(primaryColor).font("Montserrat-Bold").text(slip.paymentMode || 'N/A', startX + 100, py);
  
  doc.font("Montserrat").fillColor(secondaryColor);
  doc.text("Date of Payment:", midX + 10, py);
  doc.fillColor(primaryColor).font("Montserrat-Bold").text(formatDateForTable(slip.paidAt), midX + 110, py);
  
  py += 18;
  doc.font("Montserrat").fillColor(secondaryColor);
  doc.text("Transaction ID:", startX + 15, py);
  doc.fillColor(primaryColor).font("Montserrat").text(slip.transactionId || 'N/A', startX + 100, py);

  doc.font("Montserrat").fillColor(secondaryColor);
  doc.text("Time of Payment:", midX + 10, py);
  doc.fillColor(primaryColor).font("Montserrat-Bold").text(formatTime(slip.paidAt), midX + 110, py);

  y = 700;
  // Enclosure
  doc.font("Montserrat").fontSize(8).fillColor(secondaryColor).text(`Enclosure: Salary Slip (${periodText})`, 350, y + 15, { width: 195, align: 'right' });

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
  doc.registerFont("Montserrat", path.join(__dirname, "../../public/fonts/Montserrat-Regular.ttf"));
  doc.registerFont("Montserrat-Bold", path.join(__dirname, "../../public/fonts/Montserrat-Bold.ttf"));

  // Template Image
  const imagePath = path.join(__dirname, "../../public/templet/Salary Slip Template.png");
  doc.image(imagePath, 0, 0, { width: 595.28, height: 841.89 });

  // Helpers
  const formatCurrency = (num) => `Rs. ${Number(num).toFixed(2)}`;
  const formatDateForLetter = (date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatMonthYear = (date) => new Date(date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  
  const formatDateForTable = (date) => {
      const d = new Date(date);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const requestDate = formatDateForLetter(slip.requestedAt);
  const processDate = formatDateForLetter(slip.processedAt);

  // DATE (Moved to align with the template's SALARY SLIP header)
  doc.font("Montserrat").fontSize(10).fillColor('#000000')
     .text(`Date : ${formatDateForLetter(slip.processedAt)}`.toUpperCase(), 430, 135, { width: 115, align: 'right' });

  // Paragraph 1
  doc.font("Montserrat").fontSize(10)
     .text(`Dear ${admin.name},`, 50, 165)
     .text(`This letter confirms the approval and payment of your Provident Fund (PF) withdrawal requested on ${requestDate}.`, 50, 180, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 2
  const words = numberToWords(slip.amount);
  doc.text(`As per the below slip, the withdrawn amount is INR ${Number(slip.amount).toFixed(2)} (Rupees ${words} Only), which has been processed on ${processDate} to your provided payment details.`, 50, 220, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 3
  doc.text(`Please consider this letter as an official record of your PF withdrawal.`, 50, 260, { width: 495, align: 'justify', lineGap: 2 });

  // Paragraph 4
  doc.text(`We sincerely appreciate your continued leadership and contribution to Rixi Lab Technologies.`, 50, 300)
     .text(`Thank you.`, 50, 315);


  // TWO-COLUMN TABLE DESIGN
  const startX = 40;
  const fullW = 515;
  const halfW = fullW / 2;
  const midX = startX + halfW;
  let y = 345;
  
  // Theme colors
  const primaryColor = '#212529';
  const secondaryColor = '#6c757d';
  const borderColor = '#dee2e6';
  const bgLight = '#f8f9fa';
  const bgAccent = '#f1f3f5';

  // 1. Header Box
  doc.roundedRect(startX, y, fullW, 35, 6).fill(bgAccent);
  doc.roundedRect(startX, y, fullW, 35, 6).stroke(borderColor);
  doc.fillColor(primaryColor).font("Montserrat-Bold").fontSize(12)
     .text("PF WITHDRAWAL SLIP", startX, y + 11, { width: fullW, align: 'center' });

  y += 50;

  // 2. Employee Details
  doc.roundedRect(startX, y, fullW, 75, 6).stroke(borderColor);
  let ey = y + 12;
  const l1 = startX + 15; const l2 = startX + 115;
  const r1 = midX + 10; const r2 = midX + 100;

  doc.font("Montserrat").fontSize(9).fillColor(primaryColor);
  doc.text("Employee Name:", l1, ey);
  doc.fillColor(primaryColor).font("Montserrat-Bold").text(admin.name, l2, ey);
  
  doc.font("Montserrat").fillColor(primaryColor);
  doc.text("Employee ID:", r1, ey);
  doc.fillColor(primaryColor).font("Montserrat-Bold").text(admin.emp_id || 'RL250201', r2, ey);
  
  ey += 18;
  doc.font("Montserrat").fillColor(primaryColor);
  doc.text("Email ID:", l1, ey);
  doc.fillColor(primaryColor).text(admin.email, l2, ey);
  
  doc.font("Montserrat").fillColor(primaryColor);
  doc.text("Designation:", r1, ey);
  doc.fillColor(primaryColor).text(admin.designation, r2, ey);
  
  ey += 18;
  doc.font("Montserrat").fillColor(primaryColor);
  doc.text("Department:", l1, ey);
  doc.fillColor(primaryColor).text('Administration', l2, ey);
  
  doc.font("Montserrat").fillColor(primaryColor);
  doc.text("Request Date:", r1, ey);
  doc.fillColor(primaryColor).text(formatDateForTable(slip.requestedAt), r2, ey);

  // 3. Withdrawal Details Table
  y += 90; // gap of 15
  const tableTop = y;
  const bodyH = 30; // Just one line for withdrawal details
  const tableH = 25 + bodyH + 30; // 85 (Header 25, Body 30, Total Paid 30)
  
  // Fill background regions and clip to rounded rect
  doc.save();
  doc.roundedRect(startX, y, fullW, tableH, 6).clip();
  doc.rect(startX, y, fullW, 25).fill(bgAccent); // Header bg
  doc.rect(startX, y + 25 + bodyH, fullW, 30).fill('#e9ecef'); // Total Paid bg
  doc.restore();
  
  // Draw outer border
  doc.roundedRect(startX, y, fullW, tableH, 6).stroke(borderColor);

  // Header texts
  doc.fillColor(primaryColor).font("Montserrat-Bold").fontSize(9);
  doc.text("WITHDRAWAL DETAILS", startX + 15, y + 8);
  doc.text("AMOUNT (INR)", startX + 15, y + 8, { width: fullW - 30, align: 'right' });
  
  // Horizontal lines
  doc.moveTo(startX, y + 25).lineTo(startX + fullW, y + 25).stroke(borderColor);
  doc.moveTo(startX, y + 25 + bodyH).lineTo(startX + fullW, y + 25 + bodyH).stroke(borderColor);

  // 4. Body Texts
  let bodyY = y + 25;
  doc.font("Montserrat").fontSize(9).fillColor(primaryColor);
  
  let by = bodyY + 12;
  doc.text("PF Withdrawn Amount", startX + 15, by);
  doc.text(formatCurrency(slip.amount), startX + 15, by, { width: fullW - 30, align: 'right' });

  // 6. Total Paid Texts
  let netY = bodyY + bodyH;
  doc.fillColor(primaryColor).font("Montserrat-Bold").fontSize(11);
  doc.text("TOTAL PAID", startX + 15, netY + 9);
  doc.text(formatCurrency(slip.amount), startX + 15, netY + 9, { width: fullW - 30, align: 'right' });

  // 7. Payment Details
  y += tableH + 15;
  doc.roundedRect(startX, y, fullW, 55, 6).stroke(borderColor);
  
  let py = y + 12;
  doc.font("Montserrat").fontSize(9).fillColor(secondaryColor);
  doc.text("Payment Details:", startX + 15, py);
  doc.fillColor(primaryColor).font("Montserrat-Bold").text(slip.paymentDetails || 'N/A', startX + 115, py);
  
  doc.font("Montserrat").fillColor(secondaryColor);
  doc.text("Date of Process:", midX + 10, py);
  doc.fillColor(primaryColor).font("Montserrat-Bold").text(formatDateForTable(slip.processedAt), midX + 110, py);
  
  py += 18;
  doc.font("Montserrat").fillColor(secondaryColor);
  doc.text("Transaction ID:", startX + 15, py);
  doc.fillColor(primaryColor).font("Montserrat").text(slip.transactionId || 'N/A', startX + 115, py);

  doc.font("Montserrat").fillColor(secondaryColor);
  doc.text("Time of Process:", midX + 10, py);
  doc.fillColor(primaryColor).font("Montserrat-Bold").text(formatTime(slip.processedAt), midX + 110, py);

  y = 700;
  // Enclosure
  doc.font("Montserrat").fontSize(8).text(`Enclosure: PF Withdrawal Slip`, 350, y + 15, { width: 195, align: 'right' });

  doc.end();
}

module.exports = { generateSalarySlip, generatePFSlip };
