import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProgressReport, downloadReport } from '../services/progressService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, Legend,
} from 'recharts';
import { HiOutlineChartBar, HiOutlineArrowDownTray } from 'react-icons/hi2';

export default function Progress() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getProgressReport(user._id);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadReport(user._id);
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'progress-report.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your progress..." />;

  // Build chart data from report
  const overviewData = [
    { name: 'Grammar', score: report?.overallScores?.grammar ?? user?.grammarScore ?? 0 },
    { name: 'Pronunciation', score: report?.overallScores?.pronunciation ?? user?.pronunciationScore ?? 0 },
    { name: 'Fluency', score: report?.overallScores?.fluency ?? user?.fluencyScore ?? 0 },
    { name: 'Vocabulary', score: report?.overallScores?.vocabulary ?? user?.vocabularyScore ?? 0 },
    { name: 'Speaking', score: report?.overallScores?.speaking ?? user?.speakingScore ?? 0 },
  ];

  // Weekly trend data (from progress or mock)
  const weeklyData = report?.weekly || [
    { day: 'Mon', grammar: 6, pronunciation: 5, vocabulary: 7 },
    { day: 'Tue', grammar: 7, pronunciation: 6, vocabulary: 7 },
    { day: 'Wed', grammar: 6, pronunciation: 7, vocabulary: 8 },
    { day: 'Thu', grammar: 8, pronunciation: 7, vocabulary: 7 },
    { day: 'Fri', grammar: 7, pronunciation: 8, vocabulary: 8 },
    { day: 'Sat', grammar: 8, pronunciation: 8, vocabulary: 9 },
    { day: 'Sun', grammar: 9, pronunciation: 8, vocabulary: 9 },
  ];

  // Module-specific progress (from report or static)
  const moduleProgress = report?.modules || {};

  const radarData = overviewData.map((d) => ({ ...d, fullMark: 10 }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <HiOutlineChartBar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Progress Report</h1>
            <p className="text-dark-400">Track your improvement across all modules</p>
          </div>
        </div>
        <button onClick={handleDownload} disabled={downloading} className="btn-secondary flex items-center gap-2">
          <HiOutlineArrowDownTray className="w-5 h-5" />
          {downloading ? 'Downloading...' : 'Download PDF'}
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchReport} />}

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {overviewData.map((item) => {
          const color = item.score >= 7 ? 'text-emerald-400' : item.score >= 4 ? 'text-amber-400' : 'text-red-400';
          return (
            <div key={item.name} className="glass-card p-4 text-center">
              <p className="text-xs text-dark-400 mb-1">{item.name}</p>
              <p className={`text-2xl font-bold ${color}`}>{item.score}<span className="text-sm text-dark-500">/10</span></p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Overall Scores</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis Domain={[0, 10]} stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
              />
              <Bar dataKey="score" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Skills Radar</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <PolarRadiusAxis domain={[0, 10]} stroke="#334155" fontSize={10} />
              <Radar name="Score" dataKey="score" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly trend */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Weekly Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
            <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
            />
            <Legend />
            <Line type="monotone" dataKey="grammar" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa' }} />
            <Line type="monotone" dataKey="pronunciation" stroke="#f472b6" strokeWidth={2} dot={{ fill: '#f472b6' }} />
            <Line type="monotone" dataKey="vocabulary" stroke="#34d399" strokeWidth={2} dot={{ fill: '#34d399' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">💡 Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overviewData.map((item) => (
            <div key={item.name} className={`p-4 rounded-xl ${item.score >= 7 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
              <p className={`text-sm font-semibold ${item.score >= 7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {item.score >= 7 ? '✅' : '⚠️'} {item.name}
              </p>
              <p className="text-xs text-dark-400 mt-1">
                {item.score >= 7
                  ? `Strong performance — keep it up!`
                  : `Needs improvement — practice more ${item.name.toLowerCase()} exercises.`
                }
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
