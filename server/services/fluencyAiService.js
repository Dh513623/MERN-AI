require("dotenv").config();
const axios = require("axios");

// 🔥 Hugging Face Chat API
const HF_URL = "https://router.huggingface.co/v1/chat/completions";

// 🔥 LLaMA Model (make sure you have access)
const MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

exports.evaluateFluency = async (userAnswer) => {
  try {
    // 🧠 Prompt (like your friend's structured style)
    const prompt = `
You are an English fluency evaluator helping a learner improve writing. Be encouraging and clear.

User paragraph:
"${userAnswer}"

Instructions:
- Evaluate overall fluency, grammar, clarity, and sentence structure.
- Give a score from 0 to 10.
- Identify 2–3 strengths.
- Identify 2–3 weaknesses.
- Rewrite the paragraph in a more fluent and natural way.

Important:
- Keep feedback simple and easy to understand.
- Do not use complex words.
- Be helpful and friendly.
- Output ONLY valid JSON.

Output format:
{
  "score": number (0-10),
  "strengths": ["point1", "point2"],
  "weaknesses": ["point1", "point2"],
  "improved_version": "corrected paragraph"
}
`;

    // 🤖 API Call
    const response = await axios.post(
      HF_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let output = response.data?.choices?.[0]?.message?.content || "";
    output = output.trim();

    // 🔍 Extract JSON safely
    const match = output.match(/\{[\s\S]*\}/);

    let parsed;

    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = null;
      }
    }

    // ⚠️ Fallback if JSON fails
    if (!parsed) {
      console.log("⚠️ JSON parsing failed, using fallback");

      parsed = {
        score: 6,
        strengths: ["Basic idea is understandable"],
        weaknesses: ["Grammar mistakes present"],
        improved_version: output || userAnswer,
      };
    }

    // 🔥 Normalize score (0–10)
    let score = parsed.score;

    if (score > 10) score = Math.round(score / 10);
    if (score < 0) score = 0;
    if (score > 10) score = 10;

    // ✅ Final response (controller-safe)
    return {
      score: score ?? 5,
      strengths: parsed.strengths || ["Moderate fluency"],
      weaknesses: parsed.weaknesses || ["Needs improvement"],
      improved_version: parsed.improved_version || userAnswer,
    };

  } catch (err) {
    console.error("🔥 HF LLaMA Error:", err.response?.data || err.message);

    // 🚑 fallback if API fails
    return {
      score: 5,
      strengths: ["Basic fluency detected"],
      weaknesses: ["AI service failed"],
      improved_version: userAnswer,
    };
  }
};