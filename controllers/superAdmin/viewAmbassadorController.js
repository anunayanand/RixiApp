const Ambassador = require("../../models/Ambassador");
const asyncHandler = require('../../utils/asyncHandler');

// SuperAdmin view of a specific Ambassador
exports.viewAmbassador = asyncHandler(async (req, res) => {
  const ambassador = await Ambassador.findById(req.params.ambassadorId);
  if (!ambassador || ambassador.role !== "ambassador") {
    req.flash("error", "Ambassador not found");
    return res.redirect("/superAdmin");
  }

  // Fetch interns referred by this ambassador
  // Assuming User schema has a field storing the referralId used during registration
  const referredInterns = ambassador.referred_interns || [];

  // Fetch other useful info if needed
  const totalReferred = ambassador.internCount;
  const earnings = ambassador.total_earnings || 0;

  // Calculate withdrawal stats
  const withdrawals = ambassador.withdrawals || [];
  const totalWithdrawn = withdrawals
    .filter(w => w.status !== "Rejected")
    .reduce((sum, w) => sum + w.amount, 0);
  const availableBalance = Math.max(0, earnings - totalWithdrawn);

  const badge = ambassador.badge;
  const leaderboard = await Ambassador.find({}, { name: 1, email: 1, internCount: 1, _id: 0 })
      .sort({ internCount: -1 })
      .lean();
  const showPasswordPopup = false;
  req.flash('info', `Viewing Ambassador: ${ambassador.name}`);
  res.render("ambassador", { 
    ambassador, 
    totalReferred ,
    referredInterns,
    earnings, 
    availableBalance,
    totalWithdrawn,
    badge ,
    leaderboard,
    showPasswordPopup,
    bronzeMail: ambassador.bronze_mail_sent,
    silverMail: ambassador.silver_mail_sent,
    goldMail: ambassador.gold_mail_sent
  });
});
