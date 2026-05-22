const express = require("express");
const router = express.Router();
const PaymentTransaction = require("../models/PaymentTransaction");
const Ambassador = require("../models/Ambassador");
const Admin = require("../models/Admin");
const authRole = require("../middleware/authRole");
const { sendPayoutSuccessMail } = require("../services/payoutMailScript");
const { generateSalarySlip } = require("../services/salarySlipGenerator");
const User = require("../models/User");
const SuperAdmin = require("../models/SuperAdmin");

// GET /superAdmin/payouts -> Render Payout Center
router.get("/payouts", authRole("superAdmin"), async (req, res) => {
  try {
    const transactions = await PaymentTransaction.find().sort({ requestedAt: -1 }).populate('processedBy', 'name');
    const admins = await Admin.find().sort({ name: 1 });
    const ambassadors = await Ambassador.find().sort({ name: 1 });
    const superAdmin = await SuperAdmin.findOne({});
    const interns = await User.find({ role: "intern" });
    
    // Stats calculation
    const totalPaidOut = transactions
      .filter(t => t.status === "Approved")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const pendingCount = transactions.filter(t => t.status === "Pending").length;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthPayouts = transactions
      .filter(t => t.status === "Approved" && new Date(t.processedAt) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    const users = await User.find();
    const totalIncome = users.reduce((sum, u) => sum + (u.amountPaid || 0), 0);

    res.render("payoutCenter", {
      transactions,
      admins,
      ambassadors,
      superAdmin,
      interns,
      stats: {
        totalIncome,
        totalPaidOut,
        pendingCount,
        thisMonthPayouts
      }
    });
  } catch (error) {
    console.error("Payout Center Error:", error);
    res.status(500).send("Server Error");
  }
});

// POST /superAdmin/payouts/ambassador/approve/:txId
router.post("/payouts/ambassador/approve/:txId", authRole("superAdmin"), async (req, res) => {
  try {
    const { title, transactionId, amount, sendMail } = req.body;
    const tx = await PaymentTransaction.findById(req.params.txId);
    if (!tx || tx.status !== "Pending" || tx.type !== "AmbassadorWithdrawal") {
      return res.status(400).json({ success: false, message: "Invalid transaction" });
    }

    const ambassador = await Ambassador.findById(tx.recipientId);
    if (!ambassador) return res.status(404).json({ success: false, message: "Ambassador not found" });

    // Find the corresponding withdrawal
    const wIndex = ambassador.withdrawals.findIndex(w => w.status === "Pending" && w.amount === tx.amount && w.paymentDetails === tx.paymentDetails);
    
    if (wIndex !== -1) {
      ambassador.withdrawals[wIndex].status = "Approved";
      ambassador.withdrawals[wIndex].amount = Number(amount);
      ambassador.withdrawals[wIndex].title = title;
      ambassador.withdrawals[wIndex].transactionId = transactionId;
      ambassador.withdrawals[wIndex].date = new Date();
      await ambassador.save();
    }

    tx.title = title;
    tx.transactionId = transactionId;
    tx.amount = Number(amount);
    tx.status = "Approved";
    tx.processedAt = new Date();
    tx.processedBy = req.session.user;
    await tx.save();

    if (sendMail) {
      try {
        await sendPayoutSuccessMail({
          name: tx.recipientName,
          email: tx.recipientEmail,
          amount: tx.amount,
          transactionId: tx.transactionId,
          title: tx.title,
          date: tx.processedAt
        });
      } catch(err) {
        console.log("Email error:", err);
      }
    }

    res.json({ success: true, message: "Approved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /superAdmin/payouts/ambassador/reject/:txId
router.post("/payouts/ambassador/reject/:txId", authRole("superAdmin"), async (req, res) => {
  try {
    const tx = await PaymentTransaction.findById(req.params.txId);
    if (!tx) return res.status(404).json({ success: false, message: "Not found" });

    const ambassador = await Ambassador.findById(tx.recipientId);
    if (ambassador) {
      const wIndex = ambassador.withdrawals.findIndex(w => w.status === "Pending" && w.amount === tx.amount && w.paymentDetails === tx.paymentDetails);
      if (wIndex !== -1) {
        ambassador.withdrawals[wIndex].status = "Rejected";
        await ambassador.save();
      }
    }

    tx.status = "Rejected";
    tx.processedAt = new Date();
    tx.processedBy = req.session.user;
    await tx.save();

    res.json({ success: true, message: "Rejected successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /superAdmin/payouts/admin/update-payroll/:adminId
router.post("/payouts/admin/update-payroll/:adminId", authRole("superAdmin"), async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.adminId);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    const { month, basicSalary, performanceBonus, providentFund, professionalTax, upiId } = req.body;
    
    if (!month) return res.status(400).json({ success: false, message: "Month is required" });

    let monthEntry = admin.monthlyPayroll.find(m => m.month === month);
    let pfDiff = 0;

    if (monthEntry) {
      pfDiff = (Number(providentFund) || 0) - (monthEntry.providentFund || 0);
      monthEntry.basicSalary = Number(basicSalary) || 0;
      monthEntry.performanceBonus = Number(performanceBonus) || 0;
      monthEntry.providentFund = Number(providentFund) || 0;
      monthEntry.professionalTax = Number(professionalTax) || 0;
      monthEntry.upiId = upiId || "";
      monthEntry.savedAt = new Date();
    } else {
      pfDiff = Number(providentFund) || 0;
      admin.monthlyPayroll.push({
        month,
        basicSalary: Number(basicSalary) || 0,
        performanceBonus: Number(performanceBonus) || 0,
        providentFund: Number(providentFund) || 0,
        professionalTax: Number(professionalTax) || 0,
        upiId: upiId || ""
      });
    }

    // Add PF difference to balance
    admin.pfBalance = (admin.pfBalance || 0) + pfDiff;
    admin.upiId = upiId || admin.upiId;

    await admin.save();
    res.json({ success: true, message: "Payroll updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /superAdmin/payouts/admin/settle/:adminId
router.post("/payouts/admin/settle/:adminId", authRole("superAdmin"), async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.adminId);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    const { month, title, transactionId, sendMail } = req.body;

    if (!month) return res.status(400).json({ success: false, message: "Month is required" });

    const monthEntry = admin.monthlyPayroll.find(m => m.month === month);
    if (!monthEntry) return res.status(404).json({ success: false, message: "Payroll not set for this month" });

    const basicSalary = monthEntry.basicSalary || 0;
    const performanceBonus = monthEntry.performanceBonus || 0;
    const providentFund = monthEntry.providentFund || 0;
    const professionalTax = monthEntry.professionalTax || 0;

    const grossSalary = basicSalary + performanceBonus;
    const totalDeductions = providentFund + professionalTax;
    const netPay = grossSalary - totalDeductions;

    const [year, m] = month.split('-');
    const payPeriodStart = new Date(year, m - 1, 1);
    const payPeriodEnd = new Date(year, m, 0);

    const salaryEntry = {
      payPeriodStart,
      payPeriodEnd,
      basicSalary,
      performanceBonus,
      grossSalary,
      providentFund,
      professionalTax,
      totalDeductions,
      netPay,
      paymentMode: "UPI",
      transactionId,
      paidAt: new Date()
    };

    admin.salaryHistory.push(salaryEntry);
    admin.totalEarnings = (admin.totalEarnings || 0) + netPay;
    await admin.save();

    const tx = await PaymentTransaction.create({
      recipientId: admin._id,
      recipientModel: "Admin",
      recipientName: admin.name,
      recipientEmail: admin.email,
      amount: netPay,
      type: "AdminSalary",
      status: "Approved",
      transactionId,
      title: title || `Salary Settlement - ${admin.name}`,
      paymentDetails: admin.upiId,
      processedAt: new Date(),
      processedBy: req.session.user
    });

    if (sendMail) {
      try {
        await sendPayoutSuccessMail({
          name: admin.name,
          email: admin.email,
          amount: netPay,
          transactionId,
          title: tx.title,
          date: new Date()
        });
      } catch(err) {
        console.log("Email error:", err);
      }
    }

    res.json({ success: true, message: "Salary settled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /superAdmin/payouts/admin/pf-approve/:adminId/:pfId
router.post("/payouts/admin/pf-approve/:adminId/:pfId", authRole("superAdmin"), async (req, res) => {
  try {
    const { title, transactionId, sendMail } = req.body;
    const admin = await Admin.findById(req.params.adminId);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    const pfRequest = admin.pfWithdrawals.id(req.params.pfId);
    if (!pfRequest || pfRequest.status !== "Pending") return res.status(400).json({ success: false, message: "Invalid PF request" });

    pfRequest.status = "Approved";
    pfRequest.transactionId = transactionId;
    pfRequest.title = title;
    pfRequest.processedAt = new Date();

    admin.pfBalance -= pfRequest.amount;
    await admin.save();

    const tx = await PaymentTransaction.findOne({ recipientId: admin._id, type: "PFWithdrawal", status: "Pending", amount: pfRequest.amount }).sort({ requestedAt: -1 });
    if (tx) {
      tx.status = "Approved";
      tx.title = title;
      tx.transactionId = transactionId;
      tx.processedAt = new Date();
      tx.processedBy = req.session.user;
      await tx.save();
    }

    if (sendMail) {
      try {
        await sendPayoutSuccessMail({
          name: admin.name,
          email: admin.email,
          amount: pfRequest.amount,
          transactionId,
          title: title || "PF Withdrawal",
          date: new Date()
        });
      } catch(err) {
        console.log("Email error:", err);
      }
    }

    res.json({ success: true, message: "PF approved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /superAdmin/payouts/admin/pf-reject/:adminId/:pfId
router.post("/payouts/admin/pf-reject/:adminId/:pfId", authRole("superAdmin"), async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.adminId);
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    const pfRequest = admin.pfWithdrawals.id(req.params.pfId);
    if (!pfRequest) return res.status(400).json({ success: false, message: "Invalid PF request" });

    pfRequest.status = "Rejected";
    pfRequest.processedAt = new Date();
    await admin.save();

    const tx = await PaymentTransaction.findOne({ recipientId: admin._id, type: "PFWithdrawal", status: "Pending", amount: pfRequest.amount }).sort({ requestedAt: -1 });
    if (tx) {
      tx.status = "Rejected";
      tx.processedAt = new Date();
      tx.processedBy = req.session.user;
      await tx.save();
    }

    res.json({ success: true, message: "PF rejected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /superAdmin/payouts/history
router.get("/payouts/history", authRole("superAdmin"), async (req, res) => {
  try {
    const txs = await PaymentTransaction.find().sort({ requestedAt: -1 });
    res.json({ success: true, transactions: txs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /superAdmin/payouts/download-slip/:adminId/:slipIndex
router.get("/payouts/download-slip/:adminId/:slipIndex", authRole("superAdmin"), async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.adminId);
    if (!admin) return res.status(404).send("Admin not found");
    const slipIndex = parseInt(req.params.slipIndex);
    generateSalarySlip(admin, slipIndex, res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
