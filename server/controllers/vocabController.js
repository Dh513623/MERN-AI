

const Score = require("../models/Score");
const Vocabulary = require("../models/VocabularySchema");
const axios = require("axios");
const User = require("../models/User");

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

exports.getVocabulary = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Check userId
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const { start, end } = getTodayRange();

    // ✅ Check already attempted today
    const alreadyAttempted = await Score.findOne({
      userId,
      exercise_type: "vocabulary",
      date: { $gte: start, $lte: end }
    });

    if (alreadyAttempted) {
      return res.status(200).json({
        success: false,
        message: "You already attempted today. Try tomorrow."
      });
    }

    // 🎯 Function to get random word
    const getOneWord = async (difficulty) => {
      const result = await Vocabulary.aggregate([
        { $match: { difficulty } },
        { $sample: { size: 1 } }
      ]);
      return result[0];
    };

    // ✅ Get 3 words
    const easy = await getOneWord("easy");
    const medium = await getOneWord("medium");
    const hard = await getOneWord("hard");

    // ❗ Safety check
    if (!easy || !medium || !hard) {
      return res.status(400).json({
        message: "Not enough words in database"
      });
    }

    // ✅ Send only word field (clean response) 
    return res.status(200).json({
      success: true,
      words: {
        easy: easy.word,
        medium: medium.word,
        hard: hard.word
      }
    });

  } catch (err) {
    console.error("VOCAB ERROR:", err);
    return res.status(500).json({
      message: "Server Error",
      error: err.message
    });
  }
};


// ✅ Submit vocabulary test (router + scoring + DB)
const API_KEY = process.env.HF_API_KEY;

exports.submitVocabularyTest = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const {
      userId,
      w1_base,
      w1_user,
      w2_base,
      w2_user,
      w3_base,
      w3_user,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const { start, end } = getTodayRange();
    const alreadyAttempted = await Score.findOne({
      userId,
      exercise_type: "vocabulary",
      date: { $gte: start, $lte: end },
    });

    if (alreadyAttempted) {
      return res.status(400).json({ message: "Already submitted today" });
    }

    const HF_URL = "https://router.huggingface.co/v1/chat/completions";
    const MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";
    

    const prompt = `You are an English vocabulary tutor helping a learner.

User input:
1. Base: "${w1_base}" → User: "${w1_user || "empty"}"
2. Base: "${w2_base}" → User: "${w2_user || "empty"}"
3. Base: "${w3_base}" → User: "${w3_user || "empty"}"

TASK:

For EACH pair:
STEP 1 — Evaluate USER word:

- Compare ONLY the USER word with the BASE word
- Decide based on MEANING (not spelling)

IMPORTANT EXAMPLES (FOLLOW STRICTLY):

Base: break | User: destroy → partial  
Base: break | User: damage → partial  
Base: notice | User: observe → partial  
Base: easygoing | User: relaxed → partial  

RULES:
- If meanings are very close → "correct"
- If meanings are related but not exact → "partial"
- If meanings are clearly different → "wrong"
- NEVER mark related words as "wrong"
- Prefer "partial" over "wrong" when in doubt

STEP 2 — Generate new_word:
- new_word MUST be a synonym (or closely related word) of the BASE word
- new_word MUST NOT be the same as the USER word
- new_word MUST NOT be the BASE word
- Always generate a DIFFERENT valid word

STEP 3 — Example:
- Write ONE short and simple sentence using new_word

STEP 4 — Feedback:
- Talk ONLY about USER word vs BASE word
- If correct → explain similarity in meaning
- If wrong → explain difference in meaning

STRICT RULES:
- DO NOT compare base with new_word
- DO NOT explain new_word in feedback
- ONLY evaluate USER word meaning
- Be flexible: accept common everyday synonyms
- Use simple English

FINAL CHECK (VERY IMPORTANT):
Before giving answer:
- Ensure result is based on USER word meaning
- Ensure new_word is different from USER word

OUTPUT ONLY JSON:
[
  {
    "result": "correct|wrong",
    "new_word": "a different synonym of base",
    "example": "simple sentence using new_word",
    "feedback": "short explanation about USER word"
  }
]
`;


    const hfResponse = await axios.post(
      HF_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 256,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const aiText = hfResponse.data?.choices?.[0]?.message?.content || "";
    console.log("AI RAW:", aiText);

    let results;
    try {
      const startIdx = aiText.indexOf("[");
      const endIdx = aiText.lastIndexOf("]") + 1;
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonString = aiText.substring(startIdx, endIdx);
        results = JSON.parse(jsonString);
      } else {
        throw new Error("JSON not found in AI response");
      }
    } catch (e) {
      console.warn("AI JSON parse failed, using default results:", e.message);
      results = [
        {
          result: "wrong",
          new_word: "",
          example: "",
          feedback: "Could not parse AI response.",
        },
        {
          result: "wrong",
          new_word: "",
          example: "",
          feedback: "Could not parse AI response.",
        },
        {
          result: "wrong",
          new_word: "",
          example: "",
          feedback: "Could not parse AI response.",
        },
      ];
    }// after AI parsing success/fallback
const TOTAL_QUESTIONS = 3;

// ✅ MISSING LINE (FIX)
const correctCount = results.filter(
  (r) => r.result === "correct"
).length;

// scoring
const totalMark = (correctCount / TOTAL_QUESTIONS) * 5;

const finalScore = Math.min(
  Number((5 + totalMark).toFixed(2)),
  10
);
    await Score.create({
      userId,
      exercise_type: "vocabulary",
      user_input: JSON.stringify({ w1_user, w2_user, w3_user }),
      score: finalScore, // 0–10 scale
      strengths: correctCount >= 2 ? ["Good vocabulary"] : [],
      weaknesses: correctCount < 2 ? ["Needs improvement"] : [],
      improved_version: JSON.stringify(results),
      date: new Date(),
    });

    const allScores = await Score.find({ userId, exercise_type: "vocabulary" });
    const total = allScores.reduce((sum, s) => sum + s.score, 0);
    const average = Number((total / allScores.length).toFixed(2));

    await User.findByIdAndUpdate(userId, {
      vocabularyScore: average,
      lastActiveDate: new Date(),
    });

    return res.status(200).json({
      success: true,
      correctAnswers: correctCount,
      finalScore,
      averageVocabularyScore: average,
      results,
    });
  } catch (err) {
    console.error("SUBMIT VOCAB ERROR:", err);
    console.error("VOCAB ERROR FULL:", err.response || err);
    return res.status(500).json({
      message: "Server Error",
      error: err.response?.data || err.message,
    });
  }
};
