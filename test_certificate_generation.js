require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { generateBootcampCertificatePDF } = require('./services/pdfGenerator');

const userJson = {
  "name": "Anunay",
  "email": "anunay3882@gmail.com",
  "phone": "123456789",
  "profile_image": "https://i.pinimg.com/736x/e6/31/f1/e631f170b5dfc882ed2845b521653ecb.jpg",
  "otp": null,
  "otpExpiry": null,
  "enrolledBootcamps": [
    {
      "bootcamp_id": {
        "$oid": "6a023491ba4f14792d4a7996"
      },
      "progress": 100,
      "attendance": [
        {
          "session_id": "Session 1 : Intorduction",
          "status": "present",
          "_id": {
            "$oid": "6a044350d8c6c42278ce47a6"
          }
        }
      ],
      "_id": {
        "$oid": "6a04423bd8c6c42278ce4744"
      }
    },
    {
      "bootcamp_id": {
        "$oid": "6a05da80b37a6d7e4193da68"
      },
      "progress": 67,
      "attendance": [
        {
          "session_id": " Node.js Fundamental",
          "status": "present",
          "_id": {
            "$oid": "6a05db4bb37a6d7e4193dc06"
          }
        },
        {
          "session_id": "Backend Development with Express",
          "status": "absent",
          "_id": {
            "$oid": "6a05db59b37a6d7e4193dc26"
          }
        },
        {
          "session_id": "Real-World Projects &amp; Deployment",
          "status": "present",
          "_id": {
            "$oid": "6a05dbcab37a6d7e4193dca9"
          }
        }
      ],
      "_id": {
        "$oid": "6a05dac7b37a6d7e4193db9e"
      }
    }
  ],
  "createdAt": {
    "$date": "2026-05-13T09:19:55.060Z"
  },
  "__v": 5
};

async function runTest() {
  try {
    // Find the bootcamp that is 100% completed
    const completedBootcamp = userJson.enrolledBootcamps.find(b => b.progress === 100);
    
    if (!completedBootcamp) {
      console.log("No completed bootcamps found.");
      return;
    }

    // Mock data based on the user JSON provided
    const data = {
      name: userJson.name,
      bootcamp_name: "Full Stack Web Development", // Mocking bootcamp name
      certificate_id: "RLB26050101", // Mocking a certificate ID
      start_date: "2025-04-15T00:00:00Z", // Mock start date
      end_date: "2025-05-15T00:00:00Z" // Mock end date
    };

    console.log(`Generating certificate for ${data.name}...`);
    
    const pdfBuffer = await generateBootcampCertificatePDF(data);
    
    const outputPath = path.join(__dirname, `test_certificate_${data.name.replace(/\s+/g, '_')}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`Success! Certificate saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error generating certificate:", error);
  }
}

runTest();
