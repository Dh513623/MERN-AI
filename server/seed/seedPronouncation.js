const dotenv = require("dotenv");
const connectDB = require("../config/db");
const Sentence = require("../models/PronounciationSchema");
const sentenceData = require("../utils/pronouncation.json");
 
// load .env
dotenv.config({ path: "../.env" });

async function seedSentences() {
  try {

    await connectDB();

    // remove old sentences
    await Sentence.deleteMany({});

    // insert new dataset
    await Sentence.insertMany(sentenceData);

    console.log("✅ Sentence dataset inserted successfully!");

    process.exit();

  } catch (error) {

    console.error("❌ Error seeding sentences:", error.message);

    process.exit(1);
  }
}

seedSentences();