const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const https = require("https");
const http = require("http");

async function fetchImageBuffer(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(null));
  });
}
const rawUrl = process.env.BASE_URL || 'https://rixilab.tech';
const formattedBaseUrl = rawUrl.replace('https://', 'www.');

async function generateCertificatePDF(data) {
  return new Promise(async (resolve, reject) => {
    try {
      // 🔹 SELECT TEMPLATE IMAGE
      let imageName = "Internship_Certificate.png";

      const imagePath = path.join(__dirname, "../../public/templet", imageName);

      const doc = new PDFDocument({ size: [1123, 794] });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Register custom fonts
      doc.registerFont('Montserrat', path.join(__dirname, '../../public/fonts/Montserrat-Regular.ttf'));
      doc.registerFont('Allura', path.join(__dirname, '../../public/fonts/Allura-Regular.ttf'));

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
      "../../public/templet/Offer_Letter.png"
    );
    doc.image(imagePath, 0, 0, { width: 595, height: 842 });

    // =============================
    // Fonts
    // =============================
    doc.registerFont(
      "Montserrat",
      path.join(__dirname, "../../public/fonts/Montserrat-Regular.ttf")
    );
    doc.registerFont(
      "Montserrat-Bold",
      path.join(__dirname, "../../public/fonts/Montserrat-Bold.ttf")
    );
    doc.registerFont(
      "Montserrat-Medium",
      path.join(__dirname, "../../public/fonts/Montserrat-Medium.ttf")
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
      const imagePath = path.join(__dirname, "../../public/templet", imageName);

      const doc = new PDFDocument({ size: [1123, 794], margins: { top: 0, left: 0, right: 0, bottom: 0 } });
      const chunks = [];

      doc.on("data", c => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.registerFont("Montserrat", path.join(__dirname, "../../public/fonts/Montserrat-Regular.ttf"));
      doc.registerFont("Montserrat-Bold", path.join(__dirname, "../../public/fonts/Montserrat-Bold.ttf"));
      doc.registerFont("Allura", path.join(__dirname, "../../public/fonts/Allura-Regular.ttf"));

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


async function generateReceiptPDF(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [595, 842], // A4
        margins: { top: 40, left: 50, right: 50, bottom: 40 }
      });
      const chunks = [];

      doc.on("data", c => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.registerFont("Montserrat", path.join(__dirname, "../../public/fonts/Montserrat-Regular.ttf"));
      doc.registerFont("Montserrat-Bold", path.join(__dirname, "../../public/fonts/Montserrat-Bold.ttf"));

      const watermarkPath = path.join(__dirname, "../../public/img/Rixi Lab New Logo PNG.png");
      const templatePath = path.join(__dirname, "../../public/templet/Internship Application.png");
      
      // 1. Background Template
      if (fs.existsSync(templatePath)) {
        doc.image(templatePath, 0, 0, { width: 595, height: 842 });
      } else if (fs.existsSync(watermarkPath)) {
        doc.save();
        doc.opacity(0.03);
        doc.image(watermarkPath, (595 - 350) / 2, (842 - 350) / 2, { fit: [350, 350], align: 'center', valign: 'center' });
        doc.restore();
      }

      // 2. Content Start Position
      let currentY = 170;

      // 3. Candidate Information
      doc.font("Montserrat-Bold").fontSize(15).fillColor("#ff6600").text("Intern Information", 50, currentY);
      currentY += 25;

      const labelX = 50;
      const colonX = 190;
      const valueX = 205;
      const valueWidth = 240; // Stop before photo

      // Function to render single column list
      const renderList = (fields, vW) => {
        for (let i = 0; i < fields.length; i++) {
          const row = fields[i];
          
          doc.font("Montserrat-Bold").fontSize(11).fillColor("#374151").text(row.label, labelX, currentY);
          doc.text(":", colonX, currentY);
          
          let maxLineHeight = 24; // Strict spacing for rows
          
          if (row.isBadge) {
             let badgeColor = "#F59E0B"; // Orange
             const valUpper = (row.value || "").toUpperCase();
             if (valUpper === "SUCCESS" || valUpper === "APPROVED") badgeColor = "#10B981";
             else if (valUpper === "FAILED" || valUpper === "REJECTED") badgeColor = "#EF4444";

             doc.roundedRect(valueX, currentY - 2, 70, 18, 2).fill(badgeColor);
             doc.font("Montserrat-Bold").fontSize(9).fillColor("#ffffff").text(valUpper, valueX, currentY + 3, { width: 70, align: "center" });
             maxLineHeight = Math.max(maxLineHeight, 26);
          } else {
             const fontName = row.isBold ? "Montserrat-Bold" : "Montserrat";
             const fontSize = row.fontSize || 11;
             const fontColor = row.color || "#000000";
             const height = doc.font(fontName).fontSize(fontSize).fillColor(fontColor).heightOfString(row.value, { width: vW });
             doc.text(row.value, valueX, currentY, { width: vW });
             maxLineHeight = Math.max(maxLineHeight, height + 8);
          }
          currentY += maxLineHeight;
        }
      };

      const candidateFields = [
        { label: "Name", value: data.name || "N/A" },
        { label: "Email", value: data.email || "N/A" },
        { label: "Phone", value: data.phone || "N/A" },
        { label: "Branch", value: data.branch || "N/A" },
        { label: "Course", value: data.course || "N/A" },
        { label: "Year / Semester", value: data.year_sem || "N/A" },
        { label: "College", value: data.college || "N/A" },
        { label: "University", value: data.university || "N/A" },
        { label: "Domain", value: `${data.domain || "N/A"} ${data.internshipType || "Internship"}` },
        { label: "Duration", value: `${data.duration || "N/A"} Weeks` },
        { label: "Applied Date", value: new Date(data.createdAt || Date.now()).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" }) }
      ];

      // Save Y for photo placement
      const photoStartY = currentY;
      
      renderList(candidateFields, valueWidth);

      // Draw Photo
      const photoWidth = 100;
      const photoHeight = 100;
      const photoX = 445;
      
      // doc.rect(photoX, photoStartY, photoWidth, photoHeight).lineWidth(1).strokeColor("#9ca3af").stroke();
      
      let photoRendered = false;
      if (data.profile_image_url) {
         let imgBuffer = await fetchImageBuffer(data.profile_image_url);
         if (imgBuffer) {
           try {
             doc.image(imgBuffer, photoX + 2, photoStartY + 2, { fit: [photoWidth - 4, photoHeight - 4], align: 'center', valign: 'center' });
             photoRendered = true;
           } catch (e) {
             console.error("Error drawing photo buffer");
           }
         }
      } 
      if (!photoRendered) {
         doc.font("Montserrat-Bold").fontSize(10).fillColor("#9ca3af").text("PHOTO", photoX, photoStartY + 50, { width: photoWidth, align: "center" });
      }

      currentY += 15;
      doc.moveTo(50, currentY).lineTo(545, currentY).lineWidth(1).strokeColor("#d1d5db").stroke();
      currentY += 20;

      // 4. Payment Details
      doc.font("Montserrat-Bold").fontSize(15).fillColor("#ff6600").text("Payment Details", 50, currentY);
      currentY += 25;

      const txFields = [
        { label: "Receipt Number", value: "REC-" + (data.order_id ? data.order_id.substring(data.order_id.length - 8) : "00000000") },
        { label: "Order ID", value: data.order_id || "N/A" },
        { label: "Payment ID", value: data.payID || "N/A" },
        { label: "Amount Paid", value: "Rs. " + (data.final_amount || data.amount || "0")},
        { label: "Payment Status", value: data.payment_status || "SUCCESS"},
        { label: "Transaction Time", value: new Date(data.createdAt || Date.now()).toLocaleString("en-GB", { timeZone: "Asia/Kolkata", day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() }
      ];
      
      renderList(txFields, 340); // wider width here as no photo on right

      // 5. Footer
      currentY = 750; // Fixed at bottom
      doc.moveTo(50, currentY).lineTo(545, currentY).lineWidth(1).strokeColor("#d1d5db").stroke();
      currentY += 15;
      
      doc.font("Montserrat").fontSize(7).fillColor("#6b7280")
         .text("This is a computer generated receipt. No signature is required.", 50, currentY);
      
      doc.text("Generated On: " + new Date().toLocaleString("en-GB", { timeZone: "Asia/Kolkata", day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(), 50, currentY, { align: "right", width: 495 });
      
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCertificatePDF, generateOfferLetterPDF, generateBootcampCertificatePDF, generateReceiptPDF };
