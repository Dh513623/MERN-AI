import { useState, useEffect } from 'react';
import { getDailyTasks, completeTask } from '../services/dailyTaskService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlineClipboardDocumentCheck } from 'react-icons/hi2';

export default function DailyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDailyTasks();
      const data = res.data;
      if (Array.isArray(data)) {
        setTasks(data);
      } else if (data?.tasks) {
        setTasks(data.tasks);
      } else if (data?.date && data?.tasks) {
        setTasks(data.tasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load daily tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await completeTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, completed: true } : t))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete task');
    }
  };

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const progressPct = total > 0 ? (completed / total) * 100 : 0;

  const typeIcons = {
    grammar: '📝',
    pronunciation: '🎤',
    fluency: '🗣️',
    vocabulary: '📖',
    speaking: '🎯',
  };

  if (loading) return <LoadingSpinner text="Loading today's tasks..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <HiOutlineCalendarDays className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Tasks</h1>
          <p className="text-dark-400">Your personalized learning plan for today</p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchTasks} />}

      {/* Progress bar */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HiOutlineClipboardDocumentCheck className="w-5 h-5 text-primary-400" />
            <span className="text-sm font-semibold text-white">Today's Progress</span>
          </div>
          <span className="text-sm text-dark-400">{completed}/{total} completed</span>
        </div>
        <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {progressPct === 100 && (
          <p className="mt-3 text-emerald-400 text-sm font-semibold">🎉 All tasks completed! Great job!</p>
        )}
      </div>

      {/* Task list */}
      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <div
              key={task._id || i}
              className={`glass-card p-5 flex items-center gap-4 transition-all duration-300
                ${task.completed ? 'opacity-60' : 'hover:border-primary-500/30'}`}
            >
              <button
                onClick={() => !task.completed && handleComplete(task._id)}
                disabled={task.completed}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                  ${task.completed
                    ? 'bg-emerald-500/20'
                    : 'bg-dark-700 hover:bg-primary-500/20 cursor-pointer'
                  }`}
              >
                {task.completed ? (
                  <HiOutlineCheckCircle className="w-6 h-6 text-emerald-400" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-dark-500" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`font-medium ${task.completed ? 'text-dark-500 line-through' : 'text-white'}`}>
                  {typeIcons[task.type] || '📌'} {task.title || task.type || `Task ${i + 1}`}
                </p>
                {task.description && (
                  <p className="text-sm text-dark-400 mt-1 truncate">{task.description}</p>
                )}
              </div>

              <span className={`badge text-xs flex-shrink-0 ${task.completed ? 'badge-success' : 'badge-warning'}`}>
                {task.completed ? 'Done' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-dark-400">No tasks for today. Check back tomorrow!</p>
        </div>
      )}
    </div>
  );
}
