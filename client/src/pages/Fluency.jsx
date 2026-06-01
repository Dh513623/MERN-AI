import { useState, useMemo } from "react";
import {
  generateFluencyExercise,
  evaluateFluency,
} from "../services/fluencyService";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorAlert from "../components/ui/ErrorAlert";
import ScoreRing from "../components/ui/ScoreRing";
import {
  HiOutlineSpeakerWave,
  HiOutlineMicrophone,
  HiOutlineSparkles,
  HiOutlinePencilSquare,
} from "react-icons/hi2";
import { useLocation } from "react-router-dom";

import { useNavigate } from "react-router-dom";
import { completeTask } from "../services/dailyTaskService";

export default function Fluency() {
  const navigate = useNavigate();
  const location = useLocation();

  const dailyTask = location.state?.task;
  const fromDailyTask = location.state?.fromDailyTask;

  console.log("location.state:", location.state);
  console.log("TASK:", dailyTask);
  console.log("dailyTask:", dailyTask);

  const [exercise, setExercise] = useState(null);
  const activeExercise = useMemo(() => {
    if (fromDailyTask && dailyTask) {
      return {
        starter:
          dailyTask.exercise?.starter ||
          dailyTask.exercise?.text ||
          "Start here",

        sentences: dailyTask.exercise?.sentences || [],

        instruction:
          dailyTask.exercise?.instruction ||
          "Combine the sentences into a fluent paragraph",
      };
    }

    return exercise;
  }, [fromDailyTask, dailyTask, exercise]);

  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();
  const { speak, isSpeaking } = useTextToSpeech();

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

  const handleGenerate = async () => {
    if (fromDailyTask) return;
    setError("");
    setLoading(true);
    setResult(null);
    setUserAnswer("");
    resetTranscript();
    try {
      const res = await generateFluencyExercise();
      setExercise(res.data.exercise);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate exercise");
    } finally {
      setLoading(false);
    }
  };
  const handleSpeakToggle = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel(); // STOP speech
    } else {
      speak(text); // START speech
    }
  };

  const handleEvaluate = async () => {
    const text = userAnswer.trim() || transcript.trim();

    if (!text) {
      setError("Please write or speak your answer first.");
      return;
    }

    setError("");
    setEvaluating(true);

    try {
      const res = await evaluateFluency(text);

      setResult(res.data);
    } catch (err) {
      console.log("FLUENCY ERROR:", err);
      setError(err.response?.data?.message || "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  const handleUseVoiceInput = () => {
    if (transcript) {
      setUserAnswer((prev) => (prev ? prev + " " + transcript : transcript));
      resetTranscript();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <HiOutlineSpeakerWave className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Fluency Training</h1>
          <p className="text-dark-400">
            Combine sentences, expand ideas, and improve your writing flow
          </p>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Generate button */}
      {!fromDailyTask && !activeExercise && !loading && (
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">🗣️</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Fluency Exercise
          </h2>
          <p className="text-dark-400 mb-6">
            Get a set of sentences to combine, expand, remove repetitions, and
            create a story
          </p>
          <button onClick={handleGenerate} className="btn-primary">
            <HiOutlineSparkles className="w-5 h-5 inline mr-2" />
            Generate Exercise
          </button>
        </div>
      )}

      {loading && <LoadingSpinner text="Generating exercise..." />}

      {/* Exercise */}
      {activeExercise && !result && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              📝 Your Exercise
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
                <p className="text-xs text-primary-400 font-semibold mb-1">
                  STARTER
                </p>
                <p className="text-white">{activeExercise.starter}</p>
              </div>
              {activeExercise.sentences?.map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-dark-800">
                  <p className="text-xs text-dark-400 font-semibold mb-1">
                    SENTENCE {i + 1}
                  </p>
                  <p className="text-dark-200">{s}</p>
                </div>
              ))}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400 font-semibold mb-1">
                  INSTRUCTION
                </p>
                <p className="text-amber-200 text-sm">
                  {activeExercise.instruction}
                </p>
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <HiOutlinePencilSquare className="w-5 h-5" /> Your Response
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2 rounded-lg transition-all ${isListening ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-dark-700 text-dark-300 hover:text-white"}`}
                >
                  <HiOutlineMicrophone className="w-5 h-5" />
                </button>
                {transcript && (
                  <button
                    onClick={handleUseVoiceInput}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    Use voice input
                  </button>
                )}
              </div>
            </div>

            {transcript && (
              <div className="mb-3 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 text-sm text-primary-300">
                🎤 Voice: {transcript}
              </div>
            )}

            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="textarea-field min-h-[200px]"
              placeholder="Write your combined story here (minimum 7-8 lines)..."
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleGenerate}
                className="btn-secondary text-sm"
              >
                New Exercise
              </button>
              <button
                onClick={handleEvaluate}
                disabled={evaluating}
                className="btn-primary"
              >
                {evaluating ? "Evaluating..." : "Submit for Evaluation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6 animate-slide-up">
          <div className="glass-card p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-6">
              Fluency Evaluation 🎯
            </h2>
            <div className="flex justify-center">
              <ScoreRing
                score={result.score || 0}
                size={100}
                label="Fluency Score"
              />
            </div>
          </div>

          {result.strengths?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-emerald-400 font-semibold mb-3">
                ✅ Strengths
              </h3>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="text-dark-300 text-sm flex items-start gap-2"
                  >
                    <span className="text-emerald-400">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.weaknesses?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-amber-400 font-semibold mb-3">
                ⚠️ Areas to Improve
              </h3>
              <ul className="space-y-2">
                {result.weaknesses.map((w, i) => (
                  <li
                    key={i}
                    className="text-dark-300 text-sm flex items-start gap-2"
                  >
                    <span className="text-amber-400">•</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.improved_version && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-primary-400 font-semibold">
                  ✨ Improved Version
                </h3>
                <button
                  onClick={() => {
                    if (isSpeaking) {
                      window.speechSynthesis.cancel();
                    } else {
                      speak(result.improved_version);
                    }
                  }}
                  className="btn-ghost text-sm"
                >
                  <HiOutlineSpeakerWave className="w-4 h-4 inline mr-1" />{" "}
                  {isSpeaking ? "⏹ Stop" : "🔊 Listen"}
                </button>
              </div>
              <p className="text-dark-200 text-sm leading-relaxed">
                {result.improved_version}
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setResult(null);
              setUserAnswer("");
              if (!fromDailyTask) {
                setExercise(null);
              }
            }}
          >
            Try Another Exercise
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
      )}
    </div>
  );
}
