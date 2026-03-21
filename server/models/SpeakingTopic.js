const mongoose = require('mongoose');

const speakingTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  cuePoints: {
    type: [String],
    default: []
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('SpeakingTopic', speakingTopicSchema);