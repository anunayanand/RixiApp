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


async function generateOfferLetterPDF(data) {
  return new Promise((resolve, reject) => {

    const doc = new PDFDocument({
      size: [595, 842], // A4 Portrait
      margins: { top: 0, left: 0, right: 0, bottom: 0 }
    });

    const chunks = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // =============================
    // Background Template
    // =============================
    const imagePath = path.join(
      __dirname,
      "../public/templet/offer_letter_bg.png"
    );
    doc.image(imagePath, 0, 0, { width: 595, height: 842 });

    // =============================
    // Fonts
    // =============================
    doc.registerFont(
      "Montserrat",
      path.join(__dirname, "../public/fonts/Montserrat-Regular.ttf")
    );
    doc.registerFont(
      "Montserrat-Bold",
      path.join(__dirname, "../public/fonts/Montserrat-Bold.ttf")
    );

    // =============================
    // Dates
    // =============================
    const startDate = new Date(data.starting_date);
    const assignedDate = new Date(startDate);
    assignedDate.setDate(assignedDate.getDate() - 1);

    const formatDate = (d) =>
      d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

    // =============================
    // Header Text (Locked Positions)
    // =============================

    // To Name
    doc.font("Montserrat-Bold")
       .fontSize(14)
       .fillColor("#000")
       .text(`To ${data.name}`, 60, 210);

    // College
    doc.font("Montserrat")
       .fontSize(12)
       .text(data.college_name, 60, 230,{width:230});

    // Date (Right)
    doc.font("Montserrat-Bold")
       .fontSize(12)
       .text(formatDate(assignedDate), 465, 210);

    // Intern ID
    doc.font("Montserrat")
       .fontSize(12)
       .text(`Intern ID: ${data.intern_id}`, 410, 230);

    // =============================
    // Body Content
    // =============================

    const bodyX = 50;
    const bodyWidth = 495;
    let y = 300;

    // Dear Name
    doc.font("Montserrat-Bold")
       .fontSize(14)
       .text(`Dear ${data.name}`, 60, 315);

    // y += 30;

    // Paragraph in one flow
    // Intro line (NOT justified)
doc.font("Montserrat")
   .fontSize(13)
   .text(
     "Welcome to Rixi Lab,",
     60,
     350
   );

// Body paragraph (LEFT aligned)
doc.font("Montserrat")
   .fontSize(13)
   .text(
     `We are pleased to offer you an appointment (internship) with Rixi Lab. Your effective date of joining with us will be from ${formatDate(startDate)}. You will begin your internship journey after giving a formal acceptance of this letter. As an intern, you will receive a "${data.domain} intern" status for the duration of ${data.duration} week subject to completion and acceptance of Terms & Conditions.
     `,
     60,
     375,
     {
       width: 480,
       align: "justify",
     }
   );
   doc.font("Montserrat")
   .fontSize(13)
   .text(
    `We hope that you are excited to embark on a transformational journey with our team. We believe that our team is our biggest strength and we take pride in welcoming any new talent who is having a great desire to learn. We are sure that you will play a pivotal role in achieving and will strengthen the core values of the company.`,
     60,
     490,
     {
       width: 480,
       align: "justify",
     }
   )
   doc.font("Montserrat")
   .fontSize(13)
   .text(
   `Your appointment as an Intern will be governed by the Terms and Conditions.`,
      60,
      585,
      {
        width: 480,
        align: "justify",
      }
   )
    doc.font("Montserrat")
   .fontSize(13)
   .text(
   `Congratulations !!`,
      60,
      620,
      {
        width: 480,
        align: "justify",
      }
   )
    doc.end();
  });
}


module.exports = { generateCertificatePDF,generateOfferLetterPDF };
