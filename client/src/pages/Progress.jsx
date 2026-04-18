import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProgressReport, downloadReport } from '../services/progressService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

  // 👉 Enable PDF mode (for white UI + hide button)
  document.body.classList.add("pdf-mode");

  const input = document.getElementById("report-content");

  const canvas = await html2canvas(input, {
    scale: 2,
    backgroundColor: "#ffffff", // ⭐ fix grey issue
    useCORS: true
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const imgWidth = 210;
  const pageHeight = 295;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Multi-page support
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save("progress-report.pdf");

  // 👉 Disable PDF mode
  document.body.classList.remove("pdf-mode");

  setDownloading(false);
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
const weeklyData = (report?.weekly || []).map((d) => ({
  day: d.day,
  grammar: d.grammar || 0,
  pronunciation: d.pronunciation || 0,
  vocabulary: d.vocabulary || 0,
  fluency: d.fluency || 0,
  speaking: d.speaking || 0,
}));

  // Module-specific progress (from report or static)
  const moduleProgress = report?.modules || {};

  const radarData = overviewData.map((d) => ({ ...d, fullMark: 10 }));


   
    return (
  <div>

    {/* 🔴 HEADER (NOT IN PDF) */}
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

      {/* ❌ This button should NOT go in PDF */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="btn-secondary flex items-center gap-2 no-pdf"
      >
        <HiOutlineArrowDownTray className="w-5 h-5" />
        {downloading ? 'Downloading...' : 'Download PDF'}
      </button>

    </div>

    {/* ✅ PDF CONTENT STARTS HERE */}
    <div id="report-content" className="space-y-6 p-6">

      {/* ✅ Add user details here */}
     <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] border border-gray-700 rounded-2xl p-6 shadow-lg text-white transition-all duration-300 hover:scale-[1.02]">

  {/* Title */}
  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
    👤 User Details
  </h2>

  {/* Grid Info */}
  <div className="grid grid-cols-2 gap-4 text-sm">

    <div className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition">
      <p className="text-gray-400 text-xs">Name</p>
      <p className="font-medium">{user?.name}</p>
    </div>

    <div className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition">
      <p className="text-gray-400 text-xs">Email</p>
      <p className="font-medium break-words">{user?.email}</p>
    </div>

    <div className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition">
      <p className="text-gray-400 text-xs">Level</p>
      <p className="font-medium">{user?.level || "Beginner"}</p>
    </div>

    <div className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition">
      <p className="text-gray-400 text-xs">Date</p>
      <p className="font-medium">
        {new Date().toLocaleDateString()}
      </p>
    </div>

  </div>
</div>
      {/* ✅ Your existing cards, charts, insights BELOW */}

      {error && <ErrorAlert message={error} onRetry={fetchReport} />}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
  {overviewData.map((item) => {
    const color =
      item.score >= 7
        ? 'text-emerald-400'
        : item.score >= 4
        ? 'text-amber-400'
        : 'text-red-400';

    return (
      <div
        key={item.name}
        className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center"
      >
        <p className="text-xs text-gray-400 mb-1">{item.name}</p>
        <p className={`text-2xl font-bold ${color}`}>
          {item.score}
          <span className="text-sm text-gray-500">/10</span>
        </p>
      </div>
    );
  })}
</div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

  {/* Bar Chart */}
  <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-white">
    <h2 className="text-lg font-semibold mb-4">Overall Scores</h2>

    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={overviewData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
        <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#fff',
          }}
        />
        <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>

  {/* Radar Chart */}
  <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-white">
    <h2 className="text-lg font-semibold mb-4">Skills Radar</h2>

    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
        <PolarRadiusAxis domain={[0, 10]} stroke="#334155" fontSize={10} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#818cf8"
          fill="#818cf8"
          fillOpacity={0.4}
        />
      </RadarChart>
    </ResponsiveContainer>
  </div>

</div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-white">
  <h2 className="text-lg font-semibold mb-4">Weekly Trend</h2>

  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={weeklyData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
      <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
      <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={12} />
      <Tooltip
        contentStyle={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          color: '#fff',
        }}
      />
     <Legend formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />

      <Line type="monotone" dataKey="grammar" stroke="#60a5fa" strokeWidth={2} />
      <Line type="monotone" dataKey="pronunciation" stroke="#f472b6" strokeWidth={2} />
      <Line type="monotone" dataKey="vocabulary" stroke="#34d399" strokeWidth={2} />
      <Line type="monotone" dataKey="fluency" stroke="#facc15" strokeWidth={2} />
<Line type="monotone" dataKey="speaking" stroke="#fb923c" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
</div>
      {/* Insights */}
      
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-white">
  <h2 className="text-lg font-semibold mb-4">💡 Insights</h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {overviewData.map((item) => (
      <div
        key={item.name}
        className={`p-4 rounded-xl border ${
          item.score >= 7
            ? 'border-emerald-500 bg-slate-800'
            : 'border-amber-500 bg-slate-800'
        }`}
      >
        <p
          className={`text-sm font-semibold ${
            item.score >= 7 ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          {item.score >= 7 ? '✅' : '⚠️'} {item.name}
        </p>

        <p className="text-xs text-gray-400 mt-1">
          {item.score >= 7
            ? `Strong performance — keep it up!`
            : `Needs improvement — practice more ${item.name.toLowerCase()} exercises.`}
        </p>
      </div>
    ))}
  </div>
</div>
    </div>
    </div>
  );
}
