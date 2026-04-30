require("dotenv").config();
const mongoose = require("mongoose");
const Ambassador = require("./models/Ambassador");
const User = require("./models/User");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    const ambassador = await Ambassador.findOne({ referralId: "SUMMER20" });
    if (!ambassador) {
      console.log("Ambassador SUMMER20 not found.");
      process.exit(0);
    }
    
    console.log(`Found Ambassador: ${ambassador.name}`);

    // Set equity and total earnings as requested
    ambassador.equity = 20;
    ambassador.total_earnings = 105.81;

    // Fetch all interns referred by this ambassador
    const referredInterns = await User.find({ referal_code: "SUMMER20", role: "intern" });
    
    // Map interns to the new embedded schema format
    const internDetails = referredInterns.map(intern => {
      let amount_paid = 0;
      let equity_earned = 0;

      if (intern.domain.toLowerCase().includes("java programming")) {
        equity_earned = 28.50;
        amount_paid = 142.50;
      } else if (intern.domain.toLowerCase().includes("full stack development")) {
        equity_earned = 20.31;
        amount_paid = 101.55;
      }

      return {
        name: intern.name,
        email: intern.email,
        phone: intern.phone,
        domain: intern.domain,
        duration: intern.duration,
        batch_no: intern.batch_no,
        amount_paid: amount_paid,
        equity_earned: equity_earned,
        joining_date: intern.joining_date || new Date()
      };
    });

    ambassador.referred_interns = internDetails;
    ambassador.internCount = internDetails.length;

    await ambassador.save();
    console.log(`✅ Updated Ambassador SUMMER20. Interns: ${internDetails.length}. Total Earnings: ${ambassador.total_earnings}`);

  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

migrate();
