import { useState, useMemo, useEffect } from "react";
import { convertToWav } from "../utils/audioConverter";
import {
  generateSpeakingTopic,
  evaluateSpeaking,
} from "../services/speakingService";

import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorAlert from "../components/ui/ErrorAlert";
import ScoreRing from "../components/ui/ScoreRing";

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
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

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

    resetRecording();
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

      if (!audioBlob && !transcript) {
        setError("Please provide speech first.");
        setEvaluating(false);
        return;
      }

      const formData = new FormData();

      let finalAudio = audioBlob;

      if (audioBlob?.type === "audio/webm") {
        finalAudio = await convertToWav(audioBlob);
      }

      formData.append("mode", "evaluate");
      formData.append("topicId", activeTopic.topicId);
      formData.append("sentence", activeTopic.title);
      formData.append("cuePoints", JSON.stringify(activeTopic.cuePoints || []));

      if (finalAudio) {
        formData.append("audio", finalAudio, "recording.wav");
      }

      const res = await evaluateSpeaking(formData);
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

          {/* RECORD UI */}
          <div className="glass-card p-6 flex flex-col items-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? "mic-btn-recording" : "mic-btn"}
            >
              <HiOutlineMicrophone className="w-7 h-7" />
            </button>

            <p className="text-sm text-dark-400">
              {isRecording ? "Recording..." : "Tap to speak"}
            </p>

            {audioBlob && (
              <audio controls src={URL.createObjectURL(audioBlob)} />
            )}

            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="btn-primary"
            >
              {evaluating ? "Evaluating..." : "Submit"}
            </button>
          </div>

          <button onClick={handleGenerate} className="btn-secondary">
            Next Topic
          </button>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="space-y-6 animate-slide-up">
          <div className="glass-card p-6 text-white">
            <h2 className="text-xl font-bold text-center mb-4">Results 🎯</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <ScoreRing score={result.overallScore || 0} label="Overall" />
            </div>
          </div>

          {result.improved_version && (
            <div className="glass-card p-6 text-white">
              <h3 className="text-primary-400 mb-2">Improved Version</h3>
              <p>{result.improved_version}</p>

              <button
                onClick={() =>
                  isSpeaking
                    ? window.speechSynthesis.cancel()
                    : speak(result.improved_version)
                }
                className="btn-ghost mt-3"
              >
                <HiOutlineSpeakerWave className="inline w-4 h-4" /> Listen
              </button>
            </div>
          )}

          {fromDailyTask && (
  <button
    onClick={async () => {
      try {
        await completeTask(dailyTask._id);
      } catch (e) {
        console.log("completeTask ignored:", e?.response?.data);
      }

      navigate("/daily-tasks", {
        state: { refresh: true },
        replace: true,
      });
    }}
    className="btn-primary mt-4"
  >
    Back to Daily Tasks
  </button>
)}
        </div>
      )}
    </div>
  );
}
