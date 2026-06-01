const express = require("express");
const router = express.Router();
const PaymentTransaction = require("../models/PaymentTransaction");
const CertificatePurchase = require("../models/CertificatePurchase");
const Ambassador = require("../models/Ambassador");
const Admin = require("../models/Admin");
const authRole = require("../middleware/authRole");
const { sendPayoutSuccessMail, sendVoucherEmail } = require("../services/payoutMailScript");
const { generateSalarySlip } = require("../services/salarySlipGenerator");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const SuperAdmin = require("../models/SuperAdmin");
const Expenditure = require("../models/Expenditure");
const RedemptionRequest = require("../models/RedemptionRequest");
const EnrollmentHistory = require("../models/EnrollmentHistory");

const getAvailableBalance = async () => {
  const users = await User.find();
  const rawIncome = users.reduce((sum, u) => sum + (u.amountPaid || 0), 0);
  
  const certPurchases = await CertificatePurchase.find();
  const certIncome = certPurchases.reduce((sum, cp) => sum + (cp.amount || 0), 0);

  const totalRawIncome = rawIncome + certIncome;
  
  const expenditures = await Expenditure.find();
  const expTotal = expenditures.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  
  const transactions = await PaymentTransaction.find({ status: "Approved" });
  const paidTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  return totalRawIncome - expTotal - paidTotal;
};

