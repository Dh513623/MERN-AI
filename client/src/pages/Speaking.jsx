import { useState, useMemo, useEffect } from "react";
import {
  generateSpeakingTopic,
  evaluateSpeaking,
} from "../services/speakingService";
import ScoreRing from "../components/ui/ScoreRing";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorAlert from "../components/ui/ErrorAlert";

import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineMicrophone,
  HiOutlineSpeakerWave,
  HiOutlineArrowPath,
} from "react-icons/hi2";

import { useLocation, useNavigate } from "react-router-dom";
import { completeTask } from "../services/dailyTaskService";

export default function Speaking() {
  const [topic, setTopic] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState("record");

  const location = useLocation();
  const navigate = useNavigate();
  const dailyTask = location.state?.task;
  const fromDailyTask = location.state?.fromDailyTask;
  console.log("dailyTask:", dailyTask);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const { speak, isSpeaking } = useTextToSpeech();

  useEffect(() => {
    if (dailyTask?.completed === true) {
      navigate("/daily-tasks", { replace: true });
    }
  }, [dailyTask?.completed]);

  useEffect(() => {
    console.log("Transcript:", transcript);
  }, [transcript]);
  // ✅ SINGLE SOURCE OF TRUTH
  const activeTopic = useMemo(() => {
    if (fromDailyTask && dailyTask) {
      return {
        topicId: dailyTask.taskId,

        title:
          dailyTask.exercise?.title ||
          dailyTask.question ||
          dailyTask.title ||
          "Speaking Practice",

        cuePoints: dailyTask.exercise?.cuePoints || [],

        difficulty: dailyTask.exercise?.difficulty || "medium",
      };
    }

    return topic;
  }, [fromDailyTask, dailyTask, topic]);

  // ===================== GENERATE =====================
  const handleGenerate = async () => {
    setError("");
    setLoading(true);
    setResult(null);
    resetTranscript();

    try {
      // If coming from DailyTask → DO NOT regenerate
      if (fromDailyTask && dailyTask) {
        setLoading(false);
        return;
      }

      const res = await generateSpeakingTopic();
      setTopic(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate topic");
    } finally {
      setLoading(false);
    }
  };

  // ===================== EVALUATE =====================
  const handleEvaluate = async () => {
    setError("");
    setEvaluating(true);

    try {
      if (!activeTopic) {
        setError("Topic not loaded");
        setEvaluating(false);
        return;
      }

      const finalTranscript = transcript?.trim();

if (!finalTranscript) {
  setError("Please provide speech first.");
  setEvaluating(false);
  return;
}

      const payload = {
        mode: "evaluate",
        topicId: activeTopic.topicId,
        transcript: finalTranscript,
      };

      const res = await evaluateSpeaking(payload);
      setResult(res.data);

      if (res.data.improved_version) {
        setTimeout(() => speak(res.data.improved_version), 500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  const diffColors = {
    easy: "badge-success",
    medium: "badge-warning",
    hard: "badge-danger",
  };

  // ===================== UI =====================
  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
          <HiOutlineChatBubbleLeftRight className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Speaking Evaluation</h1>
          <p className="text-dark-400">Speak and get AI feedback instantly</p>
        </div>
      </div>

      {error && !result && <ErrorAlert message={error} />}

      {/* EMPTY STATE */}
      {(!activeTopic?.title || !activeTopic) && !loading && (
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Speaking Practice
          </h2>
          <p className="text-dark-400 mb-6">Get a topic and start speaking</p>
          <button onClick={handleGenerate} className="btn-primary">
            Get Topic
          </button>
        </div>
      )}

      {loading && <LoadingSpinner text="Finding a topic..." />}

      {/* TASK UI */}
      {activeTopic && !result && (
        <div className="space-y-6">
          {/* TOPIC CARD */}
          <div className="glass-card p-6">
            <span
              className={`${diffColors[activeTopic.difficulty] || "badge-primary"}`}
            >
              {activeTopic.difficulty}
            </span>

            <h2 className="text-xl font-bold text-white mt-3">
              {activeTopic.title}
            </h2>

            {activeTopic.cuePoints?.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-dark-300">
                {activeTopic.cuePoints.map((cp, i) => (
                  <li key={i}>
                    {i + 1}. {cp}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* SPEAKING CARD */}
          <div className="glass-card p-8">
            <div className="flex flex-col items-center">
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening();
                    return;
                  }

                  stopListening();
                  resetTranscript();

                  setTimeout(() => {
                    startListening();
                  }, 300);
                }}
                
                className={`
        w-28 h-28 rounded-full flex items-center justify-center
        transition-all duration-300
        ${
          isListening
            ? "bg-red-500 animate-pulse shadow-[0_0_40px_rgba(239,68,68,0.5)]"
            : "bg-gradient-to-r from-purple-500 to-violet-500"
        }
      `}
              >
                <HiOutlineMicrophone className="w-12 h-12 text-white" />
              </button>

              <h3 className="mt-6 text-xl font-bold text-white">
                {isListening ? "Listening..." : "Ready to Speak"}
              </h3>

              <p className="text-dark-400 mt-2 text-center">
                {isListening
                  ? "Speak naturally about the topic"
                  : "Click the microphone and start speaking"}
              </p>

              {!isListening && transcript && (
                <div className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                  ✓ Speech captured successfully
                </div>
              )}
              {transcript && (
  <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
    <p className="text-dark-300 mb-2">Your Speech:</p>
    <p className="leading-6">{transcript}</p>
  </div>
)}

              <div className="flex gap-3 mt-6">
                {transcript && (
                  <button
                    onClick={() => {
                      stopListening();
                      resetTranscript();
                    }}
                    className="btn-secondary"
                  >
                    Re-record
                  </button>
                )}

                <button
                  onClick={handleEvaluate}
                  disabled={!transcript || evaluating}
                  className="btn-primary"
                >
                  {evaluating ? "Evaluating..." : "Submit Response"}
                </button>
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} className="btn-secondary">
            Next Topic
          </button>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="space-y-6 animate-slide-up">
          {/* OVERALL SCORE */}
          <div className="glass-card p-8 text-center">
            <div className="flex justify-center mb-5">
              <ScoreRing
                score={result.overallScore || 0}
                label="Overall Score"
              />
            </div>

            <h2 className="text-2xl font-bold text-white">
              Speaking Assessment
            </h2>

            <p className="text-dark-400 mt-2">AI Evaluation Complete</p>
          </div>

          {/* SKILL BREAKDOWN */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">
                Skill Breakdown
              </h3>

              <span className="badge-primary">{result.overallScore}/10</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <ScoreRing score={result.grammarScore || 0} label="Grammar" />

              <ScoreRing score={result.fluencyScore || 0} label="Fluency" />

              <ScoreRing
                score={result.vocabularyScore || 0}
                label="Vocabulary"
              />

              <ScoreRing
                score={result.pronunciationScore || 0}
                label="Pronunciation"
              />

              <ScoreRing
                score={result.confidenceScore || 0}
                label="Confidence"
              />
            </div>
          </div>

          {/* QUICK ANALYSIS */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <h3 className="text-green-400 font-semibold mb-3">
                ✓ Strong Areas
              </h3>

              <div className="space-y-2 text-dark-200">
                {(result.vocabularyScore || 0) >= 6 && (
                  <p>• Good vocabulary usage</p>
                )}

                {(result.pronunciationScore || 0) >= 6 && (
                  <p>• Clear pronunciation</p>
                )}

                {(result.confidenceScore || 0) >= 6 && (
                  <p>• Good speaking confidence</p>
                )}

                {(result.fluencyScore || 0) >= 6 && <p>• Smooth fluency</p>}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-orange-400 font-semibold mb-3">
                ⚠ Improve Next
              </h3>

              <div className="space-y-2 text-dark-200">
                {(result.grammarScore || 0) < 6 && (
                  <p>• Improve grammar accuracy</p>
                )}

                {(result.fluencyScore || 0) < 6 && (
                  <p>• Reduce pauses while speaking</p>
                )}

                {(result.vocabularyScore || 0) < 6 && (
                  <p>• Use richer vocabulary</p>
                )}

                {(result.pronunciationScore || 0) < 6 && (
                  <p>• Focus on pronunciation clarity</p>
                )}

                {(result.confidenceScore || 0) < 6 && (
                  <p>• Speak with more confidence</p>
                )}
              </div>
            </div>
          </div>

          {/* IMPROVED RESPONSE */}
          {result.improved_version && (
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-primary-400 font-semibold text-lg">
                  ✨ Improved Response
                </h3>

                <button
                  onClick={() =>
                    isSpeaking
                      ? window.speechSynthesis.cancel()
                      : speak(result.improved_version)
                  }
                  className="btn-ghost"
                >
                  <HiOutlineSpeakerWave className="w-5 h-5" />
                </button>
              </div>

              <p className="text-dark-200 leading-8">
                {result.improved_version}
              </p>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setResult(null);
                resetTranscript();
              }}
              className="btn-secondary"
            >
              Try Again
            </button>

            {!fromDailyTask && (
              <button onClick={handleGenerate} className="btn-primary">
                New Topic
              </button>
            )}
          </div>

          {fromDailyTask && (
            <button
              onClick={async () => {
                try {
                  await completeTask(dailyTask._id);
                } catch {}

                navigate("/daily-tasks", {
                  state: { refresh: true },
                  replace: true,
                });
              }}
              className="btn-primary"
            >
              Back to Daily Tasks
            </button>
          )}
        </div>
      )}
    </div>
  );
}
