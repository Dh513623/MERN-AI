const mongoose = require('mongoose');

const sentenceSchema = new mongoose.Schema({
  type: { type: String, required: true },   // starter, simple, repetition sentences
  text: { type: String, required: true }
});

module.exports = mongoose.model('FluencySentence', sentenceSchema);