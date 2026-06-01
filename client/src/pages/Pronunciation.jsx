import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getPronunciationSentences,
  analyzePronunciation,
} from "../services/pronunciationService";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { convertToWav } from "../utils/audioConverter";
import ErrorAlert from "../components/ui/ErrorAlert";
import ScoreRing from "../components/ui/ScoreRing";
import { useLocation } from "react-router-dom";
import {
  HiOutlineMicrophone,
  HiOutlineSpeakerWave,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

export default function Pronunciation() {
  const location = useLocation();
  const navigate = useNavigate();
  const dailyTask = location.state?.task;
  const isDailyTask = location.state?.source === "daily";
  const [sentences, setSentences] = useState(null);
  const [currentDifficulty, setCurrentDifficulty] = useState("easy");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);

  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();
  const { speak, isSpeaking } = useTextToSpeech();

  const { user } = useAuth();

  useEffect(() => {
    fetchSentences();
  }, []);

  const fetchSentences = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPronunciationSentences(user._id);
      if (res.data.success === false) {
        setBlocked(true);
        setError(res.data.message);
      } else {
        setSentences(res.data.sentences);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sentences");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSentence = () => {
    if (dailyTask?.exercise?.text) {
      return dailyTask.exercise.text;
    }

    if (!sentences) return "";
    return sentences[currentDifficulty]?.text || "";
  };

  const handleEvaluate = async () => {
    if (!audioBlob) return;

    setEvaluating(true);
    setError("");

    try {
      const taskId = dailyTask?._id || sentences?.[currentDifficulty]?.taskId;

      const formData = new FormData();

      // ✅ IMPORTANT: always send Blob directly
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("userId", user._id);
      formData.append("sentence", getCurrentSentence());
      formData.append("taskId", taskId);
      formData.append("source", location.state?.source || "practice");

      console.log("SENTENCE:", getCurrentSentence());
      console.log("TASK ID:", taskId);

      const res = await analyzePronunciation(formData);

      console.log("FULL RESPONSE:", res.data);

      if (
        res.data.allowSubmit === false &&
        res.data.message === "You already completed today's 3 exercises"
      ) {
        setError(res.data.message);
        console.log("ERROR STATE:", error);
        console.log("RESULT STATE:", result);
        setResult(null);
        return;
      }

      setResult(res.data);

      if (res.data.score !== undefined) {
        setTimeout(() => speak(getCurrentSentence()), 500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };
  const handleNext = () => {
    const order = ["easy", "medium", "hard"];
    const idx = order.indexOf(currentDifficulty);
    if (idx < 2) {
      setCurrentDifficulty(order[idx + 1]);
      setResult(null);
      resetRecording();
    }
  };

  const difficultyConfig = {
    easy: { label: "Easy", color: "badge-success", ring: "ring-emerald-500" },
    medium: { label: "Medium", color: "badge-warning", ring: "ring-amber-500" },
    hard: { label: "Hard", color: "badge-danger", ring: "ring-red-500" },
  };

  if (loading)
    return <LoadingSpinner text="Loading pronunciation exercise..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
          <HiOutlineMicrophone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Pronunciation Practice
          </h1>
          <p className="text-dark-400">
            Read the sentence aloud and get instant feedback
          </p>
        </div>
      </div>

      {error && (
        <ErrorAlert
          message={error}
          onRetry={blocked ? undefined : fetchSentences}
        />
      )}

      {!blocked && sentences && (
        <>
          {/* Difficulty tabs */}
          <div className="flex gap-2">
            {["easy", "medium", "hard"].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setCurrentDifficulty(d);
                  setResult(null);
                  resetRecording();
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                  ${
                    currentDifficulty === d
                      ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                      : "text-dark-400 hover:bg-dark-800"
                  }`}
              >
                {difficultyConfig[d].label}
              </button>
            ))}
          </div>

          {/* Sentence card */}
          <div className="glass-card p-8 text-center">
            <span
              className={`${difficultyConfig[currentDifficulty].color} mb-4 inline-block`}
            >
              {difficultyConfig[currentDifficulty].label}
            </span>
            <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed mt-4 mb-6">
              "{getCurrentSentence()}"
            </p>

            {/* Listen button */}
            <button
              onClick={() => speak(getCurrentSentence())}
              disabled={isSpeaking}
              className="btn-secondary mx-auto flex items-center gap-2 mb-8"
            >
              <HiOutlineSpeakerWave
                className={`w-5 h-5 ${isSpeaking ? "animate-pulse" : ""}`}
              />
              {isSpeaking ? "Speaking..." : "🔊 Listen"}
            </button>

            {/* Record button */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={isRecording ? "mic-btn-recording" : "mic-btn"}
              >
                <HiOutlineMicrophone className="w-7 h-7" />
              </button>
              <p className="text-sm text-dark-400">
                {isRecording
                  ? "Recording... Click to stop"
                  : audioBlob
                    ? "Recording captured! Submit to evaluate."
                    : "Tap to start recording"}
              </p>

              {audioBlob && !result && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      resetRecording();
                    }}
                    className="btn-secondary text-sm"
                  >
                    <HiOutlineArrowPath className="w-4 h-4 inline mr-1" />{" "}
                    Re-record
                  </button>
                  <button
                    onClick={handleEvaluate}
                    disabled={evaluating}
                    className="btn-primary text-sm"
                  >
                    {evaluating ? "Evaluating..." : "Submit"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="glass-card p-6 space-y-6 animate-slide-up">
              <h2 className="text-lg font-bold text-white">Results</h2>

              <div className="flex flex-wrap items-center gap-8 justify-center">
                <ScoreRing score={result.score || 0} label="Accuracy" />
                <div>
                  <p className="text-sm text-dark-400 mb-1">Spoken Text</p>
                  <p className="text-white font-medium">
                    {result.spoken_text || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-dark-400 mb-1">Attempts</p>
                  <p className="text-white font-medium">
                    {result.attemptsDone || 0}/3 today
                  </p>
                </div>
              </div>

              {/* Mistakes highlight */}
              {result.mistakes && result.mistakes.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-dark-300 mb-2">
                    Word Analysis
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.mistakes.map((m, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 rounded text-sm font-medium
                          ${
                            m.type === "correct"
                              ? "text-emerald-400 bg-emerald-500/10"
                              : m.type === "wrong"
                                ? "text-red-400 bg-red-500/10"
                                : "text-amber-400 bg-amber-500/10"
                          }`}
                      >
                        {m.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {result.feedback && result.feedback.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-dark-300 mb-2">
                    Feedback
                  </p>
                  <ul className="space-y-1">
                    {result.feedback.map((f, i) => (
                      <li
                        key={i}
                        className="text-dark-400 text-sm flex items-start gap-2"
                      >
                        <span className="text-amber-400">•</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => speak(getCurrentSentence())}
                  className="btn-secondary flex items-center gap-2"
                >
                  <HiOutlineSpeakerWave className="w-4 h-4" /> 🔊 Listen Again
                </button>
                {currentDifficulty !== "hard" &&
                  result.allowSubmit !== false && (
                    <button onClick={handleNext} className="btn-primary">
                      Next →
                    </button>
                  )}
                {isDailyTask && (
  <button
    onClick={() =>
  navigate("/daily-tasks", {
    state: { refresh: true, module: "pronunciation" },
    replace: true,
  })
}
    className="btn-primary bg-green-600 hover:bg-green-700"
  >
    Back to Dashboard
  </button>
)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
