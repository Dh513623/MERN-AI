const dotenv = require("dotenv");
const connectDB = require("../config/db");
const GrammarExercise = require("../models/grammarSchema");
const grammarData = require("../utils/grammar_dataset.json");

// ✅ load .env from server folder
dotenv.config({ path: "../.env" });

async function seedGrammar() {
  try {
    await connectDB();

    await GrammarExercise.deleteMany({ module: "grammar" });

    await GrammarExercise.insertMany(grammarData);

    console.log("✅ Grammar dataset refreshed successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding grammar:", error.message);
    process.exit(1);
  }
}

seedGrammar();