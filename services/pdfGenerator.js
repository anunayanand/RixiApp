const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const rawUrl = process.env.BASE_URL || 'https://rixilab.tech';
const formattedBaseUrl = rawUrl.replace('https://', 'www.');

async function generateCertificatePDF(data) {
  return new Promise(async (resolve, reject) => {
    try {
      // 🔹 SELECT TEMPLATE IMAGE
      let imageName = "Internship_Certificate.png";

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
      doc.fontSize(12); // approximate for 17px
      doc.fillColor('black');
      doc.text(`Certificate ID: ${data.certificate_id}`, 900, 230, { lineBreak: false });
      
      // QR Code
      const baseUrl = process.env.BASE_URL || "https://rixilab.tech";
      const verifyUrl = `${baseUrl}/certificate?intern_id=${data.intern_id}&certificate_id=${data.certificate_id}`;
      const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        errorCorrectionLevel: "H",
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" }
      });

      doc.image(qrBuffer, 958, 250, { fit: [110, 110] }); // Adjust QR position top-right corner

      // Name
      doc.font('Allura'); // cursive
      doc.fontSize(80); // approximate for 5em
      doc.fillColor('#1800ad');
      doc.text(data.name, 80, 355);

      // Certificate Text
      doc.font('Montserrat');
      doc.fontSize(18);
      doc.fillColor('#000000');
      doc.text(`has successfully completed ${data.duration} week online project based "${data.domain}" ${data.internship_type}\n at "Rixi Lab", from ${data.starting_date} to ${data.completion_date}, And submitted all assigned projects with 100% \ncompletion with dedication, discipline, and timely delivery. \nTheir performance was exemplary, demonstrating strong skills and a proactive attitude.\nWe appreciate their dedication and wish them success in their future endeavors.`, 50, 460, {
        width: 950,
        align: 'center',
        lineGap: 8
      });

      // doc.font('Montserrat')
      // doc.fontSize(12)
      // doc.fillColor('#000000')
      // doc.text(`${formattedBaseUrl}`, 990, 800);

      doc.end();
    } catch (err) {
      reject(err);
    }
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
      "../public/templet/Offer_Letter.png"
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
    doc.registerFont(
      "Montserrat-Medium",
      path.join(__dirname, "../public/fonts/Montserrat-Medium.ttf")
    )

    // =============================
    // Dates
    // =============================
    const startDate = new Date(data.starting_date);
    const assignedDate = new Date(startDate);
    assignedDate.setDate(assignedDate.getDate() - 1);

    const formatDate = (d) =>
      d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });

    // Intern ID & Date
    doc.font("Montserrat-Medium")
       .fontSize(11)
       .text(`Intern ID: ${data.intern_id}`, 40, 170);
    doc.text(`Date: ${formatDate(assignedDate)}`, 425, 170, { width: 130, align: "right" });

    // =============================
    // Body Content
    // =============================

    // Dear Name
    doc.font("Montserrat-Bold")
       .fontSize(12)
       .text(`Dear ${data.name}`, 40, 210);

    doc.font("Montserrat-Medium")
       .fontSize(11);

    const paraOptions = { width: 515, align: "justify", lineGap: 4 };

    // Paragraph 1
    doc.text("We are delighted to welcome you at Rixi Lab Technologies.", 40, 250);

    // Paragraph 2
    doc.text(
      `We are pleased to offer you an ${data.internship_type} position as a "${data.domain} Intern" with Rixi Lab Technologies. Your internship is scheduled to commence on ${formatDate(startDate)}, subject to your formal acceptance of this offer and compliance with the applicable Terms and Conditions.`,
      40, 280, paraOptions
    );

    // Paragraph 3
    doc.text(
      `The duration of your online internship will be ${data.duration} weeks, during which you will have the opportunity to enhance your technical skills, gain practical industry experience, and work on real-world projects under the guidance of experienced mentors.`,
      40, 352, paraOptions
    );

    // Paragraph 4
    doc.text(
      `At Rixi Lab, we believe that our people are our greatest asset. We are committed to fostering a learning-driven environment that encourages innovation, professional growth, and continuous development. We are confident that your enthusiasm, dedication, and willingness to learn will contribute positively to our organization and help you achieve your professional goals.`,
      40, 411, paraOptions
    );

    // Paragraph 5
    doc.text(
      `Your appointment as an Intern shall be governed by the company's Internship Terms and Conditions.`,
      40, 503, paraOptions
    );

    // Paragraph 6
    doc.text(
      `We are excited to have you join our team and look forward to supporting you throughout this enriching learning journey.`,
      40, 555, paraOptions
    );

    // Paragraph 7
    doc.text(`Congratulations !!`, 40, 600, paraOptions);

    doc.end();
  });
}


async function generateBootcampCertificatePDF(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const imageName = "bootcamp_certificate.png";
      const imagePath = path.join(__dirname, "../public/templet", imageName);

      const doc = new PDFDocument({ size: [1123, 794], margins: { top: 0, left: 0, right: 0, bottom: 0 } });
      const chunks = [];

      doc.on("data", c => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.registerFont("Montserrat", path.join(__dirname, "../public/fonts/Montserrat-Regular.ttf"));
      doc.registerFont("Montserrat-Bold", path.join(__dirname, "../public/fonts/Montserrat-Bold.ttf"));
      doc.registerFont("Allura", path.join(__dirname, "../public/fonts/Allura-Regular.ttf"));

      doc.image(imagePath, 0, 0, { width: 1123, height: 794 });

      // Certificate ID
      doc.font("Montserrat");
      doc.fontSize(15);
      doc.fillColor("black");
      doc.text(`CERTIFICATE No: ${data.certificate_id}`, 840,38); // Adjust position as needed

      // Name
      doc.font("Allura");
      doc.fontSize(80);
      doc.fillColor("#1800ad"); // Adjust color if needed
      doc.text(data.name, 80, 350,);

      // Body text
      const formatDate = (dateStr) => {
        if (!dateStr) return "___";
        return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      };
      
      const start = formatDate(data.start_date);
      const end = formatDate(data.end_date);
      
      doc.font("Montserrat");
      doc.fontSize(18);
      doc.fillColor("#000000");
      doc.text(
        `has successfully participated in the ${data.bootcamp_name} Bootcamp organized by Rixi \nLab from ${start} to ${end}.\nThe participant demonstrated dedication, enthusiasm, and active involvement\nthroughout the bootcamp program and successfully completed all learning sessions.\nWe appreciate their commitment to learning and wish them continued success.`,
        10, 460,
        {
          width: 1023,
          align: "center",
          lineGap: 8
        }
      );

      // QR Code
      const baseUrl = process.env.BASE_URL || "https://rixilab.tech";
      const verifyUrl = `${baseUrl}/verify-bootcamp-certificate/${data.certificate_id}`;
      const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        errorCorrectionLevel: "H",
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" }
      });
      
      doc.image(qrBuffer, 970, 85, { fit: [100, 100] }); // Adjust QR position
      doc.fontSize(12);
      // doc.text("Scan to verify", 960, 230);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}


module.exports = { generateCertificatePDF,generateOfferLetterPDF, generateBootcampCertificatePDF };
