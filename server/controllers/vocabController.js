// const Score = require("../models/Score");
// const Vocabulary = require("../models/VocabularySchema");
// const axios = require("axios");
// const User = require("../models/User");
// const DailyTask = require("../models/DailyTask");

// const getTodayRange = () => {
//   const start = new Date();
//   start.setHours(0, 0, 0, 0);

//   const end = new Date();
//   end.setHours(23, 59, 59, 999);

//   return { start, end };
// };

// exports.getVocabulary = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // ✅ Check userId
//     if (!userId) {
//       return res.status(400).json({ message: "userId is required" });
//     }

//     const { start, end } = getTodayRange();

//     // ✅ Check already attempted today
//     const alreadyAttempted = await Score.findOne({
//       userId,
//       exercise_type: "vocabulary",
//       date: { $gte: start, $lte: end },
//     });

//     if (alreadyAttempted) {
//       return res.status(200).json({
//         success: false,
//         message: "You already attempted today. Try tomorrow.",
//       });
//     }

//     // 🎯 Function to get random word
//     const getOneWord = async (difficulty) => {
//       const result = await Vocabulary.aggregate([
//         { $match: { difficulty } },
//         { $sample: { size: 1 } },
//       ]);
//       return result[0];
//     };

//     // ✅ Get 3 words
//     const easy = await getOneWord("easy");
//     const medium = await getOneWord("medium");
//     const hard = await getOneWord("hard");

//     // ❗ Safety check
//     if (!easy || !medium || !hard) {
//       return res.status(400).json({
//         message: "Not enough words in database",
//       });
//     }

//     // ✅ Send only word field (clean response)
//     return res.status(200).json({
//       success: true,
//       words: {
//         easy: easy.word,
//         medium: medium.word,
//         hard: hard.word,
//       },
//     });
//   } catch (err) {
//     console.error("VOCAB ERROR:", err);
//     return res.status(500).json({
//       message: "Server Error",
//       error: err.message,
//     });
//   }
// };

// // ✅ Submit vocabulary test (router + scoring + DB)
// const API_KEY = process.env.HUGGINGFACE_API_KEY;

// exports.submitVocabularyTest = async (req, res) => {
//   try {
//     console.log("REQ BODY:", req.body);

//     const { userId, w1_base, w1_user, w2_base, w2_user, w3_base, w3_user } =
//       req.body;

//     if (!userId) {
//       return res.status(400).json({ message: "userId is required" });
//     }

//     const { start, end } = getTodayRange();
//     const alreadyAttempted = await Score.findOne({
//       userId,
//       exercise_type: "vocabulary",
//       date: { $gte: start, $lte: end },
//     });

//     if (alreadyAttempted) {
//       return res.status(400).json({ message: "Already submitted today" });
//     }

//     const HF_URL = "https://router.huggingface.co/v1/chat/completions";
//     const MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

//     const prompt = `You are an English vocabulary tutor helping a learner.

// User input:
// 1. Base: "${w1_base}" → User: "${w1_user || "empty"}"
// 2. Base: "${w2_base}" → User: "${w2_user || "empty"}"
// 3. Base: "${w3_base}" → User: "${w3_user || "empty"}"

// TASK:

// For EACH pair:
// STEP 1 — Evaluate USER word:

// - Compare ONLY the USER word with the BASE word
// - Decide based on MEANING (not spelling)

// IMPORTANT EXAMPLES (FOLLOW STRICTLY):

// Base: break | User: destroy → partial  
// Base: break | User: damage → partial  
// Base: notice | User: observe → partial  
// Base: easygoing | User: relaxed → partial  

// RULES:
// - If meanings are very close → "correct"
// - If meanings are related but not exact → "partial"
// - If meanings are clearly different → "wrong"
// - NEVER mark related words as "wrong"
// - Prefer "partial" over "wrong" when in doubt

// STEP 2 — Generate new_word:
// - new_word MUST be a synonym (or closely related word) of the BASE word
// - new_word MUST NOT be the same as the USER word
// - new_word MUST NOT be the BASE word
// - Always generate a DIFFERENT valid word

