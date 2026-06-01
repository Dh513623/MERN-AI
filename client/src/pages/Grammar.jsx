import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getDailyGrammarTest,
  submitGrammarTest,
} from "../services/grammarService";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorAlert from "../components/ui/ErrorAlert";
import ScoreRing from "../components/ui/ScoreRing";
import {
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { completeTask } from "../services/dailyTaskService";


export default function Grammar() {
  const location = useLocation();
  const dailyTask = location.state?.task;
  const fromDailyTask = location.state?.fromDailyTask;
  console.log("DAILY TASK FULL:", dailyTask);

  const { user } = useAuth();
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);


  const navigate = useNavigate();

const handleBack = async () => {
  try {
    if (dailyTask?._id) {
      await completeTask(dailyTask._id);
    }
  } catch (err) {
    console.log("completeTask error ignored:", err?.response?.data);
  }

  navigate("/daily-tasks", {
    state: { refresh: true },
    replace: true,
  });
};

  const startTest = async () => {
    setError("");
    setLoading(true);

    try {
      // ✅ DAILY TASK FLOW (NO API CALL)
      if (fromDailyTask) {
  const questionsData = dailyTask?.exercise?.questions || [];

  if (!questionsData.length) {
    setError("No questions found in Daily Task");
    return;
  }

  const formatted = questionsData.map((q) => ({
    _id: q._id,
    type: q.type,
    question: q.question,
    options: q.options || [],
  }));

  setQuestions(formatted);
  setStarted(true);
  return;
}

      // ✅ NORMAL FLOW (API CALL)
      const res = await getDailyGrammarTest(user._id);
      setQuestions(res.data.questions);
      setStarted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load test");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (fromDailyTask) {
      startTest();
    }
  }, []);
  const handleAnswer = (qId, value) => {
    setAnswers({ ...answers, [qId]: value });
  };

  const handleSubmit = async () => {

  setError("");
  setSubmitting(true);

  try {
    if (questions.length === 0) {
      setError("No questions to submit");
      return;
    }

    if (questions.length !== 15) {
      setError(`Expected 15 questions but got ${questions.length}`);
      return;
    }

    if (alreadySubmitted) {
  setError("You already submitted today's grammar test");
  return;
}
    const formattedAnswers = questions.map((q) => ({
      questionId: q._id,
      user_input: answers[q._id] || "",
    }));

    const res = await submitGrammarTest({
      userId: user._id,
      answers: formattedAnswers,
    });

    setResult(res.data);
  } catch (err) {
    setError(err.response?.data?.message || "Submission failed");
  } finally {
    setSubmitting(false);
  }
};

  const getTypeLabel = (type) => {
    const labels = {
      fill_blank: "Fill in the Blank",
      error_correction: "Error Correction",
      rearrange: "Rearrange Words",
    };
    return labels[type] || type;
  };

  const getTypeBadge = (type) => {
    const colors = {
      fill_blank: "badge-primary",
      error_correction: "badge-warning",
      rearrange: "badge-success",
    };
    return colors[type] || "badge-primary";
  };

  // Results view
  if (result) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="glass-card p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Test Complete! 🎉
          </h1>
          <p className="text-dark-400">
            Here's how you did on today's grammar test
          </p>

          <div className="flex justify-center gap-8 mt-8">
            <ScoreRing score={result.finalScore} label="Score" />
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {result.correctAnswers}
              </span>
              <span className="text-sm text-dark-400">/ 15 Correct</span>
            </div>
            <ScoreRing score={result.averageGrammarScore} label="Average" />
          </div>
        </div>

        {result.resultDetails && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              Detailed Results
            </h2>
            {result.resultDetails.map((item, i) => (
              <div
                key={i}
                className={`glass-card p-5 border-l-4 ${item.isCorrect ? "border-l-emerald-500" : "border-l-red-500"}`}
              >
                <div className="flex items-start gap-3">
                  {item.isCorrect ? (
                    <HiOutlineCheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <HiOutlineXCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.question}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <span className="text-dark-400">
                        Your answer:{" "}
                        <span
                          className={
                            item.isCorrect ? "text-emerald-400" : "text-red-400"
                          }
                        >
                          {item.userAnswer || "(blank)"}
                        </span>
                      </span>
                      {!item.isCorrect && (
                        <span className="text-dark-400">
                          Correct:{" "}
                          <span className="text-emerald-400">
                            {item.correctAnswer}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            setResult(null);
            setStarted(false);
            setAnswers({});
            setQuestions([]);
          }}
          className="btn-secondary"
        >
          Back to Grammar
        </button>

        {fromDailyTask && (
  <div className="flex justify-end pt-6 border-t border-dark-700 mt-6">
    <button
      onClick={handleBack}
      className="btn-primary px-6 py-2 rounded-xl flex items-center gap-2"
    >
      ← Back to Daily Tasks
    </button>
  </div>
)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <HiOutlineAcademicCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {fromDailyTask ? "Grammar Task" : "Grammar Test"}
          </h1>
          <p className="text-dark-400">
            Daily grammar exercises to improve your skills
          </p>
        </div>
      </div>

      {error && (
        <ErrorAlert message={error} onRetry={started ? undefined : startTest} />
      )}

      {!started && !loading && !fromDailyTask && (
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Ready for Today's Grammar Test?
          </h2>
          <p className="text-dark-400 mb-6">
            15 questions: Fill in blanks, Error correction, and Rearranging
            words
          </p>
          <button onClick={startTest} className="btn-primary">
            Start Test
          </button>
        </div>
      )}

      {loading && <LoadingSpinner text="Loading questions..." />}

      {started && questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div
              key={q._id}
              className="glass-card p-6 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm font-bold">
                  {i + 1}
                </span>
                <span className={`${getTypeBadge(q.type)}`}>
                  {getTypeLabel(q.type)}
                </span>
              </div>
              <p className="text-white font-medium mb-4">
                {typeof q.question === "string"
  ? q.question
  : Array.isArray(q.question)
    ? q.question.join(" ")
    : ""}
              </p>

              {q.options && q.options.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => handleAnswer(q._id, opt)}
                      className={`p-3 rounded-xl text-left text-sm font-medium transition-all duration-200 border
                        ${
                          answers[q._id] === opt
                            ? "border-primary-500 bg-primary-500/15 text-primary-300"
                            : "border-dark-600 bg-dark-800 text-dark-200 hover:border-dark-500"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[q._id] || ""}
                  onChange={(e) => handleAnswer(q._id, e.target.value)}
                  className="input-field"
                  placeholder="Type your answer..."
                />
              )}
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                `Submit Test (${Object.keys(answers).length}/${questions.length})`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
