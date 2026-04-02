
const axios = require("axios");

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

exports.evaluateSpeaking = async (userAnswer, topicObj) => {

  try {
    const { title, cuePoints = [] } = topicObj;

    const prompt = `
You are an English speaking evaluator.

The user was asked to speak on the following topic:
Title: "${title}"
Cue points: ${cuePoints.join(", ")}

Evaluate how well the following response answers the topic:

"${userAnswer}"

Give scores from 0 to 10 for:
1. Grammar
2. Fluency
3. Vocabulary
4. Pronunciation (based on clarity of speech)
5. Confidence (based on fluency, hesitation, and natural expression)

Also provide:
- 2 strengths
- 2 weaknesses
- Improved version

Return ONLY JSON:

{
  "grammarScore": number,
  "fluencyScore": number,
  "vocabularyScore": number,
  "pronunciationScore": number,
  "confidenceScore": number,
  "overallScore": number,
  "strengths": ["", ""],
  "weaknesses": ["", ""],
  "improved_version": ""
}
`;

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
        temperature: 0.3,
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

    const match = output.match(/\{[\s\S]*\}/);

    let parsed = null;

    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      return {
        grammarScore: 6,
        fluencyScore: 6,
        vocabularyScore: 6,
        pronunciationScore: 6,
        confidenceScore:6,
        overallScore: 6,
        strengths: ["Good attempt"],
        weaknesses: ["Needs improvement"],
        improved_version: userAnswer,
      };
    }

    const normalize = (val) => {
      if (!val) return 5;
      if (val > 10) return Math.round(val / 10);
      if (val < 0) return 0;
      return val;
    };

    const grammarScore = normalize(parsed.grammarScore);
    const fluencyScore = normalize(parsed.fluencyScore);
    const vocabularyScore = normalize(parsed.vocabularyScore);
    const pronunciationScore = normalize(parsed.pronunciationScore);
    const confidenceScore=normalize(parsed.confidenceScore);

    let overallScore =
      parsed.overallScore ??
      (grammarScore + fluencyScore + vocabularyScore + pronunciationScore+confidenceScore) / 5;

    overallScore = Number(overallScore.toFixed(2));

    return {
      grammarScore,
      fluencyScore,
      vocabularyScore,
      pronunciationScore,
      confidenceScore,
      overallScore,
      strengths: parsed.strengths || ["Good attempt"],
      weaknesses: parsed.weaknesses || ["Needs improvement"],
      improved_version: parsed.improved_version || userAnswer,
    };

  } catch (err) {
    console.error("AI Speaking Error:", err.message);

    return {
      grammarScore: 5,
      fluencyScore: 5,
      vocabularyScore: 5,
      pronunciationScore: 5,
      confidenceScore:5,
      overallScore: 5,
      strengths: ["Basic attempt"],
      weaknesses: ["AI service failed"],
      improved_version: userAnswer,
    };
  }
};