// STEP 3 — Example:
// - Write ONE short and simple sentence using new_word

// STEP 4 — Feedback:
// - Talk ONLY about USER word vs BASE word
// - If correct → explain similarity in meaning
// - If wrong → explain difference in meaning

// STRICT RULES:
// - DO NOT compare base with new_word
// - DO NOT explain new_word in feedback
// - ONLY evaluate USER word meaning
// - Be flexible: accept common everyday synonyms
// - Use simple English

// FINAL CHECK (VERY IMPORTANT):
// Before giving answer:
// - Ensure result is based on USER word meaning
// - Ensure new_word is different from USER word

// OUTPUT FORMAT (STRICT – NON-NEGOTIABLE):

// You are NOT allowed to write anything except a JSON array.

// HARD RULE:
// If you add any explanation, headings, or text outside JSON, your response is INVALID.

// Return ONLY a valid JSON array with EXACTLY 3 objects.

// No text before JSON.
// No text after JSON.
// No markdown.
// No explanations.
// No comments.
// No code blocks.

// The response MUST start with [ and end with ].

// Each object must follow EXACTLY this structure:

// {
//   "result": "correct" | "partial" | "wrong",
//   "new_word": "string (single word only)",
//   "example": "string (one simple sentence using new_word)",
//   "feedback": "string (ONLY compare base word vs user word)"
// }

// STRICT RULES:
// - Exactly 3 objects only (no more, no less)
// - All 3 objects must be valid JSON
// - No trailing commas allowed
// - "new_word" must be a SINGLE word only
// - "example" must use ONLY "new_word"
// - Do NOT include base word in "example"
// - "feedback" must NOT mention new_word meaning explanation
// - No extra keys allowed

// FINAL OUTPUT MUST LOOK LIKE THIS:

// [
//   {
//     "result": "correct",
//     "new_word": "sit",
//     "example": "She sits on the chair.",
//     "feedback": "User word has similar meaning to base word."
//   },
//   {
//     "result": "partial",
//     "new_word": "stay",
//     "example": "He will stay here.",
//     "feedback": "User word is related but not exact."
//   },
//   {
//     "result": "wrong",
//     "new_word": "run",
//     "example": "He runs fast.",
//     "feedback": "User word has different meaning from base word."
//   }
// ]

// REMEMBER:
// ONLY JSON ARRAY. NOTHING ELSE.
// `;

//     const hfResponse = await axios.post(
//       HF_URL,
//       {
//         model: MODEL,
//         messages: [
//           {
//             role: "user",
//             content: prompt,
//           },
//         ],
//         max_tokens: 256,
//         temperature: 0.3,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${API_KEY}`,
//           "Content-Type": "application/json",
//         },
//         timeout: 60000,
//       },
//     );

//     const aiText = hfResponse.data?.choices?.[0]?.message?.content || "";
//     console.log("AI RAW:", aiText);

//     let results;

//     try {
//       console.log("AI RAW:", aiText);

//       const start = aiText.indexOf("[");
//       const end = aiText.lastIndexOf("]");

//       if (start === -1 || end === -1) {
//         throw new Error("No JSON array found");
//       }

//       const jsonString = aiText.slice(start, end + 1);

//       console.log("CLEAN JSON:", jsonString);

//       results = JSON.parse(jsonString);
//     } catch (e) {
//       console.warn("AI JSON parse failed:", e.message);

//       results = [
//         { result: "wrong", new_word: "", example: "", feedback: "Parse error" },
//         { result: "wrong", new_word: "", example: "", feedback: "Parse error" },
//         { result: "wrong", new_word: "", example: "", feedback: "Parse error" },
//       ];
//     }
//     const TOTAL_QUESTIONS = 3;

//     // ✅ MISSING LINE (FIX)
//     const correctCount = results.filter((r) => r.result === "correct").length;

//     // scoring
//     const totalMark = (correctCount / TOTAL_QUESTIONS) * 5;

