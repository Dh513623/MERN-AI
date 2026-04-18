import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from "react";
import {
  HiOutlineHome,
  HiOutlineAcademicCap,
  HiOutlineMicrophone,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBookOpen,
  HiOutlineSpeakerWave,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { FaBrain } from 'react-icons/fa6';

const navItems = [
  { path: '/', label: 'Dashboard', icon: HiOutlineHome },
  { path: '/grammar', label: 'Grammar', icon: HiOutlineAcademicCap },
  { path: '/pronunciation', label: 'Pronunciation', icon: HiOutlineMicrophone },
  { path: '/fluency', label: 'Fluency', icon: HiOutlineSpeakerWave },
  { path: '/vocabulary', label: 'Vocabulary', icon: HiOutlineBookOpen },
  { path: '/speaking', label: 'Speaking', icon: HiOutlineChatBubbleLeftRight },
  { path: '/chatbot', label: 'AI Chatbot', icon: HiOutlineLightBulb },
  { path: '/daily-tasks', label: 'Daily Tasks', icon: HiOutlineCalendarDays },
  { path: '/progress', label: 'Progress', icon: HiOutlineChartBar },
  { path: '/adaptive', label: 'Adaptive', icon: FaBrain },
];


export default function Sidebar({ isOpen, onClose }) {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  // ✅ ADD HERE 👇
  useEffect(() => {
  const updateStreak = async () => {
    if (user?._id) {
      const res = await fetch(`/api/progress/update-streak/${user._id}`, {
        method: "POST"
      });

      const updatedUser = await res.json();

      // 🔥 THIS LINE FIXES YOUR ISSUE
      setUser(updatedUser);
    }
  };

  updateStreak();
}, [user?._id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50 
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">SpeakWise</h1>
              <p className="text-xs text-dark-400">AI English Learning</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-dark-400 hover:text-white">
            <HiOutlineXMark className="w-6 h-6" />
          </button>
        </div>

        {/* User Info */}
        {user && (
  <div className="px-6 py-4 border-b border-dark-700/50">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
        {user.name?.charAt(0)?.toUpperCase() || 'U'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {user.name}
        </p>
        <p className="text-xs text-dark-400 truncate">
          {user.level || 'Beginner'}
        </p>
      </div>
    </div>

    {/* 🔥 STREAK SECTION */}
    <div className="mt-3 flex flex-col items-start gap-1">
  <span className="badge-primary block">
    🔥 {user.dailyStreak || 0} day streak
  </span>

  <span className="block text-xs text-gray-400">
    🏆 Max streak: {user.maxStreak || 0} days
  </span>
</div>
  </div>
)}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                      : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-dark-700/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
