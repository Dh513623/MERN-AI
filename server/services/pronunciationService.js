const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

exports.getPronunciation = async (audioPath, sentence) => {
  try {
    const formData = new FormData();

    formData.append("audio", fs.createReadStream(audioPath));
    formData.append("sentence", sentence);

    const response = await axios.post(
      "https://mern-ai-englishapp1.onrender.com/analyze",
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 180000
      }
    );

    return response.data;

  } catch (err) {
    console.error("❌ Pronunciation Error:", err.message);

    return {
      text: "",
      score: 5,
      phoneme_comparison: [],
      strengths: ["Pronunciation service failed"],
      weaknesses: ["Try again"]
    };
  }
};
