const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

async function generateCertificatePDF(data) {
  return new Promise((resolve, reject) => {
    // 🔹 SELECT TEMPLATE IMAGE
    let imageName = "certificate_bg.png";

    const imagePath = path.join(__dirname, "../public/templet", imageName);

    const doc = new PDFDocument({ size: [1123, 794] });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Register custom fonts
    doc.registerFont('Montserrat', path.join(__dirname, '../public/fonts/Montserrat-Regular.ttf'));
    doc.registerFont('Allura', path.join(__dirname, '../public/fonts/Allura-Regular.ttf'));

    // Add background image covering full page
    doc.image(imagePath, 0, 0, { width: 1123, height: 794 });

    // Certificate ID
    doc.font('Montserrat');
    doc.fontSize(15); // approximate for 17px
    doc.fillColor('black');
    doc.text(`CERTIFICATE ID: ${data.certificate_id}`, 822, 33);

    // Name
    doc.font('Allura'); // cursive
    doc.fontSize(80); // approximate for 5em
    doc.fillColor('#1800ad');
    doc.text(data.name, 80, 360);

    // Certificate Text
    doc.font('Montserrat');
    doc.fontSize(18);
    doc.fillColor('#000000');
    doc.text(`has successfully completed ${data.duration} week online project based "${data.domain} Internship" at \n"Rixi Lab", from ${data.starting_date} to ${data.completion_date}, And submitted all assigned projects with 100% \ncompletion with dedication, discipline, and timely delivery. \nTheir performance was exemplary, demonstrating strong skills and a proactive attitude.\nWe appreciate their dedication and wish them success in their future endeavors.`, 50, 460, {
      width: 950,
      align: 'center',
      lineGap: 8
    });

    doc.end();
  });
}

module.exports = { generateCertificatePDF };