//     const finalScore = Math.min(Number((5 + totalMark).toFixed(2)), 10);
//     await Score.create({
//       userId,
//       exercise_type: "vocabulary",
//       user_input: JSON.stringify({ w1_user, w2_user, w3_user }),
//       score: finalScore, // 0–10 scale
//       strengths: correctCount >= 2 ? ["Good vocabulary"] : [],
//       weaknesses: correctCount < 2 ? ["Needs improvement"] : [],
//       improved_version: JSON.stringify(results),
//       date: new Date(),
//     });

//     await DailyTask.updateOne(
//   {
//     userId,
//     "tasks.type": "vocabulary",
//   },
//   {
//     $set: {
//       "tasks.$.completed": true,
//     },
//   }
// );
//     const allScores = await Score.find({ userId, exercise_type: "vocabulary" });
//     const total = allScores.reduce((sum, s) => sum + s.score, 0);
//     const average = Number((total / allScores.length).toFixed(2));

//     await User.findByIdAndUpdate(userId, {
//       vocabularyScore: average,
//       lastActiveDate: new Date(),
//     });

//     return res.status(200).json({
//       success: true,
//       correctAnswers: correctCount,
//       finalScore,
//       averageVocabularyScore: average,
//       results,
//     });
//   } catch (err) {
//     console.error("SUBMIT VOCAB ERROR:", err);
//     console.error("VOCAB ERROR FULL:", err.response || err);
//     return res.status(500).json({
//       message: "Server Error",
//       error: err.response?.data || err.message,
//     });
//   }

const Score = require("../models/Score");
const Vocabulary = require("../models/VocabularySchema");
const axios = require("axios");
const User = require("../models/User");
const DailyTask = require("../models/DailyTask");

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
      date: { $gte: start, $lte: end },
    });

    if (alreadyAttempted) {
      return res.status(200).json({
        success: false,
        message: "You already attempted today. Try tomorrow.",
      });
    }

    // 🎯 Function to get random word
    const getOneWord = async (difficulty) => {
      const result = await Vocabulary.aggregate([
        { $match: { difficulty } },
        { $sample: { size: 1 } },
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
        message: "Not enough words in database",
      });
    }

    // ✅ Send only word field (clean response)
    return res.status(200).json({
      success: true,
      words: {
        easy: easy.word,
        medium: medium.word,
        hard: hard.word,
      },
    });
  } catch (err) {
    console.error("VOCAB ERROR:", err);
    return res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};

// ✅ Submit vocabulary test (router + scoring + DB)
const API_KEY = process.env.HUGGINGFACE_API_KEY;

// Weighted scoring: correct = full credit, partial = half credit, wrong = none
const RESULT_WEIGHTS = { correct: 1, partial: 0.5, wrong: 0 };
const TOTAL_QUESTIONS = 3;

// Local fallback used only if AI call fails / times out / returns bad JSON
const buildFallbackResults = (pairs) =>
  pairs.map(({ base, user }) => {
    const b = (base || "").trim().toLowerCase();
    const u = (user || "").trim().toLowerCase();

    let result = "wrong";
    if (u && u === b) {
      result = "correct";
    } else if (u && b && (u.includes(b) || b.includes(u))) {
      // crude relatedness check (substring match) as a last-resort signal
      result = "partial";
    }

    return {
      result,
      new_word: base || "",
      example: "",
      feedback:
        result === "correct"
          ? "User word matches the base word."
          : result === "partial"
          ? "User word may be related to the base word."
          : "Could not verify meaning automatically.",
    };
  });

