const mongoose = require("mongoose");

const vocabularySchema = new mongoose.Schema({
  word: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true
  }
});

module.exports = mongoose.model("Vocabulary", vocabularySchema);
