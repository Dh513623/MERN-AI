const mongoose = require('mongoose');

const sentenceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["starter", "simple", "repetition"],
    required: true
  },
  text: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('FluencySentence', sentenceSchema);