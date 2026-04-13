import { useState, useEffect } from 'react';
import { getTodayPlan } from '../services/adaptiveService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { Link } from 'react-router-dom';
import { FaBrain } from 'react-icons/fa6';
import {
  HiOutlineAcademicCap,
  HiOutlineMicrophone,
  HiOutlineSpeakerWave,
  HiOutlineBookOpen,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

export default function Adaptive() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getTodayPlan();
      setPlan(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load adaptive plan');
    } finally {
      setLoading(false);
    }
  };

  const moduleConfig = {
    grammar: { icon: HiOutlineAcademicCap, color: 'from-blue-500 to-cyan-500', path: '/grammar' },
    pronunciation: { icon: HiOutlineMicrophone, color: 'from-pink-500 to-rose-500', path: '/pronunciation' },
    fluency: { icon: HiOutlineSpeakerWave, color: 'from-amber-500 to-orange-500', path: '/fluency' },
    vocabulary: { icon: HiOutlineBookOpen, color: 'from-emerald-500 to-teal-500', path: '/vocabulary' },
    speaking: { icon: HiOutlineChatBubbleLeftRight, color: 'from-purple-500 to-violet-500', path: '/speaking' },
  };

  if (loading) return <LoadingSpinner text="Generating adaptive plan..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <FaBrain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Adaptive Learning</h1>
          <p className="text-dark-400">AI-curated tasks based on your performance</p>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchPlan} />}

      {plan && (
        <div className="space-y-6">
          {/* Focus areas */}
          {plan.focusAreas && plan.focusAreas.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">🎯 Focus Areas</h2>
              <div className="flex flex-wrap gap-3">
                {plan.focusAreas.map((area, i) => (
                  <span key={i} className="badge-warning">{area}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended tasks */}
          {plan.tasks && plan.tasks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">📋 Recommended Tasks</h2>
              <div className="space-y-3">
                {plan.tasks.map((task, i) => {
                  const config = moduleConfig[task.type] || moduleConfig.grammar;
                  const Icon = config.icon;
                  return (
                    <Link
                      key={i}
                      to={config.path}
                      className="glass-card-hover p-5 flex items-center gap-4 group"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0
                        group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold">{task.title || task.type}</p>
                        {task.reason && <p className="text-dark-400 text-sm mt-1">{task.reason}</p>}
                      </div>
                      <HiOutlineArrowRight className="w-5 h-5 text-dark-500 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* If plan has other structure */}
          {!plan.tasks && !plan.focusAreas && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Today's Plan</h2>
              <div className="text-dark-300 text-sm">
                <pre className="whitespace-pre-wrap">{JSON.stringify(plan, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">⚡ Quick Start</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(moduleConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <Link
                    key={key}
                    to={config.path}
                    className={`p-4 rounded-xl bg-gradient-to-br ${config.color} bg-opacity-20 text-center hover:opacity-80 transition-opacity`}
                  >
                    <Icon className="w-6 h-6 text-white mx-auto mb-2" />
                    <p className="text-xs font-semibold text-white capitalize">{key}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!plan && !error && (
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">🧠</div>
          <p className="text-dark-400">Complete some exercises first so the AI can build your personalized plan!</p>
        </div>
      )}
    </div>
  );
}
