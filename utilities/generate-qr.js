require('dotenv').config();
const { generateSignature } = require('../routes/profileRoute');

const empId = process.argv[2];

if (!empId) {
  console.log('❌ Error: Please provide an Employee ID.');
  console.log('👉 Usage: node generate-qr.js <EMP_ID>');
  console.log('   Example: node generate-qr.js RL1234');
  process.exit(1);
}

const signature = generateSignature(empId);
const qrUrl = `http://localhost:8080/profile/${empId}?sig=${signature}`;

console.log('\n✅ Secure QR URL Generated!\n');
console.log('Employee ID:', empId);
console.log('Signature:', signature);
console.log('\n🔗 URL to paste into QR generator:\n' + qrUrl + '\n');