// GET /superAdmin/payouts -> Render Payout Center
router.get("/payouts", authRole("superAdmin"), async (req, res) => {
  try {
    const transactions = await PaymentTransaction.find().sort({ requestedAt: -1 }).populate('processedBy', 'name');
    const admins = await Admin.find().sort({ name: 1 });
    const ambassadors = await Ambassador.find().sort({ name: 1 });
    const superAdmin = await SuperAdmin.findOne({});
    const interns = await User.find({ role: "intern" });
    const expenditures = await Expenditure.find().sort({ date: -1 }).populate('addedBy', 'name');
    
    // Stats calculation
    const totalPaidOutTransactions = Number(transactions
      .filter(t => t.status === "Approved")
      .reduce((sum, t) => sum + t.amount, 0).toFixed(2));
      
    const pendingCount = transactions.filter(t => t.status === "Pending").length;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthPayoutsTransactions = Number(transactions
      .filter(t => t.status === "Approved" && new Date(t.processedAt) >= startOfMonth)
      .reduce((sum, t) => sum + t.amount, 0).toFixed(2));

    const totalExpenditure = Number(expenditures.reduce((sum, exp) => sum + (exp.amount || 0), 0).toFixed(2));
    
    const thisMonthExpenditures = Number(expenditures
      .filter(exp => new Date(exp.date) >= startOfMonth)
      .reduce((sum, exp) => sum + (exp.amount || 0), 0).toFixed(2));

    const totalPaidOut = Number((totalPaidOutTransactions + totalExpenditure).toFixed(2));
    const thisMonthPayouts = Number((thisMonthPayoutsTransactions + thisMonthExpenditures).toFixed(2));

    const users = await User.find();
    let totalIncome = Number(users.reduce((sum, u) => sum + (u.amountPaid || 0), 0).toFixed(2));

    const certPurchasesForIncome = await CertificatePurchase.find();
    const certIncome = certPurchasesForIncome.reduce((sum, cp) => sum + (cp.amount || 0), 0);
    totalIncome = Number((totalIncome + certIncome).toFixed(2));

    const redemptionRequests = await RedemptionRequest.find().populate('internId', 'name email').sort({ createdAt: -1 });

    const enrollmentHistory = await EnrollmentHistory.find().sort({ enrollmentDate: -1 }).populate('internId', 'name email');

    const certificatePurchases = await CertificatePurchase.find().sort({ date: -1 });
    const formattedCertPurchases = certificatePurchases.map(cp => ({
      _id: cp._id,
      requestedAt: cp.date,
      recipientName: cp.name,
      recipientEmail: cp.email,
      amount: cp.amount,
      type: 'CertificatePurchase',
      status: 'Approved',
      transactionId: cp.transactionId
    }));

    const allTransactions = [...transactions, ...formattedCertPurchases].sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    res.render("payoutCenter", {
      transactions: allTransactions,
      certificatePurchases,
      admins,
      ambassadors,
      superAdmin,
      hasSecretKey: !!superAdmin.secretKey,
      interns,
      expenditures,
      redemptionRequests,
      enrollmentHistory,
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

// POST /superAdmin/payouts/expenditure -> Add External Expenditure
router.post("/payouts/expenditure", authRole("superAdmin"), async (req, res) => {
  try {
    const { title, amount, description, date, txnId } = req.body;
    if (!title || !amount || !txnId) {
      return res.status(400).json({ success: false, message: "Title, amount and transaction ID are required" });
    }

    const available = await getAvailableBalance();
    if (Number(amount) > available) {
      return res.status(400).json({ success: false, message: "Insufficient available balance" });
    }

    const expenditure = new Expenditure({
      title : title.trim(),
      amount: Number(amount),
      description: description.trim() || "",
      addedBy: req.session.user ? req.session.user._id : null,
      transactionId: txnId.trim(),
      date : date ? new Date(date) : new Date(),
    });

    await expenditure.save();
    res.json({ success: true, message: "Expenditure added successfully", expenditure });
  } catch (error) {
    console.error("Expenditure Error:", error);
    res.status(500).json({ success: false, message: "Server error while adding expenditure" });
  }
});

// POST /superAdmin/payouts/verify-secret -> Verify Secret Key for Total Income
router.post("/payouts/verify-secret", authRole("superAdmin"), async (req, res) => {
  try {
    const { secret_key } = req.body;
    if (!secret_key) return res.status(400).json({ success: false, message: "Secret key is required" });

    // Find the superAdmin
    const superAdmin = await SuperAdmin.findOne({});
    if (!superAdmin) return res.status(404).json({ success: false, message: "SuperAdmin not found" });

    if (superAdmin.secretKey === secret_key) {
      // Calculate total income and return it
      const users = await User.find();
      let totalIncome = Number(users.reduce((sum, u) => sum + (u.amountPaid || 0), 0).toFixed(2));
      
      const certPurchases = await CertificatePurchase.find();
      const certIncome = certPurchases.reduce((sum, cp) => sum + (cp.amount || 0), 0);
      
      totalIncome = Number((totalIncome + certIncome).toFixed(2));
      
      const expenditures = await Expenditure.find();
      const totalExpenditure = Number(expenditures.reduce((sum, exp) => sum + (exp.amount || 0), 0).toFixed(2));

      const transactions = await PaymentTransaction.find({ status: "Approved" });
      const totalPaidOutTransactions = Number(transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2));
      
      const totalPaidOut = Number((totalPaidOutTransactions + totalExpenditure).toFixed(2));
      const availableBalance = Number((totalIncome - totalPaidOut).toFixed(2));

      res.json({ success: true, totalIncome, availableBalance });
    } else {
      res.status(403).json({ success: false, message: "Invalid secret key" });
    }
  } catch (error) {
    console.error("Verify Secret Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /superAdmin/payouts/set-secret -> Set Secret Key initially
router.post("/payouts/set-secret", authRole("superAdmin"), async (req, res) => {
  try {
    const { new_secret } = req.body;
    if (!new_secret || new_secret.length < 4) return res.status(400).json({ success: false, message: "Secret key must be at least 4 characters" });

    const superAdmin = await SuperAdmin.findOne({});
    if (!superAdmin) return res.status(404).json({ success: false, message: "SuperAdmin not found" });

    if (superAdmin.secretKey) {
      return res.status(400).json({ success: false, message: "Secret key is already set. Use reset option instead." });
    }

    superAdmin.secretKey = new_secret;
    await superAdmin.save();

    res.json({ success: true, message: "Secret key set successfully" });
  } catch (error) {
    console.error("Set Secret Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /superAdmin/payouts/reset-secret -> Reset Secret Key using account password
router.post("/payouts/reset-secret", authRole("superAdmin"), async (req, res) => {
  try {
    const { password, new_secret } = req.body;
    if (!password || !new_secret || new_secret.length < 4) {
      return res.status(400).json({ success: false, message: "Current password and new secret key (min 4 chars) are required" });
    }

    const superAdmin = await SuperAdmin.findOne({});
    if (!superAdmin) return res.status(404).json({ success: false, message: "SuperAdmin not found" });

    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if (!isMatch) {
      return res.status(403).json({ success: false, message: "Incorrect account password" });
    }

    superAdmin.secretKey = new_secret;
    await superAdmin.save();

    res.json({ success: true, message: "Secret key reset successfully" });
  } catch (error) {
    console.error("Reset Secret Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
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

    const available = await getAvailableBalance();
    if (Number(amount) > available) {
      return res.status(400).json({ success: false, message: "Insufficient available balance" });
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

    const grossSalary = Number((basicSalary + performanceBonus).toFixed(2));
    const totalDeductions = Number((providentFund + professionalTax).toFixed(2));
    const netPay = Number((grossSalary - totalDeductions).toFixed(2));

    const available = await getAvailableBalance();
    if (netPay > available) {
      return res.status(400).json({ success: false, message: "Insufficient available balance" });
    }

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

    const available = await getAvailableBalance();
    if (pfRequest.amount > available) {
      return res.status(400).json({ success: false, message: "Insufficient available balance" });
    }

    pfRequest.status = "Approved";
    pfRequest.transactionId = transactionId;
    pfRequest.title = title;
    pfRequest.processedAt = new Date();

    admin.pfBalance -= pfRequest.amount;
    admin.totalEarnings = (admin.totalEarnings || 0) + pfRequest.amount;
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

// POST /superAdmin/payouts/intern/approve-redemption/:id
router.post("/payouts/intern/approve-redemption/:id", authRole("superAdmin"), async (req, res) => {
  try {
    const { moneySpent, voucherCode, title, transactionId, sendMail } = req.body;
    const request = await RedemptionRequest.findById(req.params.id).populate('internId');
    
    if (!request || request.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }
    if (!transactionId) {
      return res.status(400).json({ success: false, message: "Transaction ID is required" });
    }
    const available = await getAvailableBalance();
    if (Number(moneySpent) > available) {
      return res.status(400).json({ success: false, message: "Insufficient available balance" });
    }

    request.status = "Approved";
    request.moneySpent = Number(moneySpent);
    request.voucherCode = voucherCode;
    request.transactionId = transactionId;
    request.processedAt = new Date();
    await request.save();

    // Create payment transaction for transaction history
    await PaymentTransaction.create({
      recipientId: request.internId._id,
      recipientModel: 'User',
      recipientName: request.internId.name,
      recipientEmail: request.internId.email,
      amount: Number(moneySpent),
      type: 'InternRedemption',
      status: 'Approved',
      transactionId: request.transactionId,
      title: title || `Intern Redemption - ${request.rewardType}`,
      paymentDetails: `Voucher: ${request.rewardType}`,
      processedAt: new Date(),
      processedBy: req.session.user ? req.session.user._id : null
    });

    if (sendMail) {
      try {
        await sendVoucherEmail({
          name: request.internId.name,
          email: request.internId.email,
          rewardType: request.rewardType,
          voucherCode: request.voucherCode,
          pointsUsed: request.pointsUsed,
          date: request.processedAt
        });
      } catch (err) {
        console.error("Voucher Email Error:", err);
      }
    }

    res.json({ success: true, message: "Redemption approved successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /superAdmin/payouts/intern/reject-redemption/:id
router.post("/payouts/intern/reject-redemption/:id", authRole("superAdmin"), async (req, res) => {
  try {
    const request = await RedemptionRequest.findById(req.params.id);
    if (!request || request.status !== "Pending") {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    request.status = "Rejected";
    request.processedAt = new Date();
    await request.save();

    // Refund points to intern
    const intern = await User.findById(request.internId);
    if (intern) {
      intern.points = (intern.points || 0) + request.pointsUsed;
      await intern.save();
    }

    res.json({ success: true, message: "Redemption rejected and points refunded." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
