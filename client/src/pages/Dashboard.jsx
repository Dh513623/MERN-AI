import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDailyTasks } from '../services/dailyTaskService';
import { Link } from 'react-router-dom';
import ScoreRing from '../components/ui/ScoreRing';
import {
  HiOutlineAcademicCap,
  HiOutlineMicrophone,
  HiOutlineSpeakerWave,
  HiOutlineBookOpen,
  HiOutlineChatBubbleLeftRight,
  HiOutlineFire,
  HiOutlineTrophy,
  HiOutlineArrowTrendingUp,
  HiOutlineCheckCircle,
  HiOutlineChevronRight,
} from 'react-icons/hi2';

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getDailyTasks();
        const data = res.data;
        // Handle both array and object response formats
        if (Array.isArray(data)) {
          setTasks(data);
        } else if (data?.tasks) {
          setTasks(data.tasks);
        }
      } catch {
        // Silently fail for dashboard preview
      } finally {
        setTaskLoading(false);
      }
    };
    fetchTasks();
  }, []);
  

  const levelConfig = {
    Beginner: { color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    Intermediate: { color: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/15', text: 'text-amber-400' },
    Advanced: { color: 'from-purple-400 to-pink-500', bg: 'bg-purple-500/15', text: 'text-purple-400' },
  };

  const level = levelConfig[user?.level] || levelConfig.Beginner;

  const moduleCards = [
    { name: 'Grammar', score: user?.grammarScore || 0, icon: HiOutlineAcademicCap, path: '/grammar', color: 'from-blue-500 to-cyan-500' },
    { name: 'Pronunciation', score: user?.pronunciationScore || 0, icon: HiOutlineMicrophone, path: '/pronunciation', color: 'from-pink-500 to-rose-500' },
    { name: 'Fluency', score: user?.fluencyScore || 0, icon: HiOutlineSpeakerWave, path: '/fluency', color: 'from-amber-500 to-orange-500' },
    { name: 'Vocabulary', score: user?.vocabularyScore || 0, icon: HiOutlineBookOpen, path: '/vocabulary', color: 'from-emerald-500 to-teal-500' },
    { name: 'Speaking', score: user?.speakingScore || 0, icon: HiOutlineChatBubbleLeftRight, path: '/speaking', color: 'from-purple-500 to-violet-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, <span className="gradient-text">{user?.name || 'Learner'}</span> 👋
          </h1>
          <p className="text-dark-400 mt-2">Keep up the great work! Here's your learning overview.</p>
          
          <div className="flex flex-wrap gap-4 mt-6">
            <div className={`${level.bg} px-4 py-2 rounded-xl flex items-center gap-2`}>
              <HiOutlineTrophy className={`w-5 h-5 ${level.text}`} />
              <span className={`font-semibold text-sm ${level.text}`}>{user?.level || 'Beginner'}</span>
            </div>
            <div className="bg-orange-500/15 px-4 py-2 rounded-xl flex items-center gap-2">
              <HiOutlineFire className="w-5 h-5 text-orange-400" />
              <span className="font-semibold text-sm text-orange-400">{user?.dailyStreak || 0} Day Streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineArrowTrendingUp className="w-5 h-5 text-primary-400" />
          Your Scores
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {moduleCards.map((mod) => (
            <Link key={mod.name} to={mod.path} className="glass-card-hover p-5 group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-3 
                group-hover:scale-110 transition-transform duration-300`}>
                <mod.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-dark-400 font-medium mb-1">{mod.name}</p>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-white">{mod.score}</span>
                <span className="text-xs text-dark-500 mb-1">/10</span>
              </div>
              <div className="mt-2 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${mod.color} rounded-full transition-all duration-1000`}
                  style={{ width: `${(mod.score / 10) * 100}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Daily Tasks Preview */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400" />
            Today's Tasks
          </h2>
          <Link to="/daily-tasks" className="btn-ghost text-sm flex items-center gap-1">
            View All <HiOutlineChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {taskLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task, i) => (
              <div key={task._id || i} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${task.completed ? 'bg-emerald-500/20' : 'bg-dark-700'}`}>
                  {task.completed ? (
                    <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-dark-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.completed ? 'text-dark-400 line-through' : 'text-white'}`}>
                    {task.title || task.type || `Task ${i + 1}`}
                  </p>
                </div>
                <span className={`badge text-xs ${task.completed ? 'badge-success' : 'badge-warning'}`}>
                  {task.completed ? 'Done' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-dark-400">No tasks for today. Check back later!</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Practice Speaking', path: '/speaking', icon: '🎤', color: 'from-primary-600 to-purple-600' },
          { label: 'AI Chat', path: '/chatbot', icon: '💬', color: 'from-emerald-600 to-teal-600' },
          { label: 'View Progress', path: '/progress', icon: '📊', color: 'from-amber-600 to-orange-600' },
          { label: 'Download Report', path: '/progress', icon: '📄', color: 'from-pink-600 to-rose-600' },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.path}
            className={`p-5 rounded-2xl bg-gradient-to-br ${action.color} hover:opacity-90 transition-all duration-300 
              transform hover:scale-[1.02] active:scale-[0.98] group`}
          >
            <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform inline-block">{action.icon}</span>
            <p className="text-sm font-semibold text-white">{action.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