exports.submitVocabularyTest = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const { userId, w1_base, w1_user, w2_base, w2_user, w3_base, w3_user } =
      req.body;

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

    const pairs = [
      { base: w1_base, user: w1_user },
      { base: w2_base, user: w2_user },
      { base: w3_base, user: w3_user },
    ];

    const HF_URL = "https://router.huggingface.co/v1/chat/completions";
    const MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

    const prompt = `You are an English vocabulary evaluator. Compare each USER word to the BASE word by MEANING only (ignore spelling).

Pairs:
1. Base: "${w1_base}" | User: "${w1_user || "empty"}"
2. Base: "${w2_base}" | User: "${w2_user || "empty"}"
3. Base: "${w3_base}" | User: "${w3_user || "empty"}"

Rules for "result":
- "correct" -> same or near-identical meaning, OR user word is exactly the same as base word
- "partial" -> related meaning but not exact (e.g. break/damage, notice/observe, easygoing/relaxed)
- "wrong" -> clearly unrelated or empty
- Prefer "partial" over "wrong" when unsure. NEVER mark related words as "wrong".

For each pair also generate:
- "new_word": EXACTLY ONE word (no phrases, no spaces, no "in lieu of" style multi-word answers), a synonym of BASE, must NOT equal USER word or BASE word
- "example": one simple sentence using ONLY new_word (do not use base or user word)
- "feedback": one short sentence comparing USER word's meaning to BASE word only (do not explain new_word)

Return ONLY a JSON array of exactly 3 objects. No markdown, no extra text, no code fences.
Format exactly like this:
[{"result":"correct","new_word":"word","example":"sentence","feedback":"sentence"},{"result":"partial","new_word":"word","example":"sentence","feedback":"sentence"},{"result":"wrong","new_word":"word","example":"sentence","feedback":"sentence"}]`;

    let results;

    try {
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
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 20000, // ⏱ shorter timeout for a real-time feel
        }
      );

      const aiText = hfResponse.data?.choices?.[0]?.message?.content || "";
      console.log("AI RAW:", aiText);

      const jsonStart = aiText.indexOf("[");
      const jsonEnd = aiText.lastIndexOf("]");

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No JSON array found");
      }

      const jsonString = aiText.slice(jsonStart, jsonEnd + 1);
      console.log("CLEAN JSON:", jsonString);

      const parsed = JSON.parse(jsonString);

      // ✅ Validate shape: must be array of exactly 3 valid objects
      if (
        !Array.isArray(parsed) ||
        parsed.length !== 3 ||
        parsed.some(
          (r) =>
            !r ||
            typeof r !== "object" ||
            !["correct", "partial", "wrong"].includes(r.result)
        )
      ) {
        throw new Error("AI response failed shape validation");
      }

      results = parsed;
    } catch (e) {
      console.warn("AI evaluation failed, using local fallback:", e.message);
      results = buildFallbackResults(pairs);
    }

    // ✅ Safety net: ensure new_word is a real single word, and never
    // equals the base or user word
    const isSingleWord = (w) =>
      typeof w === "string" && /^[a-zA-Z'-]+$/.test(w.trim());

    results = results.map((r, i) => {
      const base = (pairs[i].base || "").trim().toLowerCase();
      const user = (pairs[i].user || "").trim().toLowerCase();
      const newWord = (r.new_word || "").trim();
      const newWordLower = newWord.toLowerCase();

      const invalid =
        !newWord ||
        !isSingleWord(newWord) || // rejects phrases like "in lieu of"
        newWordLower === base ||
        newWordLower === user;

      if (invalid) {
        return { ...r, new_word: pairs[i].base || "" };
      }
      return r;
    });

    // ✅ Weighted scoring: correct = 1, partial = 0.5, wrong = 0
    const weightedScore = results.reduce(
      (sum, r) => sum + (RESULT_WEIGHTS[r.result] ?? 0),
      0
    );

    const correctCount = results.filter((r) => r.result === "correct").length;
    const partialCount = results.filter((r) => r.result === "partial").length;
    const wrongCount = results.filter((r) => r.result === "wrong").length;

    // Scale weighted score (0..TOTAL_QUESTIONS) onto a 0–10 scale
    const finalScore = Number(
      ((weightedScore / TOTAL_QUESTIONS) * 10).toFixed(2)
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

    await DailyTask.updateOne(
      {
        userId,
        "tasks.type": "vocabulary",
      },
      {
        $set: {
          "tasks.$.completed": true,
        },
      }
    );

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
      partialAnswers: partialCount,
      wrongAnswers: wrongCount,
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
