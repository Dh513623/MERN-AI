import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Grammar from './pages/Grammar';
import Pronunciation from './pages/Pronunciation';
import Fluency from './pages/Fluency';
import Vocabulary from './pages/Vocabulary';
import Speaking from './pages/Speaking';
import Chatbot from './pages/Chatbot';
import DailyTasks from './pages/DailyTasks';
import Progress from './pages/Progress';
import Adaptive from './pages/Adaptive';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes with dashboard layout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/grammar" element={<Grammar />} />
            <Route path="/pronunciation" element={<Pronunciation />} />
            <Route path="/fluency" element={<Fluency />} />
            <Route path="/vocabulary" element={<Vocabulary />} />
            <Route path="/speaking" element={<Speaking />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/daily-tasks" element={<DailyTasks />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/adaptive" element={<Adaptive />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
