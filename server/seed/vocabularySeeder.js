const dotenv = require("dotenv");
const connectDB = require("../config/db");
const Vocabulary = require("../models/VocabularySchema");
const vocabData = require("../utils/vocabulary.json");

// load env
dotenv.config({ path: "../.env" });

async function seedVocabulary() {
  try {
    await connectDB();

    // delete old data
    await Vocabulary.deleteMany({});

    // insert new data
    await Vocabulary.insertMany(vocabData);

    console.log("✅ Vocabulary dataset inserted successfully!");

    process.exit();
  } catch (error) {
    console.error("❌ Error seeding vocabulary:", error.message);
    process.exit(1);
  }
}

seedVocabulary();