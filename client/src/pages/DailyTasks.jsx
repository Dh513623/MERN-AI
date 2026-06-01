import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getDailyTasks } from "../services/dailyTaskService";

import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorAlert from "../components/ui/ErrorAlert";

import {
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentCheck,
} from "react-icons/hi2";

export default function DailyTasks() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch tasks
  const fetchTasks = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getDailyTasks();
      const data = res.data;

      // ✅ FIX: correct mapping (your backend returns object)
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load daily tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [location.state?.refresh]);

  // ✅ Navigate to module
  const handleTaskClick = (task) => {
    if (task.completed) return;

    switch (task.type) {
      case "speaking":
        const speakingTask = task.exercise;

        navigate("/speaking", {
          state: {
            task: {
              ...task,
              question:
                speakingTask?.title ||
                speakingTask?.question ||
                speakingTask?.text,
              cuePoints: speakingTask?.cuePoints || [],
            },
            fromDailyTask: true,
          },
        });
        break;

      case "grammar":
        navigate("/grammar", {
          state: {
            task,
            fromDailyTask: true,
          },
        });
        break;

      case "fluency":
        if (!task?.exercise?.starter) {
          console.log("Invalid fluency task:", task);
          return;
        }

        navigate("/fluency", {
          state: {
            task: task,
            fromDailyTask: true,
          },
        });
        break;

      case "pronunciation":
        navigate("/pronunciation", {
          state: {
            task,
            fromDailyTask: true,
            source: "daily", // ⭐ ADD THIS
          },
        });
        break;

      case "vocabulary":
        navigate("/vocabulary", {
          state: {
            words: task.exercise, // ⭐ IMPORTANT FIX
            fromDailyTask: true,
          },
        });
        break;

      default:
        break;
    }
  };
  // ✅ Progress
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

  const progressPct = total > 0 ? (completed / total) * 100 : 0;

  const typeIcons = {
    grammar: "📝",
    pronunciation: "🎤",
    fluency: "🗣️",
    vocabulary: "📖",
    speaking: "🎯",
  };

  if (loading) {
    return <LoadingSpinner text="Loading today's tasks..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <HiOutlineCalendarDays className="w-6 h-6 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Daily Tasks</h1>
          <p className="text-dark-400">
            Your personalized learning plan for today
          </p>
        </div>
      </div>

      {/* Error */}
      {error && <ErrorAlert message={error} onRetry={fetchTasks} />}

      {/* Progress */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HiOutlineClipboardDocumentCheck className="w-5 h-5 text-primary-400" />
            <span className="text-sm font-semibold text-white">
              Today's Progress
            </span>
          </div>

          <span className="text-sm text-dark-400">
            {completed}/{total} completed
          </span>
        </div>

        <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {progressPct === 100 && (
          <p className="mt-3 text-emerald-400 text-sm font-semibold">
            🎉 All tasks completed! Great job!
          </p>
        )}
      </div>

      {/* Tasks */}
      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <div
              key={task._id || i}
              onClick={() => handleTaskClick(task)}
              className={`glass-card p-5 flex items-center gap-4 transition-all duration-300
                ${
                  task.completed
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer hover:border-primary-500/30 hover:scale-[1.01]"
                }`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${task.completed ? "bg-emerald-500/20" : "bg-dark-700"}
              `}
              >
                {task.completed ? (
                  <HiOutlineCheckCircle className="w-6 h-6 text-emerald-400" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-dark-500" />
                )}
              </div>

              {/* Info */}
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium ${
                    task.completed ? "text-dark-500 line-through" : "text-white"
                  }`}
                >
                  {typeIcons[task.type] || "📌"}{" "}
                  {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                </p>

                {!task.completed && (
                  <p className="text-sm text-dark-400 mt-1 truncate">
                    {task.exercise?.title ||
                      task.exercise?.question ||
                      task.exercise?.text ||
                      task.exercise?.word ||
                      ""}
                  </p>
                )}
              </div>

              {/* Status */}
              <span
                className={`badge text-xs flex-shrink-0
                ${task.completed ? "badge-success" : "badge-warning"}
              `}
              >
                {task.completed ? "Done" : "Start"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-dark-400">
            No tasks for today. Check back tomorrow!
          </p>
        </div>
      )}
    </div>
  );
}
