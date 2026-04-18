const { getProgressByModule } = require("../utils/progressUtils");

const { computeUserProgress } = require("../services/progressService");
const { updateStreak } = require("../services/streakService");

const { getWeeklyData } = require("../utils/weeklyUtils");

exports.updateUserStreak = async (req, res) => {
  try {
    const user = await updateStreak(req.params.userId);
    res.json(user);
  } catch (err) {
    console.error("STREAK ERROR:", err);  // 🔥 ADD THIS
    res.status(500).json({ message: err.message });
  }
};



const PDFDocument = require("pdfkit");
const User = require("../models/User");

exports.downloadReport = async (req, res) => {
  try {
    const userId = req.params.userId;

    // 🔥 Get user details
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 Get progress data
    const grammar = await getProgressByModule(userId, "grammar");
    const vocabulary = await getProgressByModule(userId, "vocabulary");
    const pronunciation = await getProgressByModule(userId, "pronunciation");
    const speaking = await getProgressByModule(userId, "speaking");
const fluency = await getProgressByModule(userId, "fluency");

    const getAvg = (data) => {
      if (!data.length) return 0;
      const total = data.reduce((sum, d) => sum + d.avgScore, 0);
      return Math.round(total / data.length);
    };

    const report = {
      grammar: getAvg(grammar),
      vocabulary: getAvg(vocabulary),
      pronunciation: getAvg(pronunciation),
      speaking: getAvg(speaking),
  fluency: getAvg(fluency)
    };

    // 📄 Create PDF
    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=report.pdf");

    doc.pipe(res);

    // 📝 Title
    doc.fontSize(20).text("User Progress Report", { align: "center" });
    doc.moveDown();

    // 👤 USER DETAILS 🔥
    doc.fontSize(14).text("User Details:");
    doc.text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Level: ${user.level}`);
    doc.text(`Daily Streak: ${user.dailyStreak}`);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`);

    doc.moveDown();

    // 📊 Overall Scores
    doc.text("Overall Performance:");
    doc.text(`Grammar: ${report.grammar}/10`);
    doc.text(`Vocabulary: ${report.vocabulary}/10`);
    doc.text(`Pronunciation: ${report.pronunciation}/10`);
    doc.text(`Speaking: ${report.speaking}/10`);
doc.text(`Fluency: ${report.fluency}/10`);

    doc.moveDown();

    // 📈 Detailed Progress
    doc.text("Grammar Progress:");
    grammar.forEach(g => {
      doc.text(`${g.date} → ${g.avgScore}`);
    });

    doc.moveDown();

    doc.text("Pronunciation Progress:");
    pronunciation.forEach(p => {
      doc.text(`${p.date} → ${p.avgScore}`);
    });

    doc.moveDown();

    doc.text("Vocabulary Progress:");
    vocabulary.forEach(v => {
      doc.text(`${v.date} → ${v.avgScore}`);
    });

    doc.moveDown();

    // 💡 Simple Insights (BONUS 🔥)
    doc.text("Insights:");
    
    if (report.grammar >= 7) doc.text("✅ Strong in Grammar");
    else doc.text("⚠️ Improve Grammar");

    if (report.pronunciation >= 7) doc.text("✅ Good Pronunciation");
    else doc.text("⚠️ Practice Pronunciation");

    if (report.vocabulary >= 7) doc.text("✅ Strong Vocabulary");
    else doc.text("⚠️ Improve Vocabulary");

    if (report.speaking >= 7) doc.text("✅ Strong in Speaking");
else doc.text("⚠️ Improve Speaking");

if (report.fluency >= 7) doc.text("✅ Good Fluency");
else doc.text("⚠️ Improve Fluency");

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "PDF generation failed" });
  }
};

exports.getFullReport = async (req, res) => {
  try {
    const userId = req.params.userId;

    const grammar = await getProgressByModule(userId, "grammar");
    const vocabulary = await getProgressByModule(userId, "vocabulary");
    const pronunciation = await getProgressByModule(userId, "pronunciation");
    const speaking = await getProgressByModule(userId, "speaking");
    const fluency = await getProgressByModule(userId, "fluency");

    const gWeek = getWeeklyData(grammar, "grammar");
    const vWeek = getWeeklyData(vocabulary, "vocabulary");
    const pWeek = getWeeklyData(pronunciation, "pronunciation");
    const sWeek = getWeeklyData(speaking, "speaking");
    const fWeek = getWeeklyData(fluency, "fluency");

    // 🔥 Merge all modules into single weekly array
    const weekly = gWeek.map((dayData, i) => ({
      day: dayData.day,
      grammar: dayData.grammar,
      vocabulary: vWeek[i].vocabulary,
      pronunciation: pWeek[i].pronunciation,
      speaking: sWeek[i].speaking,
      fluency: fWeek[i].fluency,
    }));

    // existing overall report
    const report = await computeUserProgress(userId);

    res.json({
      ...report,
      weekly   // 🔥 THIS is what frontend needs
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

